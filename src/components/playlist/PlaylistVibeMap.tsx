"use client";

import {
    Activity,
    Eye,
    EyeOff,
    Gauge,
    Headphones,
    Heart,
    Moon,
    Radar,
    RefreshCw,
    Sparkles,
    Target,
    Waves,
} from "lucide-react";
import { motion } from "motion/react";

import type { PlaylistVibeMapData } from "@/hooks/usePlaylistVibeMap";

type PlaylistVibeMapProps = {
    vibeMap: PlaylistVibeMapData;
    loading: boolean;
    onRegenerate: () => void;
    onHide: () => void;
};

type VibeScoreProps = {
    label: string;
    value: number;
    icon: React.ElementType;
};

function ConfidenceBadge({
    confidence,
}: {
    confidence: PlaylistVibeMapData["confidence"];
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

function VibeScore({ label, value, icon: Icon }: VibeScoreProps) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <Icon size={15} strokeWidth={2.3} className="shrink-0 text-green-300" />
                    <p className="truncate text-xs font-medium text-zinc-300">{label}</p>
                </div>

                <p className="text-xs font-semibold text-white">{value}</p>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.1]">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 24,
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-green-300 via-green-400 to-white"
                />
            </div>
        </div>
    );
}

export function PlaylistVibeMap({
    vibeMap,
    loading,
    onRegenerate,
    onHide,
}: PlaylistVibeMapProps) {
    const scores = [
        {
            label: "Energy",
            value: vibeMap.energy,
            icon: Gauge,
        },
        {
            label: "Danceability",
            value: vibeMap.danceability,
            icon: Activity,
        },
        {
            label: "Emotional weight",
            value: vibeMap.emotionalWeight,
            icon: Heart,
        },
        {
            label: "Darkness",
            value: vibeMap.darkness,
            icon: Moon,
        },
        {
            label: "Focus",
            value: vibeMap.focus,
            icon: Target,
        },
        {
            label: "Cohesion",
            value: vibeMap.cohesion,
            icon: Waves,
        },
    ];

    return (
        <motion.section
            layout
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.22 }}
            className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20"
        >
            <div className="relative overflow-hidden p-5">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_35%)]" />

                <div className="relative z-10">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 text-green-300">
                                    <Radar size={17} strokeWidth={2.4} />
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                                        Vibe map
                                    </p>
                                </div>

                                <ConfidenceBadge confidence={vibeMap.confidence} />
                            </div>

                            <h3 className="text-xl font-bold text-white">
                                Playlist personality
                            </h3>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                                {vibeMap.summary}
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onRegenerate}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RefreshCw
                                    size={14}
                                    strokeWidth={2.2}
                                    className={loading ? "animate-spin" : ""}
                                />
                                Regenerate
                            </motion.button>

                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={onHide}
                                className="flex items-center justify-center gap-2 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/[0.12]"
                            >
                                <EyeOff size={14} strokeWidth={2.2} />
                                Hide
                            </motion.button>
                        </div>
                    </div>

                    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {scores.map((score) => (
                            <VibeScore
                                key={score.label}
                                label={score.label}
                                value={score.value}
                                icon={score.icon}
                            />
                        ))}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <div className="mb-3 flex items-center gap-2 text-green-300">
                                <Sparkles size={15} strokeWidth={2.3} />
                                <h4 className="text-sm font-semibold text-white">Mood</h4>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {vibeMap.moodTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-zinc-200"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <div className="mb-3 flex items-center gap-2 text-green-300">
                                <Headphones size={15} strokeWidth={2.3} />
                                <h4 className="text-sm font-semibold text-white">Style</h4>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {vibeMap.genreTags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-zinc-200"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <div className="mb-3 flex items-center gap-2 text-green-300">
                                <Eye size={15} strokeWidth={2.3} />
                                <h4 className="text-sm font-semibold text-white">Best for</h4>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {vibeMap.bestFor.map((useCase) => (
                                    <span
                                        key={useCase}
                                        className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-zinc-200"
                                    >
                                        {useCase}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <p className="mb-2 text-sm font-semibold text-white">
                                Sound profile
                            </p>
                            <p className="text-sm leading-6 text-zinc-400">
                                {vibeMap.soundProfile}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <p className="mb-2 text-sm font-semibold text-white">Flow</p>
                            <p className="text-sm leading-6 text-zinc-400">
                                {vibeMap.flow}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <p className="mb-2 text-sm font-semibold text-white">
                                Standout pattern
                            </p>
                            <p className="text-sm leading-6 text-zinc-400">
                                {vibeMap.standoutPattern}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}