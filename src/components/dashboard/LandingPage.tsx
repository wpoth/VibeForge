"use client";

import {
    ArrowLeft,
    BarChart3,
    Clock3,
    Headphones,
    Music2,
    Plus,
    Sparkles,
    Trophy,
    Wand2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useImageAccentColor } from "@/hooks/useImageAccentColor";
import type { CurrentlyPlayingTrack } from "@/hooks/useCurrentlyPlaying";

type LandingPageProps = {
    initialView?: LandingView;
    currentlyPlaying?: CurrentlyPlayingTrack | null;
    isPlaying?: boolean;
    recentlyPlayedCount?: number;
    recentlyPlayedPanel: ReactNode;
    aiPlaylistPanel: ReactNode;
};

type LandingView = "home" | "recently-played" | "ai-playlist";

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
    const accentColor = useImageAccentColor(currentlyPlaying?.imageUrl);

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

    function goToStats() {
        router.push("/dashboard/stats");
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
                            <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.025] blur-3xl" />

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
                                        Check your listening stats, recent plays, AI playlist ideas,
                                        and playlist tools from one clean dashboard.
                                    </p>

                                    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                        <button
                                            type="button"
                                            onClick={goToStats}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-400 px-5 text-sm font-black text-black shadow-lg shadow-green-400/20 transition hover:bg-green-300"
                                        >
                                            <BarChart3 size={17} />
                                            View stats
                                        </button>

                                        <button
                                            type="button"
                                            onClick={goToAiPlaylist}
                                            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-5 text-sm font-bold text-green-100 transition hover:bg-green-400/15 hover:text-white"
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
                                            Recent plays
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className="relative overflow-hidden rounded-[2rem] border bg-black/25 p-4 shadow-2xl backdrop-blur-xl transition-all duration-500"
                                    style={{
                                        borderColor: hasCurrentTrack
                                            ? accentColor.rgbaMedium
                                            : "rgba(255, 255, 255, 0.1)",
                                        boxShadow: hasCurrentTrack
                                            ? `0 24px 80px ${accentColor.rgbaSoft}`
                                            : "0 24px 80px rgba(0, 0, 0, 0.2)",
                                    }}
                                >
                                    {hasCurrentTrack ? (
                                        <>
                                            <div
                                                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl transition-colors duration-500"
                                                style={{
                                                    backgroundColor: accentColor.rgbaMedium,
                                                }}
                                            />

                                            <div
                                                className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full blur-3xl transition-colors duration-500"
                                                style={{
                                                    backgroundColor: accentColor.rgbaSoft,
                                                }}
                                            />

                                            {currentlyPlaying?.imageUrl && (
                                                <>
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={currentlyPlaying.imageUrl}
                                                        alt=""
                                                        aria-hidden="true"
                                                        className="absolute inset-0 h-full w-full scale-125 object-cover opacity-20 blur-2xl"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-br from-[#11141d]/90 via-[#11141d]/75 to-black/45" />
                                                </>
                                            )}

                                            <div className="relative flex gap-4">
                                                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.5rem] bg-white/[0.08] shadow-xl shadow-black/30 ring-1 ring-white/10 sm:h-32 sm:w-32">
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
                                                        <span
                                                            className="absolute bottom-3 right-3 h-3.5 w-3.5 rounded-full border-2 border-[#11141d]"
                                                            style={{
                                                                backgroundColor: `rgb(${accentColor.rgb})`,
                                                                boxShadow: `0 0 18px ${accentColor.rgbaStrong}`,
                                                            }}
                                                        />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1 py-1">
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <span
                                                            className={
                                                                isPlaying
                                                                    ? "h-1.5 w-1.5 rounded-full"
                                                                    : "h-1.5 w-1.5 rounded-full bg-zinc-500"
                                                            }
                                                            style={
                                                                isPlaying
                                                                    ? {
                                                                        backgroundColor: `rgb(${accentColor.rgb})`,
                                                                        boxShadow: `0 0 12px ${accentColor.rgbaStrong}`,
                                                                    }
                                                                    : undefined
                                                            }
                                                        />

                                                        <span
                                                            className="text-[11px] font-black uppercase tracking-[0.32em]"
                                                            style={{
                                                                color: isPlaying
                                                                    ? `rgb(${accentColor.rgb})`
                                                                    : "rgba(161, 161, 170, 0.9)",
                                                            }}
                                                        >
                                                            {isPlaying ? "Live from Spotify" : "Spotify paused"}
                                                        </span>
                                                    </div>

                                                    <h2 className="line-clamp-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                                                        {currentlyPlaying?.title}
                                                    </h2>

                                                    <p className="mt-2 line-clamp-1 text-sm font-semibold text-zinc-300">
                                                        {getArtistText(currentlyPlaying?.artists)}
                                                    </p>

                                                    <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                                                        {currentlyPlaying?.album}
                                                    </p>

                                                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
                                                        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-zinc-400">
                                                            Current session
                                                        </span>

                                                        <span
                                                            className="rounded-full border px-3 py-1"
                                                            style={{
                                                                borderColor: accentColor.rgbaMedium,
                                                                backgroundColor: accentColor.rgbaSoft,
                                                                color: `rgb(${accentColor.rgb})`,
                                                            }}
                                                        >
                                                            {isPlaying ? "Playing now" : "Paused"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="relative flex min-h-32 items-center gap-4">
                                            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-green-400/10 blur-3xl" />

                                            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-500 shadow-xl shadow-black/20">
                                                <Headphones size={28} />
                                            </div>

                                            <div className="relative">
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

                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <button
                                type="button"
                                onClick={goToStats}
                                className="group relative overflow-hidden rounded-[1.5rem] border border-green-400/20 bg-green-400/[0.08] p-5 text-left shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-green-400/[0.12]"
                            >
                                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-green-400/10 blur-2xl" />

                                <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl border border-green-400/20 bg-green-400/10 text-green-300">
                                    <Trophy size={19} />
                                </div>

                                <h3 className="relative z-10 mt-5 text-lg font-black tracking-tight text-white">
                                    Listening stats
                                </h3>

                                <p className="relative z-10 mt-2 text-sm leading-6 text-zinc-400">
                                    See top artists, top tracks, recent top albums, and estimated
                                    minutes per day.
                                </p>

                                <p className="relative z-10 mt-4 text-xs font-semibold text-green-200">
                                    Open stats dashboard
                                </p>
                            </button>

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