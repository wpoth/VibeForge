"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import {
    BarChart3,
    CalendarDays,
    Clock3,
    Disc3,
    Loader2,
    Music2,
    RefreshCw,
    Trophy,
    UserRound,
} from "lucide-react";

type SpotifyTimeRange = "short_term" | "medium_term" | "long_term";

type RankedArtist = {
    rank: number;
    id: string;
    name: string;
    imageUrl: string | null;
    spotifyUrl: string | null;
};

type RankedTrack = {
    rank: number;
    id: string;
    name: string;
    artistName: string;
    albumName: string;
    imageUrl: string | null;
    spotifyUrl: string | null;
};

type RecentCounterItem = {
    id: string;
    name: string;
    imageUrl: string | null;
    spotifyUrl: string | null;
    count: number;
    minutes: number;
};

type MinutesByDay = {
    date: string;
    label: string;
    minutes: number;
    tracks: number;
};

type SpotifyStatsResponse = {
    success?: boolean;
    error?: boolean;
    message?: string;
    timeRange: SpotifyTimeRange;
    topArtists: RankedArtist[];
    topTracks: RankedTrack[];
    recent: {
        itemsAnalyzed: number;
        totalMinutes: number;
        minutesByDay: MinutesByDay[];
        topArtists: RecentCounterItem[];
        topAlbums: RecentCounterItem[];
        topTracks: RecentCounterItem[];
    };
};

const TIME_RANGE_OPTIONS: {
    value: SpotifyTimeRange;
    label: string;
    description: string;
}[] = [
        {
            value: "short_term",
            label: "Last 4 weeks",
            description: "Spotify short term",
        },
        {
            value: "medium_term",
            label: "Last 6 months",
            description: "Spotify medium term",
        },
        {
            value: "long_term",
            label: "Last year",
            description: "Spotify long term",
        },
    ];

function formatMinutes(minutes: number) {
    const roundedMinutes = Math.round(minutes);

    if (roundedMinutes < 60) {
        return `${roundedMinutes} min`;
    }

    const hours = Math.floor(roundedMinutes / 60);
    const remainingMinutes = roundedMinutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Unknown error";
}

function StatCard({
    icon,
    label,
    value,
    description,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-400/10 text-green-300">
                {icon}
            </div>

            <p className="text-sm font-medium text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-white">
                {value}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-600">{description}</p>
        </div>
    );
}

function EmptyArtwork({ icon }: { icon: React.ReactNode }) {
    return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-zinc-500">
            {icon}
        </div>
    );
}

function Artwork({
    imageUrl,
    icon,
    alt,
}: {
    imageUrl: string | null;
    icon: React.ReactNode;
    alt: string;
}) {
    if (!imageUrl) {
        return <EmptyArtwork icon={icon} />;
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={imageUrl}
            alt={alt}
            className="h-12 w-12 shrink-0 rounded-2xl object-cover"
        />
    );
}

function RankedList({
    title,
    subtitle,
    icon,
    items,
    renderMeta,
}: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    items: {
        rank?: number;
        id: string;
        name: string;
        imageUrl: string | null;
        spotifyUrl: string | null;
    }[];
    renderMeta?: (item: {
        rank?: number;
        id: string;
        name: string;
        imageUrl: string | null;
        spotifyUrl: string | null;
    }) => string;
}) {
    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-green-300">
                        {icon}
                    </div>

                    <h2 className="text-xl font-black tracking-tight text-white">
                        {title}
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
                </div>
            </div>

            <div className="space-y-3">
                {items.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                        No data available yet.
                    </div>
                )}

                {items.map((item, index) => {
                    const content = (
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:bg-white/[0.04]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-black text-zinc-400">
                                {item.rank ?? index + 1}
                            </div>

                            <Artwork imageUrl={item.imageUrl} icon={icon} alt={item.name} />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white">
                                    {item.name}
                                </p>

                                {renderMeta && (
                                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                                        {renderMeta(item)}
                                    </p>
                                )}
                            </div>
                        </div>
                    );

                    if (!item.spotifyUrl) {
                        return <div key={item.id}>{content}</div>;
                    }

                    return (
                        <a
                            key={item.id}
                            href={item.spotifyUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {content}
                        </a>
                    );
                })}
            </div>
        </section>
    );
}

function MinutesChart({ days }: { days: MinutesByDay[] }) {
    const maxMinutes = useMemo(
        () => Math.max(...days.map((day) => day.minutes), 1),
        [days],
    );

    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-green-300">
                    <BarChart3 size={21} />
                </div>

                <h2 className="text-xl font-black tracking-tight text-white">
                    Minutes per day
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                    Approximation from your latest 50 recently played tracks.
                </p>
            </div>

            <div className="space-y-3">
                {days.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                        No recently played tracks found.
                    </div>
                )}

                {days.map((day) => {
                    const width = `${Math.max((day.minutes / maxMinutes) * 100, 4)}%`;

                    return (
                        <div key={day.date}>
                            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                                <span className="font-medium text-zinc-400">{day.label}</span>
                                <span className="text-zinc-500">
                                    {formatMinutes(day.minutes)} · {day.tracks} tracks
                                </span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                    className="h-full rounded-full bg-green-400"
                                    style={{ width }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export function StatsDashboard() {
    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;

    const [timeRange, setTimeRange] =
        useState<SpotifyTimeRange>("short_term");
    const [stats, setStats] = useState<SpotifyStatsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    async function loadStats() {
        if (!accessToken) return;

        setLoading(true);
        setStatsError(null);

        try {
            const res = await fetch("/api/spotify-stats", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                    timeRange,
                }),
            });

            const data = (await res.json()) as SpotifyStatsResponse;

            if (!res.ok || data?.error) {
                throw new Error(data?.message || "Could not load stats.");
            }

            setStats(data);
        } catch (error: unknown) {
            setStatsError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken, timeRange]);

    const topRecentArtist = stats?.recent.topArtists[0];
    const topRecentAlbum = stats?.recent.topAlbums[0];
    const topRecentTrack = stats?.recent.topTracks[0];

    if (status === "loading") {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] text-white">
                Loading stats...
            </main>
        );
    }

    if (!session) {
        return (
            <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] px-4 text-white">
                <div className="max-w-md text-center">
                    <h1 className="text-4xl font-black tracking-tight">VibeForge Stats</h1>

                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                        Connect Spotify to see your listening stats.
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            signIn("spotify", {
                                callbackUrl: "/dashboard/stats",
                            })
                        }
                        className="mt-8 rounded-full bg-green-400 px-7 py-3 font-bold text-black transition hover:bg-green-300"
                    >
                        Login with Spotify
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] px-4 py-6 text-white sm:px-6 lg:px-8">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
                <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href="/dashboard"
                            className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
                        >
                            Back to dashboard
                        </Link>

                        <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-green-200">
                            <Trophy size={14} />
                            Spotify snapshot stats
                        </div>

                        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                            Your listening stats
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                            This version uses only live Spotify API data. No database, no saved
                            history, and no background tracking.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadStats}
                        disabled={loading}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-400 px-5 text-sm font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 size={17} className="animate-spin" />
                        ) : (
                            <RefreshCw size={17} />
                        )}
                        Refresh
                    </button>
                </header>

                <div className="mb-6 flex flex-wrap gap-2">
                    {TIME_RANGE_OPTIONS.map((option) => {
                        const active = timeRange === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setTimeRange(option.value)}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${active
                                        ? "border-green-400 bg-green-400 text-black"
                                        : "border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                                    }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                {statsError && (
                    <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                        {statsError}
                    </div>
                )}

                <div className="mb-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100">
                    Minutes are an approximation based on track duration from your latest
                    recently played items. Without a database, VibeForge cannot know exact
                    historical listening time.
                </div>

                <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Clock3 size={21} />}
                        label="Recent minutes"
                        value={formatMinutes(stats?.recent.totalMinutes ?? 0)}
                        description={`Based on ${stats?.recent.itemsAnalyzed ?? 0
                            } recently played tracks.`}
                    />

                    <StatCard
                        icon={<UserRound size={21} />}
                        label="Recent top artist"
                        value={topRecentArtist?.name ?? "No data"}
                        description={
                            topRecentArtist
                                ? `${formatMinutes(topRecentArtist.minutes)} in recent history.`
                                : "No recently played artist found."
                        }
                    />

                    <StatCard
                        icon={<Disc3 size={21} />}
                        label="Recent top album"
                        value={topRecentAlbum?.name ?? "No data"}
                        description={
                            topRecentAlbum
                                ? `${formatMinutes(topRecentAlbum.minutes)} in recent history.`
                                : "No recently played album found."
                        }
                    />

                    <StatCard
                        icon={<Music2 size={21} />}
                        label="Recent top song"
                        value={topRecentTrack?.name ?? "No data"}
                        description={
                            topRecentTrack
                                ? `${topRecentTrack.count} plays in recent history.`
                                : "No recently played song found."
                        }
                    />
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                    <RankedList
                        title="Top artists"
                        subtitle={
                            TIME_RANGE_OPTIONS.find((option) => option.value === timeRange)
                                ?.description ?? "Spotify ranking"
                        }
                        icon={<UserRound size={20} />}
                        items={stats?.topArtists ?? []}
                    />

                    <RankedList
                        title="Top tracks"
                        subtitle={
                            TIME_RANGE_OPTIONS.find((option) => option.value === timeRange)
                                ?.description ?? "Spotify ranking"
                        }
                        icon={<Music2 size={20} />}
                        items={stats?.topTracks ?? []}
                        renderMeta={(item) => {
                            const track = item as RankedTrack;
                            return `${track.artistName} · ${track.albumName}`;
                        }}
                    />

                    <MinutesChart days={stats?.recent.minutesByDay ?? []} />

                    <RankedList
                        title="Recent top albums"
                        subtitle="Calculated from latest 50 recently played tracks"
                        icon={<Disc3 size={20} />}
                        items={stats?.recent.topAlbums ?? []}
                        renderMeta={(item) => {
                            const recentItem = item as RecentCounterItem;
                            return `${formatMinutes(recentItem.minutes)} · ${recentItem.count
                                } plays`;
                        }}
                    />

                    <RankedList
                        title="Recent top artists"
                        subtitle="Calculated from latest 50 recently played tracks"
                        icon={<UserRound size={20} />}
                        items={stats?.recent.topArtists ?? []}
                        renderMeta={(item) => {
                            const recentItem = item as RecentCounterItem;
                            return `${formatMinutes(recentItem.minutes)} · ${recentItem.count
                                } plays`;
                        }}
                    />

                    <RankedList
                        title="Recent top songs"
                        subtitle="Calculated from latest 50 recently played tracks"
                        icon={<CalendarDays size={20} />}
                        items={stats?.recent.topTracks ?? []}
                        renderMeta={(item) => {
                            const recentItem = item as RecentCounterItem;
                            return `${formatMinutes(recentItem.minutes)} · ${recentItem.count
                                } plays`;
                        }}
                    />
                </div>
            </div>
        </main>
    );
}