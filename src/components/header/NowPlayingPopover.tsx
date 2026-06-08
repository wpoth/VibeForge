"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import type { CurrentlyPlayingTrack } from "@/hooks/useCurrentlyPlaying";

type NowPlayingPopoverProps = {
    open: boolean;
    track: CurrentlyPlayingTrack | null;
    isPlaying: boolean;
    controlLoading: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onTogglePlay: () => void;
    onClose: () => void;
};

function formatTime(ms: number) {
    if (!Number.isFinite(ms) || ms <= 0) {
        return "0:00";
    }

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function NowPlayingPopover({
    open,
    track,
    isPlaying,
    controlLoading,
    onPrevious,
    onNext,
    onTogglePlay,
    onClose,
}: NowPlayingPopoverProps) {
    const [localProgressMs, setLocalProgressMs] = useState(0);

    useEffect(() => {
        setLocalProgressMs(track?.progressMs ?? 0);
    }, [track?.uri, track?.progressMs]);

    useEffect(() => {
        if (!isPlaying || !track?.durationMs) return;

        const intervalId = window.setInterval(() => {
            setLocalProgressMs((current) =>
                Math.min(current + 1000, track.durationMs ?? current)
            );
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isPlaying, track?.durationMs]);

    useEffect(() => {
        if (!open) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, onClose]);

    const progressPercent = useMemo(() => {
        if (!track?.durationMs) return 0;

        return Math.min(100, Math.max(0, (localProgressMs / track.durationMs) * 100));
    }, [localProgressMs, track?.durationMs]);

    return (
        <AnimatePresence>
            {open && track && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-1/2 top-[calc(100%+10px)] z-[80] w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#151823]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl"
                >
                    <div className="pointer-events-none absolute inset-0 opacity-70">
                        {track.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={track.imageUrl}
                                alt=""
                                className="h-full w-full scale-125 object-cover blur-3xl"
                            />
                        )}
                        <div className="absolute inset-0 bg-[#151823]/80" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/[0.08] shadow-xl">
                                {track.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={track.imageUrl}
                                        alt={`${track.title ?? "Track"} cover`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                        ♪
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">
                                    {track.title ?? "Unknown track"}
                                </p>

                                <p className="mt-1 truncate text-xs text-zinc-300">
                                    {track.artists?.join(", ") || "Unknown artist"}
                                </p>

                                {track.album && (
                                    <p className="mt-1 truncate text-[11px] text-zinc-500">
                                        {track.album}
                                    </p>
                                )}
                            </div>

                            {track.spotifyUrl && (
                                <a
                                    href={track.spotifyUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.14]"
                                >
                                    Spotify
                                </a>
                            )}
                        </div>

                        <div className="mt-5">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.1]">
                                <motion.div
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.25 }}
                                    className="h-full rounded-full bg-green-400"
                                />
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                                <span>{formatTime(localProgressMs)}</span>
                                <span>{formatTime(track.durationMs ?? 0)}</span>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-center gap-3">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={onPrevious}
                                disabled={controlLoading}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-sm text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Previous track"
                            >
                                ⏮
                            </motion.button>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={onTogglePlay}
                                disabled={controlLoading}
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 pl-0.5 text-base font-bold text-black shadow-lg shadow-green-500/25 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={isPlaying ? "Pause" : "Resume"}
                            >
                                {isPlaying ? "Ⅱ" : "▶"}
                            </motion.button>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={onNext}
                                disabled={controlLoading}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-sm text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Next track"
                            >
                                ⏭
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}