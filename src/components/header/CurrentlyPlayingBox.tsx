"use client";

import { motion } from "motion/react";

type CurrentlyPlayingBoxProps = {
    title?: string;
    artists?: string[];
    imageUrl?: string | null;
    isPlaying?: boolean;
    onClick?: () => void;
};

export function CurrentlyPlayingBox({
    title,
    artists,
    imageUrl,
    isPlaying = false,
    onClick,
}: CurrentlyPlayingBoxProps) {
    const hasTrack = Boolean(title);

    return (
        <motion.button
            type="button"
            whileHover={{ scale: hasTrack ? 1.015 : 1 }}
            whileTap={{ scale: hasTrack ? 0.985 : 1 }}
            onClick={hasTrack ? onClick : undefined}
            disabled={!hasTrack}
            className="flex min-w-0 max-w-md items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-left shadow-lg shadow-black/10 backdrop-blur-xl transition hover:bg-white/[0.08] disabled:cursor-default disabled:opacity-70"
        >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.08]">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={`${title ?? "Current track"} cover`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                        ♪
                    </div>
                )}

                {isPlaying && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#0f1117] bg-green-400" />
                )}
            </div>

            <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">
                    {title ?? "Nothing playing"}
                </p>

                <p className="truncate text-[11px] text-zinc-400">
                    {artists?.join(", ") || "Spotify"}
                </p>
            </div>
        </motion.button>
    );
}