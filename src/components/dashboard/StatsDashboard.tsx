"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import {
    ArrowLeft,
    BarChart3,
    CalendarDays,
    Clock3,
    Disc3,
    ExternalLink,
    Loader2,
    Music2,
    RefreshCw,
    Sparkles,
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

type ListItem = {
    rank?: number;
    id: string;
    name: string;
    imageUrl: string | null;
    spotifyUrl: string | null;
};

const TIME_RANGE_OPTIONS: {
    value: SpotifyTimeRange;
    label: string;
    shortLabel: string;
    description: string;
}[] = [
        {
            value: "short_term",
            label: "Last 4 weeks",
            shortLabel: "4 weeks",
            description: "Spotify short term",
        },
        {
            value: "medium_term",
            label: "Last 6 months",
            shortLabel: "6 months",
            description: "Spotify medium term",
        },
        {
            value: "long_term",
            label: "Last year",
            shortLabel: "1 year",
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

function getTimeRangeLabel(timeRange: SpotifyTimeRange) {
    return (
        TIME_RANGE_OPTIONS.find((option) => option.value === timeRange)?.label ??
        "Selected period"
    );
}

function Artwork({
    imageUrl,
    icon,
    alt,
    size = "md",
}: {
    imageUrl: string | null;
    icon: ReactNode;
    alt: string;
    size?: "sm" | "md" | "lg";
}) {
    const sizeClass =
        size === "lg"
            ? "h-24 w-24 rounded-[1.35rem]"
            : size === "sm"
                ? "h-11 w-11 rounded-2xl"
                : "h-14 w-14 rounded-2xl";

    if (!imageUrl) {
        return (
            <div
                className={`flex ${sizeClass} shrink-0 items-center justify-center bg-white/[0.06] text-zinc-500 ring-1 ring-white/10`}
            >
                {icon}
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={imageUrl}
            alt={alt}
            className={`${sizeClass} shrink-0 object-cover shadow-lg shadow-black/20 ring-1 ring-white/10`}
        />
    );
}

function StatPill({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-400/10 text-green-300">
                {icon}
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                {label}
            </p>
            <p className="mt-2 line-clamp-2 text-xl font-black tracking-tight text-white">
                {value}
            </p>
        </div>
    );
}

function TopSpotlight({
    artist,
    track,
    album,
}: {
    artist?: RecentCounterItem;
    track?: RecentCounterItem;
    album?: RecentCounterItem;
}) {
    return (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-green-400/20 bg-green-400/[0.08] p-5 shadow-2xl shadow-black/20 sm:p-6">
                <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-green-400/20 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-purple-400/10 blur-3xl" />

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-green-200">
                        <Trophy size={14} />
                        Recent winner
                    </div>

                    <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
                        <Artwork
                            imageUrl={artist?.imageUrl ?? null}
                            icon={<UserRound size={28} />}
                            alt={artist?.name ?? "Top artist"}
                            size="lg"
                        />

                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-green-100/80">
                                Most played artist from recent history
                            </p>

                            <h2 className="mt-2 line-clamp-2 text-4xl font-black tracking-tight text-white sm:text-5xl">
                                {artist?.name ?? "No artist yet"}
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-zinc-300">
                                {artist
                                    ? `${formatMinutes(artist.minutes)} · ${artist.count} recent plays`
                                    : "Play some music and refresh the stats page."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <StatPill
                    icon={<Disc3 size={20} />}
                    label="Top album"
                    value={album?.name ?? "No data"}
                />

                <StatPill
                    icon={<Music2 size={20} />}
                    label="Top song"
                    value={track?.name ?? "No data"}
                />
            </div>
        </section>
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
    icon: ReactNode;
    items: ListItem[];
    renderMeta?: (item: ListItem) => string;
}) {
    return (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/10 sm:p-5">
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

            <div className="space-y-2.5">
                {items.length === 0 && (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                        No data available yet.
                    </div>
                )}

                {items.map((item, index) => {
                    const row = (
                        <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-white/15 hover:bg-white/[0.045]">
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

                            {item.spotifyUrl && (
                                <ExternalLink
                                    size={15}
                                    className="shrink-0 text-zinc-700 transition group-hover:text-zinc-400"
                                />
                            )}
                        </div>
                    );

                    if (!item.spotifyUrl) {
                        return <div key={item.id}>{row}</div>;
                    }

                    return (
                        <a
                            key={item.id}
                            href={item.spotifyUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {row}
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
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/10 sm:p-5">
            <div className="mb-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-green-300">
                    <BarChart3 size={21} />
                </div>

                <h2 className="text-xl font-black tracking-tight text-white">
                    Minutes per day
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                    Estimated from your latest 50 recently played tracks.
                </p>
            </div>

            <div className="space-y-4">
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
                                <span className="font-semibold text-zinc-300">
                                    {day.label}
                                </span>
                                <span className="text-zinc-500">
                                    {formatMinutes(day.minutes)} · {day.tracks} tracks
                                </span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-200 shadow-lg shadow-green-400/20"
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
                    <h1 className="text-4xl font-black tracking-tight">
                        VibeForge Stats
                    </h1>

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
        <main className="min-h-screen overflow-hidden bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] px-4 py-5 text-white sm:px-6 lg:px-8">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
                <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-white/[0.025] blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl">
                <header className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-xl">
                    <div className="relative p-5 sm:p-7 lg:p-8">
                        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-green-400/10 blur-3xl" />

                        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <Link
                                    href="/dashboard"
                                    className="mb-5 inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
                                >
                                    <ArrowLeft size={16} />
                                    Dashboard
                                </Link>

                                <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                                    Your Spotify stats snapshot.
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                                    Top artists, top tracks, recent favourites, and estimated
                                    listening minutes using only Spotify API data.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={loadStats}
                                disabled={loading}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-400 px-5 text-sm font-black text-black shadow-lg shadow-green-400/20 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? (
                                    <Loader2 size={17} className="animate-spin" />
                                ) : (
                                    <RefreshCw size={17} />
                                )}
                                Refresh stats
                            </button>
                        </div>
                    </div>
                </header>

                <div className="mb-6 flex flex-wrap gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-2">
                    {TIME_RANGE_OPTIONS.map((option) => {
                        const active = timeRange === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setTimeRange(option.value)}
                                className={`flex flex-1 flex-col rounded-[1.1rem] border px-4 py-3 text-left transition sm:flex-none sm:min-w-44 ${active
                                        ? "border-green-400 bg-green-400 text-black shadow-lg shadow-green-400/15"
                                        : "border-transparent bg-transparent text-zinc-400 hover:bg-white/[0.055] hover:text-white"
                                    }`}
                            >
                                <span className="text-sm font-black">{option.label}</span>
                                <span
                                    className={`mt-0.5 text-xs ${active ? "text-black/60" : "text-zinc-600"
                                        }`}
                                >
                                    {option.description}
                                </span>
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
                    This is a snapshot, not full historical tracking. Minutes are
                    estimated from track duration in your latest recently played items.
                </div>

                <TopSpotlight
                    artist={topRecentArtist}
                    album={topRecentAlbum}
                    track={topRecentTrack}
                />

                <section className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatPill
                        icon={<Clock3 size={20} />}
                        label="Recent minutes"
                        value={formatMinutes(stats?.recent.totalMinutes ?? 0)}
                    />

                    <StatPill
                        icon={<CalendarDays size={20} />}
                        label="Recent tracks"
                        value={`${stats?.recent.itemsAnalyzed ?? 0} tracks`}
                    />

                    <StatPill
                        icon={<UserRound size={20} />}
                        label="Period"
                        value={getTimeRangeLabel(timeRange)}
                    />

                    <StatPill
                        icon={<Trophy size={20} />}
                        label="Top source"
                        value="Spotify API"
                    />
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                    <RankedList
                        title="Top artists"
                        subtitle={`${getTimeRangeLabel(timeRange)} ranking from Spotify`}
                        icon={<UserRound size={20} />}
                        items={stats?.topArtists ?? []}
                    />

                    <RankedList
                        title="Top tracks"
                        subtitle={`${getTimeRangeLabel(timeRange)} ranking from Spotify`}
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
                        icon={<Music2 size={20} />}
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