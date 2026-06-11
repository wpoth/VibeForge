"use client";

import {
    Clock3,
    ExternalLink,
    Headphones,
    ListPlus,
    Loader2,
    Play,
    RefreshCw,
    Sparkles,
    Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import type {
    RecentlyPlayedStats,
    RecentlyPlayedTrack,
} from "@/hooks/useRecentlyPlayed";

type RecentlyPlayedDashboardProps = {
    tracks: RecentlyPlayedTrack[];
    stats: RecentlyPlayedStats;
    loading: boolean;
    loaded: boolean;
    hasRecentlyPlayedScope: boolean;
    actionLoadingUri?: string | null;
    onRefresh: () => void;
    onPlayTrack: (track: RecentlyPlayedTrack) => void;
    onAddToQueue: (track: RecentlyPlayedTrack) => void;
};

function formatPlayedAt(playedAt?: string) {
    if (!playedAt) return "Unknown time";

    const playedDate = new Date(playedAt);
    const now = new Date();
    const diffMs = now.getTime() - playedDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(playedDate);
}

function getArtistText(artists: string[]) {
    return artists.length > 0 ? artists.join(", ") : "Unknown artist";
}

function StatCard({
    icon,
    label,
    value,
    helper,
}: {
    icon: ReactNode;
    label: string;
    value: string | number;
    helper?: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg shadow-black/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                <span className="text-green-300">{icon}</span>
                {label}
            </div>

            <p className="mt-3 truncate text-2xl font-black tracking-tight text-white">
                {value}
            </p>

            {helper && <p className="mt-1 truncate text-xs text-zinc-500">{helper}</p>}
        </div>
    );
}

export function RecentlyPlayedDashboard({
    tracks,
    stats,
    loading,
    loaded,
    hasRecentlyPlayedScope,
    actionLoadingUri,
    onRefresh,
    onPlayTrack,
    onAddToQueue,
}: RecentlyPlayedDashboardProps) {
    const latestTracks = tracks.slice(0, 8);

    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="mb-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-4 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-5"
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-200">
                        <Headphones size={14} />
                        Recently Played Dashboard
                    </div>

                    <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
                        Your latest listening activity
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                        A quick view of your latest Spotify plays, repeated artists, and the
                        tracks you keep coming back to.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading || !hasRecentlyPlayedScope}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <RefreshCw size={16} />
                    )}
                    Refresh
                </button>
            </div>

            {!hasRecentlyPlayedScope && (
                <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                    <p className="font-semibold">Spotify permission needed</p>
                    <p className="mt-1 text-amber-100/75">
                        This feature needs the <code>user-read-recently-played</code> scope.
                        Log out and log back in with Spotify after updating the auth scope.
                    </p>
                </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={<Clock3 size={15} />}
                    label="Recent plays"
                    value={stats.total}
                    helper={`${stats.playedToday} played today`}
                />

                <StatCard
                    icon={<Sparkles size={15} />}
                    label="Top artist"
                    value={stats.topArtist?.name ?? "—"}
                    helper={
                        stats.topArtist
                            ? `${stats.topArtist.count} recent play${stats.topArtist.count === 1 ? "" : "s"
                            }`
                            : "No artist data yet"
                    }
                />

                <StatCard
                    icon={<Headphones size={15} />}
                    label="Most replayed"
                    value={stats.topTrack?.title ?? "—"}
                    helper={
                        stats.topTrack
                            ? `${stats.topTrack.count} recent play${stats.topTrack.count === 1 ? "" : "s"
                            }`
                            : "No repeated track yet"
                    }
                />

                <StatCard
                    icon={<Users size={15} />}
                    label="Variety"
                    value={stats.uniqueArtists}
                    helper={`${stats.uniqueTracks} unique tracks`}
                />
            </div>

            <div className="mt-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Latest listens
                    </h3>

                    {loaded && tracks.length > 8 && (
                        <p className="text-xs text-zinc-500">
                            Showing 8 of {tracks.length} recent tracks
                        </p>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {loading && !loaded && (
                        <motion.div
                            key="recently-played-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid gap-2"
                        >
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
                                />
                            ))}
                        </motion.div>
                    )}

                    {!loading && loaded && latestTracks.length === 0 && (
                        <motion.div
                            key="recently-played-empty"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-400"
                        >
                            No recently played tracks found yet.
                        </motion.div>
                    )}

                    {latestTracks.length > 0 && (
                        <motion.div
                            key="recently-played-list"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="grid gap-2"
                        >
                            {latestTracks.map((track, index) => {
                                const isActionLoading = actionLoadingUri === track.uri;

                                return (
                                    <motion.div
                                        key={`${track.playedAt}-${track.uri}-${index}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.18,
                                            delay: Math.min(index * 0.025, 0.12),
                                        }}
                                        className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 transition hover:bg-white/[0.07]"
                                    >
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.08] ring-1 ring-white/10">
                                            {track.imageUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={track.imageUrl}
                                                    alt={`${track.title} cover`}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                                    <Headphones size={18} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-white">
                                                {track.title}
                                            </p>
                                            <p className="truncate text-xs text-zinc-400">
                                                {getArtistText(track.artists)}
                                            </p>
                                            <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                                                {track.album}
                                            </p>
                                        </div>

                                        <div className="hidden min-w-[74px] text-right text-xs text-zinc-500 sm:block">
                                            {formatPlayedAt(track.playedAt)}
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => onPlayTrack(track)}
                                                disabled={isActionLoading || !track.uri}
                                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition hover:bg-green-400/15 hover:text-green-200 disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label={`Play ${track.title}`}
                                                title="Play track"
                                            >
                                                {isActionLoading ? (
                                                    <Loader2 size={15} className="animate-spin" />
                                                ) : (
                                                    <Play size={15} fill="currentColor" />
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onAddToQueue(track)}
                                                disabled={isActionLoading || !track.uri}
                                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label={`Add ${track.title} to queue`}
                                                title="Add to queue"
                                            >
                                                <ListPlus size={16} />
                                            </button>

                                            {track.spotifyUrl && (
                                                <a
                                                    href={track.spotifyUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition hover:bg-white/[0.1] hover:text-white"
                                                    aria-label={`Open ${track.title} in Spotify`}
                                                    title="Open in Spotify"
                                                >
                                                    <ExternalLink size={15} />
                                                </a>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.section>
    );
}