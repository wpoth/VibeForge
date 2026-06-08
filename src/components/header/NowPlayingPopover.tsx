"use client";

import {
    ExternalLink,
    Music2,
    Pause,
    Play,
    SkipBack,
    SkipForward,
} from "lucide-react";
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

        return Math.min(
            100,
            Math.max(0, (localProgressMs / track.durationMs) * 100)
        );
    }, [localProgressMs, track?.durationMs]);

    return (
        <AnimatePresence>
            {open && track && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="fixed bottom-4 left-1/2 z-[80] w-[calc(100vw-2rem)] max-w-[380px] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#151823]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:absolute sm:bottom-auto sm:top-[calc(100%+10px)] sm:w-[min(380px,calc(100vw-2rem))]"
                >
                    <div className="pointer-events-none absolute inset-0">
                        {track.imageUrl ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={track.imageUrl}
                                    alt=""
                                    className="h-full w-full scale-125 object-cover blur-3xl"
                                />

                                <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-[#151823]/70 to-black/85" />
                                <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 via-transparent to-white/5" />
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#151823] via-[#1e2433] to-[#0f1117]" />
                        )}

                        <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-green-500/10 blur-3xl" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={{
                                    rotate: isPlaying ? 360 : 0,
                                }}
                                transition={{
                                    duration: 18,
                                    ease: "linear",
                                    repeat: isPlaying ? Infinity : 0,
                                }}
                                className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/[0.08] shadow-xl ring-1 ring-white/15"
                            >
                                {track.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={track.imageUrl}
                                        alt={`${track.title ?? "Track"} cover`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                        <Music2 size={22} strokeWidth={2.2} />
                                    </div>
                                )}
                            </motion.div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">
                                    {track.title ?? "Unknown track"}
                                </p>

                                <p className="mt-1 truncate text-xs text-zinc-300">
                                    {track.artists?.join(", ") || "Unknown artist"}
                                </p>

                                {track.album && (
                                    <p className="mt-1 truncate text-[11px] text-zinc-400">
                                        {track.album}
                                    </p>
                                )}
                            </div>

                            {track.spotifyUrl && (
                                <a
                                    href={track.spotifyUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 rounded-full bg-white/[0.1] px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-white/[0.16]"
                                >
                                    <ExternalLink size={13} strokeWidth={2.2} />
                                    Open
                                </a>
                            )}
                        </div>

                        <div className="mt-5">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.14] shadow-inner">
                                <motion.div
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 0.25 }}
                                    className="h-full rounded-full bg-gradient-to-r from-green-300 via-green-400 to-white"
                                />
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-300">
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
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.1] text-white transition hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Previous track"
                            >
                                <SkipBack size={18} strokeWidth={2.4} />
                            </motion.button>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={onTogglePlay}
                                disabled={controlLoading}
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-black shadow-lg shadow-green-500/25 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={isPlaying ? "Pause" : "Resume"}
                            >
                                {isPlaying ? (
                                    <Pause size={20} fill="currentColor" strokeWidth={2.4} />
                                ) : (
                                    <Play
                                        size={20}
                                        fill="currentColor"
                                        strokeWidth={2.4}
                                        className="ml-0.5"
                                    />
                                )}
                            </motion.button>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.06 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={onNext}
                                disabled={controlLoading}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.1] text-white transition hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Next track"
                            >
                                <SkipForward size={18} strokeWidth={2.4} />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}