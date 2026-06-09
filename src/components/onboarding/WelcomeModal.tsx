"use client";

import {
    Brain,
    Compass,
    ListMusic,
    Music2,
    Sparkles,
    Wand2,
    X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const WELCOME_STORAGE_KEY = "vibeforge-welcome-seen";
export const SHOW_WELCOME_EVENT = "vibeforge:show-welcome";

export function showWelcomeMessage() {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new Event(SHOW_WELCOME_EVENT));
}

type WelcomeFeature = {
    title: string;
    description: string;
    icon: React.ElementType;
};

const features: WelcomeFeature[] = [
    {
        title: "Manage Spotify playlists",
        description:
            "Browse playlists, remove tracks, select multiple songs, and control playback from VibeForge.",
        icon: ListMusic,
    },
    {
        title: "AI music discovery",
        description:
            "Generate playlists, find similar songs, research tracks, and map the vibe of your playlists.",
        icon: Brain,
    },
    {
        title: "Mini-player and queue",
        description:
            "Control Spotify playback, seek through songs, open your queue, and swipe tracks to queue them.",
        icon: Music2,
    },
    {
        title: "Mobile-first interactions",
        description:
            "Use action sheets, swipe gestures, compact rows, and settings that adapt the app to your device.",
        icon: Compass,
    },
];

export function WelcomeModal() {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setMounted(true);

            const hasSeenWelcome =
                window.localStorage.getItem(WELCOME_STORAGE_KEY) === "true";

            if (!hasSeenWelcome) {
                setOpen(true);
            }
        }, 0);

        function handleShowWelcome() {
            setOpen(true);
        }

        window.addEventListener(SHOW_WELCOME_EVENT, handleShowWelcome);

        return () => {
            window.clearTimeout(timeoutId);
            window.removeEventListener(SHOW_WELCOME_EVENT, handleShowWelcome);
        };
    }, []);

    function closeWelcome() {
        window.localStorage.setItem(WELCOME_STORAGE_KEY, "true");
        setOpen(false);
    }

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Close welcome message"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeWelcome}
                        className="fixed inset-0 z-[9500] bg-black/60 backdrop-blur-md"
                    />

                    <div className="fixed inset-0 z-[9501] flex items-center justify-center p-4">
                        <motion.section
                            initial={{ opacity: 0, y: 24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 34,
                                mass: 0.85,
                            }}
                            className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#11141d]/95 shadow-2xl shadow-black/60 backdrop-blur-2xl"
                        >
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_34%)]" />

                            <div className="custom-sidebar-scrollbar relative z-10 max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6">
                                <div className="mb-6 flex items-start gap-4">
                                    <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-green-500/15 text-green-300 ring-1 ring-green-400/20">
                                        <Sparkles size={24} strokeWidth={2.3} />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-300">
                                            Welcome to VibeForge
                                        </p>

                                        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                            Your Spotify playlist command center
                                        </h2>

                                        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                                            VibeForge helps you manage playlists, control playback,
                                            explore songs with AI, generate vibe maps, and discover
                                            tracks that fit your music taste.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={closeWelcome}
                                        className="rounded-full bg-white/[0.08] p-2 text-zinc-300 transition hover:bg-white/[0.14] hover:text-white"
                                        aria-label="Close welcome message"
                                    >
                                        <X size={18} strokeWidth={2.2} />
                                    </button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {features.map((feature) => {
                                        const Icon = feature.icon;

                                        return (
                                            <div
                                                key={feature.title}
                                                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                                            >
                                                <div className="mb-3 flex items-center gap-2 text-green-300">
                                                    <Icon size={17} strokeWidth={2.3} />
                                                    <h3 className="text-sm font-semibold text-white">
                                                        {feature.title}
                                                    </h3>
                                                </div>

                                                <p className="text-sm leading-6 text-zinc-400">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-5 rounded-2xl border border-green-400/20 bg-green-500/10 p-4">
                                    <div className="flex items-start gap-3">
                                        <Wand2
                                            size={18}
                                            strokeWidth={2.3}
                                            className="mt-0.5 shrink-0 text-green-300"
                                        />

                                        <div>
                                            <p className="text-sm font-semibold text-green-200">
                                                Quick tip
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-green-100/75">
                                                Right-click tracks on desktop, tap the ⋯ button on
                                                mobile, or swipe right on a song to quickly add it to
                                                your Spotify queue.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={closeWelcome}
                                        className="rounded-full bg-green-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}