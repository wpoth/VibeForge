"use client";

import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import type { CurrentlyPlayingTrack } from "@/hooks/useCurrentlyPlaying";

type FullscreenNowPlayingProps = {
  open: boolean;
  track: CurrentlyPlayingTrack | null;
  isPlaying: boolean;
  controlLoading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onClose: () => void;
};

function formatTime(milliseconds?: number) {
  if (!milliseconds || milliseconds < 0) return "0:00";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function FullscreenNowPlaying({
  open,
  track,
  isPlaying,
  controlLoading = false,
  onPrevious,
  onNext,
  onTogglePlay,
  onClose,
}: FullscreenNowPlayingProps) {
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const progressPercent = useMemo(() => {
    if (!track?.durationMs || !track?.progressMs) return 0;

    return Math.min(
      100,
      Math.max(0, (track.progressMs / track.durationMs) * 100),
    );
  }, [track?.durationMs, track?.progressMs]);

  useEffect(() => {
    if (!open) return;

    async function enterFullscreen() {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Some browsers block fullscreen if it was not triggered directly enough by a user gesture.
      }
    }

    void enterFullscreen();
  }, [open]);

  useEffect(() => {
    function syncFullscreenState() {
      const isFullscreen = Boolean(document.fullscreenElement);
      setFullscreenActive(isFullscreen);

      if (open && !isFullscreen) {
        onClose();
      }
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, [onClose, open]);

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
  }, [onClose, open]);

  async function leaveFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore browser fullscreen errors.
    }

    onClose();
  }

  async function toggleBrowserFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore browser fullscreen errors.
    }
  }

  const artistText = track?.artists?.join(", ") || "Spotify";
  const albumText = track?.album || "Now playing";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] cursor-none overflow-hidden bg-black text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen now playing"
        >
          {track?.imageUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={track.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-20 blur-3xl"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-black/95" />
            </>
          )}

          {!track?.imageUrl && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.14),transparent_35%),#000]" />
          )}

          <motion.div
            aria-hidden="true"
            className="absolute h-80 w-80 rounded-full bg-green-400/10 blur-3xl"
            animate={{
              x: ["10vw", "70vw", "40vw", "10vw"],
              y: ["15vh", "25vh", "70vh", "15vh"],
            }}
            transition={{ duration: 48, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute h-72 w-72 rounded-full bg-purple-400/10 blur-3xl"
            animate={{
              x: ["75vw", "25vw", "60vw", "75vw"],
              y: ["70vh", "60vh", "12vh", "70vh"],
            }}
            transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative flex h-full w-full items-center justify-center p-6 sm:p-10">
            <motion.div
              animate={{
                x: [0, 34, -26, 18, 0],
                y: [0, -20, 24, 16, 0],
              }}
              transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
              className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[minmax(280px,420px),1fr]"
            >
              <div className="mx-auto w-full max-w-[420px]">
                <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/60">
                  {track?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.imageUrl}
                      alt={`${track.title ?? "Current track"} cover`}
                      className="h-full w-full object-cover opacity-90"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-7xl text-white/20">
                      ♪
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 text-center lg:text-left">
                <p className="mb-4 text-sm uppercase tracking-[0.45em] text-green-300/70">
                  {isPlaying ? "Now playing" : "Paused"}
                </p>

                <h2 className="text-balance text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
                  {track?.title || "Nothing playing"}
                </h2>

                <p className="mt-5 text-xl text-zinc-300 sm:text-2xl">
                  {artistText}
                </p>

                <p className="mt-2 text-sm text-zinc-500 sm:text-base">
                  {albumText}
                </p>

                <div className="mt-10 w-full max-w-2xl mx-auto lg:mx-0">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-green-300"
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.35 }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-zinc-500">
                    <span>{formatTime(track?.progressMs)}</span>
                    <span>{formatTime(track?.durationMs)}</span>
                  </div>
                </div>

                <div className="mt-10 flex items-center justify-center gap-4 lg:justify-start">
                  <button
                    type="button"
                    onClick={onPrevious}
                    disabled={controlLoading || !track}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous track"
                  >
                    <SkipBack size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    disabled={controlLoading || !track}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause size={26} fill="currentColor" />
                    ) : (
                      <Play size={26} fill="currentColor" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onNext}
                    disabled={controlLoading || !track}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next track"
                  >
                    <SkipForward size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="absolute right-4 top-4 flex cursor-auto items-center gap-2 opacity-0 transition hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white"
              aria-label={
                fullscreenActive
                  ? "Exit browser fullscreen"
                  : "Enter browser fullscreen"
              }
            >
              {fullscreenActive ? (
                <Minimize2 size={17} />
              ) : (
                <Maximize2 size={17} />
              )}
            </button>

            <button
              type="button"
              onClick={leaveFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white"
              aria-label="Close fullscreen now playing"
            >
              <X size={18} />
            </button>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 cursor-auto rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-500 opacity-0 backdrop-blur-xl transition hover:opacity-100 focus-within:opacity-100">
            Press Esc to close. Controls appear when you move to the top-right.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
