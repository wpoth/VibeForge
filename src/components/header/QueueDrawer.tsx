"use client";

import {
    ExternalLink,
    ListMusic,
    Loader2,
    Music2,
    RefreshCw,
    X,
} from "lucide-react";
import {
    AnimatePresence,
    motion,
    useDragControls,
} from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { PlayerQueueItem } from "@/hooks/usePlayerQueue";

type QueueDrawerProps = {
    open: boolean;
    loading: boolean;
    error: string | null;
    currentlyPlaying: PlayerQueueItem | null;
    queue: PlayerQueueItem[];
    onClose: () => void;
    onRefresh: () => void;
};

function formatDuration(ms?: number) {
    if (!ms || !Number.isFinite(ms)) return "";

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function QueueTrackCard({
    item,
    index,
    label,
}: {
    item: PlayerQueueItem;
    index?: number;
    label?: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.06]">
            {label && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-green-300">
                    {label}
                </p>
            )}

            <div className="flex items-center gap-3">
                {typeof index === "number" && (
                    <p className="hidden w-7 shrink-0 text-right text-xs text-zinc-600 sm:block">
                        {index + 1}
                    </p>
                )}

                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.08] ring-1 ring-white/10">
                    {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={item.imageUrl}
                            alt={`${item.name ?? "Queue item"} cover`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                            <Music2 size={18} strokeWidth={2.2} />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">
                            {item.name ?? "Unknown track"}
                        </p>

                        {item.explicit && (
                            <span className="rounded bg-white/[0.12] px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                                E
                            </span>
                        )}
                    </div>

                    <p className="truncate text-xs text-zinc-400">
                        {item.artists?.join(", ") || "Unknown artist"}
                    </p>

                    {item.album && (
                        <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                            {item.album}
                        </p>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {item.durationMs ? (
                        <span className="hidden text-xs text-zinc-500 sm:block">
                            {formatDuration(item.durationMs)}
                        </span>
                    ) : null}

                    {item.spotifyUrl && (
                        <a
                            href={item.spotifyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full bg-white/[0.08] p-2 text-zinc-300 transition hover:bg-white/[0.14] hover:text-white"
                            aria-label="Open in Spotify"
                        >
                            <ExternalLink size={15} strokeWidth={2.2} />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

export function QueueDrawer({
    open,
    loading,
    error,
    currentlyPlaying,
    queue,
    onClose,
    onRefresh,
}: QueueDrawerProps) {
    const [mounted, setMounted] = useState(false);
    const dragControls = useDragControls();

    useEffect(() => {
        setMounted(true);
    }, []);

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

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close queue"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm"
                    />

                    <motion.aside
                        initial={{ opacity: 0, x: 32 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 32 }}
                        transition={{ duration: 0.22 }}
                        drag="x"
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{
                            left: 0,
                            right: 180,
                        }}
                        dragElastic={0.18}
                        dragMomentum={false}
                        onDragEnd={(_, info) => {
                            const shouldClose = info.offset.x > 90 || info.velocity.x > 650;

                            if (shouldClose) {
                                onClose();
                            }
                        }}
                        className="fixed bottom-0 right-0 top-0 z-[9001] flex w-full max-w-xl flex-col overflow-hidden border-l border-white/10 bg-[#11141d]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:w-[520px]"
                    >
                        <div className="border-b border-white/10 p-5">
                            <motion.button
                                type="button"
                                aria-label="Swipe right to close"
                                onPointerDown={(event) => {
                                    dragControls.start(event);
                                }}
                                whileTap={{ scaleX: 1.1, scaleY: 0.92 }}
                                className="mb-4 flex touch-none cursor-grab items-center gap-2 rounded-full bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-400 active:cursor-grabbing sm:hidden"
                            >
                                <span className="h-1.5 w-8 rounded-full bg-white/25" />
                                Swipe right to close
                            </motion.button>

                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/15 text-green-300 ring-1 ring-green-400/20">
                                    <ListMusic size={22} strokeWidth={2.3} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">
                                        Spotify queue
                                    </p>

                                    <h2 className="mt-1 text-2xl font-bold text-white">Queue</h2>

                                    <p className="mt-1 text-sm text-zinc-500">
                                        View what is currently playing and what is coming up next.
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onRefresh}
                                        disabled={loading}
                                        className="rounded-full bg-white/[0.08] p-2 text-zinc-300 transition hover:bg-white/[0.14] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        aria-label="Refresh queue"
                                    >
                                        <RefreshCw
                                            size={18}
                                            strokeWidth={2.2}
                                            className={loading ? "animate-spin" : ""}
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-full bg-white/[0.08] p-2 text-zinc-300 transition hover:bg-white/[0.14] hover:text-white"
                                        aria-label="Close queue"
                                    >
                                        <X size={18} strokeWidth={2.2} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="custom-sidebar-scrollbar flex-1 overflow-y-auto p-5">
                            {loading && (
                                <div className="flex min-h-80 flex-col items-center justify-center text-center">
                                    <Loader2
                                        size={34}
                                        strokeWidth={2.2}
                                        className="animate-spin text-green-400"
                                    />
                                    <p className="mt-4 text-sm font-medium text-white">
                                        Loading queue...
                                    </p>
                                    <p className="mt-2 max-w-xs text-sm text-zinc-500">
                                        Fetching your active Spotify queue.
                                    </p>
                                </div>
                            )}

                            {!loading && error && (
                                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                                    <p className="text-sm font-semibold text-red-200">
                                        Could not load queue
                                    </p>
                                    <p className="mt-2 text-sm text-red-100/80">{error}</p>
                                    <p className="mt-3 text-xs leading-5 text-red-100/60">
                                        Start playback on Spotify or VibeForge first, then try
                                        again.
                                    </p>
                                </div>
                            )}

                            {!loading && !error && (
                                <div className="space-y-5">
                                    {currentlyPlaying ? (
                                        <QueueTrackCard
                                            item={currentlyPlaying}
                                            label="Currently playing"
                                        />
                                    ) : (
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                            <p className="text-sm font-semibold text-white">
                                                Nothing is currently playing
                                            </p>
                                            <p className="mt-1 text-sm text-zinc-500">
                                                Start playback first, then refresh the queue.
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="font-semibold text-white">Up next</h3>
                                            <span className="text-xs text-zinc-500">
                                                {queue.length} item{queue.length === 1 ? "" : "s"}
                                            </span>
                                        </div>

                                        {queue.length > 0 ? (
                                            <div className="space-y-3">
                                                {queue.map((item, index) => (
                                                    <QueueTrackCard
                                                        key={`${item.uri ?? item.id ?? "queue"}-${index}`}
                                                        item={item}
                                                        index={index}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                                <p className="text-sm font-semibold text-white">
                                                    Queue is empty
                                                </p>
                                                <p className="mt-1 text-sm text-zinc-500">
                                                    Songs you add to queue from VibeForge will appear
                                                    here.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs leading-5 text-zinc-600">
                                        Spotify currently allows VibeForge to view and add to the
                                        queue, but not remove or reorder queued songs through the
                                        public API.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}