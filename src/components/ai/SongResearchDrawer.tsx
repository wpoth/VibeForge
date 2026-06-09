"use client";

import {
    ExternalLink,
    Loader2,
    Music2,
    Sparkles,
    X,
} from "lucide-react";

import { DrawerShell } from "@/components/common/DrawerShell";
import type {
    ResearchTrackInfo,
    SongResearch,
} from "@/hooks/useSongResearch";

type SongResearchDrawerProps = {
    open: boolean;
    loading: boolean;
    error: string | null;
    track: ResearchTrackInfo | null;
    research: SongResearch | null;
    onClose: () => void;
};

function ConfidenceBadge({
    confidence,
}: {
    confidence: SongResearch["confidence"];
}) {
    const label =
        confidence === "high"
            ? "High confidence"
            : confidence === "medium"
                ? "Medium confidence"
                : "Low confidence";

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${confidence === "high"
                    ? "bg-green-500/15 text-green-300"
                    : confidence === "medium"
                        ? "bg-yellow-500/15 text-yellow-300"
                        : "bg-red-500/15 text-red-300"
                }`}
        >
            {label}
        </span>
    );
}

export function SongResearchDrawer({
    open,
    loading,
    error,
    track,
    research,
    onClose,
}: SongResearchDrawerProps) {
    return (
        <DrawerShell
            open={open}
            onClose={onClose}
            ariaLabel="Close song research"
        >
            {({ dragHandle }) => (
                <>
                    <div className="relative overflow-hidden border-b border-white/10 p-5">
                        {track?.imageUrl && (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={track.imageUrl}
                                    alt=""
                                    className="absolute inset-0 h-full w-full scale-125 object-cover opacity-35 blur-3xl"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#11141d]/95 via-[#11141d]/80 to-[#11141d]/95" />
                            </>
                        )}

                        <div className="relative z-10">
                            {dragHandle}

                            <div className="flex items-start gap-4">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/[0.08] ring-1 ring-white/10">
                                    {track?.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={track.imageUrl}
                                            alt={`${track.name} cover`}
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
                                        <Sparkles size={15} strokeWidth={2.3} />
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                                            Song research
                                        </p>
                                    </div>

                                    <h2 className="truncate text-xl font-bold text-white">
                                        {track?.name ?? "Unknown song"}
                                    </h2>

                                    <p className="mt-1 truncate text-sm text-zinc-300">
                                        {track?.artists.join(", ") || "Unknown artist"}
                                    </p>

                                    {track?.album && (
                                        <p className="mt-1 truncate text-xs text-zinc-500">
                                            {track.album}
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
                                    Researching song...
                                </p>
                                <p className="mt-2 max-w-xs text-sm text-zinc-500">
                                    Looking for themes, context, mood, and possible meaning.
                                </p>
                            </div>
                        )}

                        {!loading && error && (
                            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                                <p className="text-sm font-semibold text-red-200">
                                    Could not research this song
                                </p>
                                <p className="mt-2 text-sm text-red-100/80">{error}</p>
                            </div>
                        )}

                        {!loading && !error && research && (
                            <div className="space-y-5">
                                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                        <h3 className="font-semibold text-white">Overview</h3>
                                        <ConfidenceBadge confidence={research.confidence} />
                                    </div>

                                    <p className="text-sm leading-6 text-zinc-300">
                                        {research.summary}
                                    </p>
                                </section>

                                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                    <h3 className="mb-2 font-semibold text-white">
                                        Possible meaning
                                    </h3>

                                    <p className="text-sm leading-6 text-zinc-300">
                                        {research.meaning}
                                    </p>
                                </section>

                                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                    <h3 className="mb-2 font-semibold text-white">
                                        Story / emotional plot
                                    </h3>

                                    <p className="text-sm leading-6 text-zinc-300">
                                        {research.story}
                                    </p>
                                </section>

                                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                    <h3 className="mb-2 font-semibold text-white">Context</h3>

                                    <p className="text-sm leading-6 text-zinc-300">
                                        {research.context}
                                    </p>

                                    {research.relatedMedia && (
                                        <div className="mt-3 rounded-xl bg-green-500/10 px-3 py-2 text-sm text-green-200">
                                            Related media: {research.relatedMedia}
                                        </div>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                    <h3 className="mb-2 font-semibold text-white">
                                        Sound / production
                                    </h3>

                                    <p className="text-sm leading-6 text-zinc-300">
                                        {research.sonicNotes}
                                    </p>
                                </section>

                                {research.moodTags.length > 0 && (
                                    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                        <h3 className="mb-3 font-semibold text-white">Mood</h3>

                                        <div className="flex flex-wrap gap-2">
                                            {research.moodTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-zinc-200"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {track?.spotifyUrl && (
                                    <a
                                        href={track.spotifyUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08]"
                                    >
                                        <ExternalLink size={16} strokeWidth={2.2} />
                                        Open track in Spotify
                                    </a>
                                )}

                                <p className="text-xs leading-5 text-zinc-600">
                                    Interpretations are generated from public music knowledge and
                                    metadata. VibeForge avoids reproducing full lyrics.
                                </p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </DrawerShell>
    );
}