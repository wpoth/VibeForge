"use client";

import { Check, Loader2, Music2, Plus, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import type { SpotifyPlaylist, SpotifyPlaylistItem } from "@/lib/spotify-types";
import { isLikedSongsPlaylist } from "@/lib/spotify-types";
import { getTrackFromPlaylistItem } from "@/lib/ui-helpers";

type AddToPlaylistDialogProps = {
    open: boolean;
    playlistItem: SpotifyPlaylistItem | null;
    playlists: SpotifyPlaylist[];
    loadingPlaylistId?: string | null;
    onAddToPlaylist: (
        playlist: SpotifyPlaylist,
        playlistItem: SpotifyPlaylistItem,
    ) => void;
    onClose: () => void;
};

function getPlaylistImageUrl(playlist: SpotifyPlaylist) {
    return playlist.images?.[0]?.url ?? null;
}

export function AddToPlaylistDialog({
    open,
    playlistItem,
    playlists,
    loadingPlaylistId = null,
    onAddToPlaylist,
    onClose,
}: AddToPlaylistDialogProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const track = playlistItem ? getTrackFromPlaylistItem(playlistItem) : null;

    const targetPlaylists = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return playlists
            .filter((playlist) => !isLikedSongsPlaylist(playlist))
            .filter((playlist) => {
                if (!normalizedQuery) return true;

                return playlist.name.toLowerCase().includes(normalizedQuery);
            });
    }, [playlists, searchQuery]);

    return (
        <AnimatePresence>
            {open && playlistItem && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Add song to playlist"
                    onMouseDown={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.97 }}
                        transition={{ duration: 0.18 }}
                        onMouseDown={(event) => event.stopPropagation()}
                        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#11141d]/95 p-5 shadow-2xl shadow-black/40"
                    >
                        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-green-400/10 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-purple-400/10 blur-3xl" />

                        <div className="relative flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10 text-green-300">
                                    <Plus size={20} />
                                </div>

                                <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
                                    Add to playlist
                                </h2>

                                <p className="mt-1 truncate text-sm text-zinc-500">
                                    {track?.name ?? "Unknown track"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
                                aria-label="Close add to playlist dialog"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="relative mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                            <div className="flex items-center gap-3">
                                <Search
                                    size={17}
                                    strokeWidth={2.3}
                                    className="shrink-0 text-zinc-500"
                                />

                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search playlists..."
                                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                                    autoFocus
                                />

                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        className="rounded-full bg-white/[0.08] p-1.5 text-zinc-400 transition hover:bg-white/[0.12] hover:text-white"
                                        aria-label="Clear playlist search"
                                    >
                                        <X size={15} strokeWidth={2.3} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="relative mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                            {targetPlaylists.length > 0 ? (
                                targetPlaylists.map((playlist) => {
                                    const imageUrl = getPlaylistImageUrl(playlist);
                                    const loading = loadingPlaylistId === playlist.id;

                                    return (
                                        <button
                                            key={playlist.id}
                                            type="button"
                                            disabled={Boolean(loadingPlaylistId)}
                                            onClick={() => onAddToPlaylist(playlist, playlistItem)}
                                            className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] text-zinc-500">
                                                {imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={imageUrl}
                                                        alt={`${playlist.name} cover`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <Music2 size={18} />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-white">
                                                    {playlist.name}
                                                </p>
                                                <p className="mt-0.5 text-xs text-zinc-500">
                                                    {playlist.tracks?.total ??
                                                        playlist.items?.total ??
                                                        0}{" "}
                                                    tracks
                                                </p>
                                            </div>

                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300 transition group-hover:bg-green-400 group-hover:text-black">
                                                {loading ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Check size={16} />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center">
                                    <p className="text-sm font-semibold text-white">
                                        No playlists found
                                    </p>
                                    <p className="mt-1 text-sm text-zinc-500">
                                        Try another search term.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}