"use client";

import { CoverImage } from "@/components/common/CoverImage";
import type { SpotifyPlaylist } from "@/lib/spotify-types";
import { isLikedSongsPlaylist } from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";
import { motion } from "motion/react";

type PlaylistHeaderProps = {
    selectedPlaylist: SpotifyPlaylist;
};

export function PlaylistHeader({ selectedPlaylist }: PlaylistHeaderProps) {
    const likedSongs = isLikedSongsPlaylist(selectedPlaylist);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            className="mb-8 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:mb-10 sm:flex-row sm:items-end sm:gap-6 sm:p-6"
        >
            <CoverImage
                images={selectedPlaylist.images}
                alt={`${selectedPlaylist.name} cover`}
                size="lg"
            />

            <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm font-medium text-green-400">
                    {likedSongs ? "Library" : "Playlist"}
                </p>

                <h2 className="break-words text-3xl font-bold tracking-tight sm:truncate sm:text-4xl">
                    {selectedPlaylist.name}
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                    {likedSongs
                        ? `${getPlaylistTrackCount(selectedPlaylist)} saved songs`
                        : `${getPlaylistTrackCount(selectedPlaylist)} tracks`}
                </p>

                {likedSongs && (
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-600">
                        Spotify treats Liked Songs as saved library tracks, not as a normal
                        playlist. VibeForge loads your latest saved songs here.
                    </p>
                )}
            </div>
        </motion.div>
    );
}