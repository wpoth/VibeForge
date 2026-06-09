"use client";

import {
    ExternalLink,
    ListPlus,
    Loader2,
    Music2,
    Search,
    X,
} from "lucide-react";
import {
    AnimatePresence,
    motion,
    useDragControls,
} from "motion/react";

import type {
    SimilarSourceTrack,
    SimilarTrack,
} from "@/hooks/useSimilarTracks";

type SimilarTracksDrawerProps = {
    open: boolean;
    loading: boolean;
    error: string | null;
    sourceTrack: SimilarSourceTrack | null;
    tracks: SimilarTrack[];
    onClose: () => void;
    onAddToQueue: (track: SimilarTrack) => void;
};

export function SimilarTracksDrawer({
    open,
    loading,
    error,
    sourceTrack,
    tracks,
    onClose,
    onAddToQueue,
}: SimilarTracksDrawerProps) {
    const dragControls = useDragControls();

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close similar songs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
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
                        className="fixed bottom-0 right-0 top-0 z-[91] flex w-full max-w-xl flex-col overflow-hidden border-l border-white/10 bg-[#11141d]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:w-[520px]"
                    >
                        <div className="relative overflow-hidden border-b border-white/10 p-5">
                            {sourceTrack?.imageUrl && (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={sourceTrack.imageUrl}
                                        alt=""
                                        className="absolute inset-0 h-full w-full scale-125 object-cover opacity-35 blur-3xl"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#11141d]/95 via-[#11141d]/80 to-[#11141d]/95" />
                                </>
                            )}

                            <div className="relative z-10">
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
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/[0.08] ring-1 ring-white/10">
                                        {sourceTrack?.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={sourceTrack.imageUrl}
                                                alt={`${sourceTrack.name} cover`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                                <Music2 size={24} strokeWidth={2.2} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-center gap-2 text-green-300">
                                            <Search size={15} strokeWidth={2.3} />
                                            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                                                Similar songs
                                            </p>
                                        </div>

                                        <h2 className="truncate text-xl font-bold text-white">
                                            {sourceTrack?.name ?? "Unknown song"}
                                        </h2>

                                        <p className="mt-1 truncate text-sm text-zinc-300">
                                            {sourceTrack?.artists.join(", ") || "Unknown artist"}
                                        </p>

                                        {sourceTrack?.album && (
                                            <p className="mt-1 truncate text-xs text-zinc-500">
                                                {sourceTrack.album}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-full bg-white/[0.08] p-2 text-zinc-300 transition hover:bg-white/[0.14] hover:text-white"
                                        aria-label="Close"
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
                                        Finding similar songs...
                                    </p>
                                    <p className="mt-2 max-w-xs text-sm text-zinc-500">
                                        Generating suggestions and matching them against Spotify.
                                    </p>
                                </div>
                            )}

                            {!loading && error && (
                                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                                    <p className="text-sm font-semibold text-red-200">
                                        Could not find similar songs
                                    </p>
                                    <p className="mt-2 text-sm text-red-100/80">{error}</p>
                                </div>
                            )}

                            {!loading && !error && tracks.length > 0 && (
                                <div className="space-y-3">
                                    {tracks.map((track) => (
                                        <div
                                            key={track.uri ?? `${track.name}-${track.artists?.join(",")}`}
                                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition hover:bg-white/[0.06]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.08]">
                                                    {track.imageUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={track.imageUrl}
                                                            alt={`${track.name ?? "Track"} cover`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                                            <Music2 size={18} strokeWidth={2.2} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-white">
                                                        {track.name ?? track.query ?? "Unknown track"}
                                                    </p>

                                                    <p className="truncate text-xs text-zinc-400">
                                                        {track.artists?.join(", ") || "Unknown artist"}
                                                    </p>

                                                    {track.reason && (
                                                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                                                            {track.reason}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => onAddToQueue(track)}
                                                    disabled={!track.uri}
                                                    className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <ListPlus size={14} strokeWidth={2.4} />
                                                    Queue
                                                </button>

                                                {track.spotifyUrl && (
                                                    <a
                                                        href={track.spotifyUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1.5 rounded-xl bg-white/[0.08] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.12]"
                                                    >
                                                        <ExternalLink size={14} strokeWidth={2.2} />
                                                        Open
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    <p className="pt-2 text-xs leading-5 text-zinc-600">
                                        Suggestions are AI-generated, but only tracks matched on
                                        Spotify are shown.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}