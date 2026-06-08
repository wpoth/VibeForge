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
import { createPortal } from "react-dom";

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

function EqualizerBars({ isPlaying }: { isPlaying: boolean }) {
    return (
        <div className="flex h-4 items-end gap-0.5">
            {[0, 1, 2, 3].map((bar) => (
                <motion.span
                    key={bar}
                    animate={
                        isPlaying
                            ? {
                                height:
                                    bar === 0
                                        ? [5, 12, 7, 14, 5]
                                        : bar === 1
                                            ? [12, 6, 15, 8, 12]
                                            : bar === 2
                                                ? [7, 14, 5, 11, 7]
                                                : [14, 8, 12, 6, 14],
                            }
                            : {
                                height: 5,
                            }
                    }
                    transition={{
                        duration: 1.1 + bar * 0.12,
                        repeat: isPlaying ? Infinity : 0,
                        ease: "easeInOut",
                    }}
                    className="w-0.5 rounded-full bg-green-300"
                />
            ))}
        </div>
    );
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
    const [mounted, setMounted] = useState(false);
    const [localProgressMs, setLocalProgressMs] = useState(0);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && track && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close now playing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[79] bg-black/20 backdrop-blur-[1px] sm:hidden"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 32, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 28, scale: 0.96 }}
                        transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 32,
                            mass: 0.8,
                        }}
                        className="fixed bottom-4 left-1/2 z-[80] w-[calc(100vw-2rem)] max-w-[380px] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#151823]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:top-16 sm:bottom-auto"
                    >
                        <div className="pointer-events-none absolute inset-0">
                            {track.imageUrl ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={track.imageUrl}
                                        alt=""
                                        className="h-full w-full scale-125 object-cover opacity-90 blur-3xl"
                                    />

                                    <motion.div
                                        animate={
                                            isPlaying
                                                ? {
                                                    scale: [1, 1.08, 1],
                                                    rotate: [0, 3, 0],
                                                    opacity: [0.55, 0.78, 0.55],
                                                }
                                                : {
                                                    scale: 1,
                                                    rotate: 0,
                                                    opacity: 0.45,
                                                }
                                        }
                                        transition={{
                                            duration: 7,
                                            repeat: isPlaying ? Infinity : 0,
                                            ease: "easeInOut",
                                        }}
                                        className="absolute -left-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
                                    />

                                    <motion.div
                                        animate={
                                            isPlaying
                                                ? {
                                                    scale: [1, 1.12, 1],
                                                    x: [0, -10, 0],
                                                    y: [0, 8, 0],
                                                    opacity: [0.18, 0.34, 0.18],
                                                }
                                                : {
                                                    scale: 1,
                                                    x: 0,
                                                    y: 0,
                                                    opacity: 0.16,
                                                }
                                        }
                                        transition={{
                                            duration: 8,
                                            repeat: isPlaying ? Infinity : 0,
                                            ease: "easeInOut",
                                        }}
                                        className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-green-400/30 blur-3xl"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-[#151823]/70 to-black/85" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 via-transparent to-white/5" />
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.12),transparent_40%)]" />
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#151823] via-[#1e2433] to-[#0f1117]" />
                            )}
                        </div>

                        <div className="relative z-10">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.22,
                                    delay: 0.04,
                                }}
                                className="flex items-center gap-4"
                            >
                                <motion.div
                                    animate={
                                        isPlaying
                                            ? {
                                                y: [0, -2, 0],
                                                rotate: [-1, 1, -1],
                                                scale: [1, 1.015, 1],
                                            }
                                            : {
                                                y: 0,
                                                rotate: 0,
                                                scale: 1,
                                            }
                                    }
                                    transition={{
                                        duration: 4,
                                        repeat: isPlaying ? Infinity : 0,
                                        ease: "easeInOut",
                                    }}
                                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/[0.08] shadow-xl ring-1 ring-white/15"
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

                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
                                </motion.div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-white">
                                            {track.title ?? "Unknown track"}
                                        </p>

                                        <EqualizerBars isPlaying={isPlaying} />
                                    </div>

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
                                    <motion.a
                                        href={track.spotifyUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        whileHover={{ scale: 1.04, y: -1 }}
                                        whileTap={{ scale: 0.96 }}
                                        className="flex items-center gap-1.5 rounded-full bg-white/[0.1] px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-white/[0.16]"
                                    >
                                        <ExternalLink size={13} strokeWidth={2.2} />
                                        Open
                                    </motion.a>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.22,
                                    delay: 0.09,
                                }}
                                className="mt-5"
                            >
                                <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.14] shadow-inner">
                                    <motion.div
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.25 }}
                                        className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-green-300 via-green-400 to-white"
                                    >
                                        {isPlaying && (
                                            <motion.div
                                                animate={{
                                                    x: ["-120%", "220%"],
                                                }}
                                                transition={{
                                                    duration: 1.6,
                                                    repeat: Infinity,
                                                    ease: "easeInOut",
                                                }}
                                                className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                                            />
                                        )}
                                    </motion.div>
                                </div>

                                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-300">
                                    <span>{formatTime(localProgressMs)}</span>
                                    <span>{formatTime(track.durationMs ?? 0)}</span>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.22,
                                    delay: 0.14,
                                }}
                                className="mt-5 flex items-center justify-center gap-3"
                            >
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onPrevious}
                                    disabled={controlLoading}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.1] text-white transition hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Previous track"
                                >
                                    <SkipBack size={18} strokeWidth={2.4} />
                                </motion.button>

                                <motion.button
                                    type="button"
                                    whileHover={{
                                        scale: 1.08,
                                        boxShadow: "0 0 28px rgba(34, 197, 94, 0.45)",
                                    }}
                                    whileTap={{ scale: 0.88 }}
                                    onClick={onTogglePlay}
                                    disabled={controlLoading}
                                    className="relative flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-black shadow-lg shadow-green-500/25 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label={isPlaying ? "Pause" : "Resume"}
                                >
                                    {isPlaying && (
                                        <motion.span
                                            initial={{ opacity: 0.6, scale: 1 }}
                                            animate={{ opacity: 0, scale: 1.75 }}
                                            transition={{
                                                duration: 1.35,
                                                repeat: Infinity,
                                                ease: "easeOut",
                                            }}
                                            className="absolute inset-0 rounded-full border border-green-300"
                                        />
                                    )}

                                    <span className="relative z-10">
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
                                    </span>
                                </motion.button>

                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onNext}
                                    disabled={controlLoading}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.1] text-white transition hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Next track"
                                >
                                    <SkipForward size={18} strokeWidth={2.4} />
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}