"use client";

import { useRef } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { motion } from "motion/react";

import { CoverImage } from "@/components/common/CoverImage";
import type { SpotifyPlaylist } from "@/lib/spotify-types";
import { isLikedSongsPlaylist } from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";

type PlaylistHeaderProps = {
    selectedPlaylist: SpotifyPlaylist;
    coverUploading?: boolean;
    onPlaylistCoverChange?: (playlist: SpotifyPlaylist, file: File) => void;
};

export function PlaylistHeader({
    selectedPlaylist,
    coverUploading = false,
    onPlaylistCoverChange,
}: PlaylistHeaderProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const likedSongs = isLikedSongsPlaylist(selectedPlaylist);
    const canChangeCover = !likedSongs && Boolean(onPlaylistCoverChange);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            className="mb-8 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:mb-10 sm:flex-row sm:items-end sm:gap-6 sm:p-6"
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];

                    event.target.value = "";

                    if (!file || !onPlaylistCoverChange) return;

                    onPlaylistCoverChange(selectedPlaylist, file);
                }}
            />

            <div className="relative shrink-0">
                <CoverImage
                    images={selectedPlaylist.images}
                    alt={`${selectedPlaylist.name} cover`}
                    size="lg"
                />

                {coverUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 text-xs font-semibold text-white">
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Uploading
                    </div>
                )}
            </div>

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
                        playlist. Custom cover images are not supported for Liked Songs.
                    </p>
                )}

                {canChangeCover && (
                    <button
                        type="button"
                        disabled={coverUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {coverUploading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <ImagePlus size={16} />
                        )}
                        {coverUploading ? "Uploading cover..." : "Change cover image"}
                    </button>
                )}
            </div>
        </motion.div>
    );
}