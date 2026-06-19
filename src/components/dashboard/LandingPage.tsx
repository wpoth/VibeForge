"use client";

import {
    ArrowLeft,
    Clock3,
    Headphones,
    Music2,
    Plus,
    Sparkles,
    Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import type { CurrentlyPlayingTrack } from "@/hooks/useCurrentlyPlaying";

type LandingView = "home" | "recently-played" | "ai-playlist";

type LandingPageProps = {
    initialView?: LandingView;
    currentlyPlaying?: CurrentlyPlayingTrack | null;
    isPlaying?: boolean;
    recentlyPlayedCount?: number;
    recentlyPlayedPanel: ReactNode;
    aiPlaylistPanel: ReactNode;
};

function getArtistText(artists?: string[]) {
    return artists && artists.length > 0 ? artists.join(", ") : "Spotify";
}

export function LandingPage({
    initialView = "home",
    currentlyPlaying,
    isPlaying = false,
    recentlyPlayedCount = 0,
    recentlyPlayedPanel,
    aiPlaylistPanel,
}: LandingPageProps) {
    const router = useRouter();
    const [activeView, setActiveView] = useState<LandingView>(initialView);

    const hasCurrentTrack = Boolean(currentlyPlaying?.title);

    useEffect(() => {
        setActiveView(initialView);
    }, [initialView]);

    useEffect(() => {
        function handleLandingHomeEvent() {
            setActiveView("home");
            router.push("/dashboard");
        }

        window.addEventListener("vibeforge:landing-home", handleLandingHomeEvent);

        return () => {
            window.removeEventListener(
                "vibeforge:landing-home",
                handleLandingHomeEvent,
            );
        };
    }, [router]);

    function goHome() {
        setActiveView("home");
        router.push("/dashboard");
    }

    function goToRecentlyPlayed() {
        setActiveView("recently-played");
        router.push("/dashboard/recent");
    }

    function goToAiPlaylist() {
        setActiveView("ai-playlist");
        router.push("/dashboard/ai");
    }

    return (
        <div className="mx-auto w-full max-w-6xl">
            <AnimatePresence mode="wait">
                {activeView === "home" && (
                    <motion.div
                        key="landing-home"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.24 }}
                        className="space-y-6"
                    >
                        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-8 lg:p-10">
                            <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-green-400/10 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl" />

                            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-200">
                                        <Sparkles size={14} />
                                        Your music space
                                    </div>

                                    <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                                        Shape your Spotify library without the noise.
                                    </h1>

                                    <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                                        Check what you have been listening to, create AI playlists,
                                        or open a playlist when you need it. No clutter up front.
                                    </p>

                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={goToAiPlaylist}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-400 px-5 text-sm font-bold text-black shadow-lg shadow-green-400/20 transition hover:bg-green-300"
                                        >
                                            <Wand2 size={17} />
                                            Create with AI
                                        </button>

                                        <button
                                            type="button"
                                            onClick={goToRecentlyPlayed}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white"
                                        >
                                            <Clock3 size={17} />
                                            View recent plays
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-4 shadow-2xl shadow-black/20">
                                    {hasCurrentTrack ? (
                                        <div className="flex gap-4">
                                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white/[0.08] ring-1 ring-white/10 sm:h-32 sm:w-32">
                                                {currentlyPlaying?.imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={currentlyPlaying.imageUrl}
                                                        alt={`${currentlyPlaying.title} cover`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                                        <Music2 size={28} />
                                                    </div>
                                                )}

                                                {isPlaying && (
                                                    <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full border border-black bg-green-400" />
                                                )}
                                            </div>

                                            <div className="min-w-0 py-1">
                                                <p className="text-xs uppercase tracking-[0.25em] text-green-300/70">
                                                    {isPlaying ? "Now playing" : "Paused"}
                                                </p>

                                                <h2 className="mt-3 line-clamp-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                                                    {currentlyPlaying?.title}
                                                </h2>

                                                <p className="mt-2 line-clamp-1 text-sm text-zinc-400">
                                                    {getArtistText(currentlyPlaying?.artists)}
                                                </p>

                                                <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                                                    {currentlyPlaying?.album}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex min-h-32 items-center gap-4">
                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-500">
                                                <Headphones size={28} />
                                            </div>

                                            <div>
                                                <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">
                                                    Nothing playing
                                                </p>
                                                <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                                                    Start Spotify
                                                </h2>
                                                <p className="mt-1 text-sm text-zinc-500">
                                                    Your current song will appear here.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4 md:grid-cols-3">
                            <button
                                type="button"
                                onClick={goToRecentlyPlayed}
                                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-left shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white/[0.055]"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-green-300">
                                    <Clock3 size={19} />
                                </div>

                                <h3 className="mt-5 text-lg font-black tracking-tight text-white">
                                    Recently played
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-zinc-500">
                                    See your latest listens when you want them, without turning
                                    the homepage into a stats wall.
                                </p>

                                <p className="mt-4 text-xs font-medium text-zinc-600">
                                    {recentlyPlayedCount > 0
                                        ? `${recentlyPlayedCount} recent tracks loaded`
                                        : "Load your recent activity"}
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={goToAiPlaylist}
                                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 text-left shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white/[0.055]"
                            >
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-green-300">
                                    <Wand2 size={19} />
                                </div>

                                <h3 className="mt-5 text-lg font-black tracking-tight text-white">
                                    Create playlist
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-zinc-500">
                                    Generate a playlist from a mood, artist, scene, or prompt when
                                    you are ready.
                                </p>

                                <p className="mt-4 text-xs font-medium text-zinc-600">
                                    AI tools stay tucked away
                                </p>
                            </button>

                            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-5 shadow-lg shadow-black/10">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-400">
                                    <Plus size={19} />
                                </div>

                                <h3 className="mt-5 text-lg font-black tracking-tight text-white">
                                    Open a playlist
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-zinc-500">
                                    Pick one from the sidebar when you want to edit, analyze,
                                    remove tracks, or queue songs.
                                </p>

                                <p className="mt-4 text-xs font-medium text-zinc-600">
                                    Your library stays on the side
                                </p>
                            </div>
                        </section>
                    </motion.div>
                )}

                {activeView === "recently-played" && (
                    <motion.div
                        key="landing-recently-played"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.24 }}
                    >
                        <button
                            type="button"
                            onClick={goHome}
                            className="mb-4 inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            Back to home
                        </button>

                        {recentlyPlayedPanel}
                    </motion.div>
                )}

                {activeView === "ai-playlist" && (
                    <motion.div
                        key="landing-ai-playlist"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.24 }}
                    >
                        <button
                            type="button"
                            onClick={goHome}
                            className="mb-4 inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
                        >
                            <ArrowLeft size={16} />
                            Back to home
                        </button>

                        {aiPlaylistPanel}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}