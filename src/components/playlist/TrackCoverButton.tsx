"use client";

import { Play } from "lucide-react";

type TrackCoverButtonProps = {
    trackName?: string;
    imageUrl?: string | null;
    isPlaying: boolean;
    disabled: boolean;
    compact?: boolean;
    onPlay: () => void;
};

export function TrackCoverButton({
    trackName,
    imageUrl,
    isPlaying,
    disabled,
    compact = false,
    onPlay,
}: TrackCoverButtonProps) {
    return (
        <button
            type="button"
            onClick={(event) => {
                event.stopPropagation();
                onPlay();
            }}
            disabled={disabled}
            className={`group/cover relative shrink-0 overflow-hidden rounded-lg bg-white/[0.06] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${compact ? "h-9 w-9" : "h-11 w-11"
                } ${isPlaying ? "ring-1 ring-green-400/60" : ""}`}
            aria-label={`Play ${trackName ?? "song"}`}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageUrl}
                    alt={`${trackName ?? "Track"} cover`}
                    className="h-full w-full object-cover"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    ♪
                </div>
            )}

            <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover/cover:opacity-100">
                <span
                    className={`flex items-center justify-center rounded-full bg-green-500 text-black shadow-lg shadow-green-500/30 ${compact ? "h-6 w-6" : "h-7 w-7"
                        }`}
                >
                    <Play
                        size={compact ? 11 : 13}
                        fill="currentColor"
                        strokeWidth={2.4}
                    />
                </span>
            </span>
        </button>
    );
}