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
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";

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
  const snakeBorderPathId = useId();

  const [mounted, setMounted] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);

  const artistText = track?.artists?.join(", ") || "Spotify";
  const albumText = track?.album || "Now playing";

  const snakeText = useMemo(() => {
    const title = track?.title || "Nothing playing";
    const artists = artistText || "Unknown artist";

    return `${title}  •  ${artists}  •  ${albumText}  •  `;
  }, [track?.title, artistText, albumText]);

  const progressPercent = useMemo(() => {
    if (!track?.durationMs || !track?.progressMs) return 0;

    return Math.min(
      100,
      Math.max(0, (track.progressMs / track.durationMs) * 100),
    );
  }, [track?.durationMs, track?.progressMs]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function syncFullscreenState() {
      setFullscreenActive(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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

  async function leaveFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen errors.
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
      // Ignore fullscreen errors.
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[999999] cursor-none overflow-hidden bg-black text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen now playing"
        >
          {track?.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={track.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-20 blur-3xl"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-black/95" />
            </>
          ) : (
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

          <div className="relative flex h-screen w-screen items-center justify-center px-5 py-8 sm:px-10">
            <motion.div
              animate={{
                x: [0, 26, -22, 14, 0],
                y: [0, -18, 20, 12, 0],
              }}
              transition={{ duration: 95, repeat: Infinity, ease: "linear" }}
              className="flex w-full max-w-6xl flex-col items-center"
            >
              <div className="relative flex min-h-[min(68vh,640px)] w-full items-center justify-center">
                <motion.div
                  animate={{
                    x: [0, 18, -14, 10, 0],
                    y: [0, -12, 16, 8, 0],
                  }}
                  transition={{
                    duration: 68,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="relative z-10 w-[min(58vw,430px)] min-w-[260px]"
                >
                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[calc(100%+5.5rem)] w-[calc(100%+5.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-visible">
                    <svg
                      viewBox="0 0 500 500"
                      className="h-full w-full overflow-visible"
                    >
                      <defs>
                        <path
                          id={snakeBorderPathId}
                          d="
                            M 82 46
                            H 418
                            Q 454 46 454 82
                            V 418
                            Q 454 454 418 454
                            H 82
                            Q 46 454 46 418
                            V 82
                            Q 46 46 82 46
                          "
                        />
                      </defs>

                      <text
                        className="fill-white/90 text-[18px] font-black uppercase tracking-[0.28em]"
                        dominantBaseline="middle"
                      >
                        <textPath href={`#${snakeBorderPathId}`} startOffset="100%">
                          {snakeText}
                          <animate
                            attributeName="startOffset"
                            from="100%"
                            to="-100%"
                            dur="18s"
                            repeatCount="indefinite"
                          />
                        </textPath>
                      </text>

                      <text
                        className="fill-white/25 text-[18px] font-black uppercase tracking-[0.28em]"
                        dominantBaseline="middle"
                      >
                        <textPath href={`#${snakeBorderPathId}`} startOffset="0%">
                          {snakeText}
                          <animate
                            attributeName="startOffset"
                            from="0%"
                            to="-200%"
                            dur="18s"
                            repeatCount="indefinite"
                          />
                        </textPath>
                      </text>
                    </svg>
                  </div>

                  {track?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={track.imageUrl}
                      alt=""
                      className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-125 rounded-[2.4rem] object-cover opacity-35 blur-3xl"
                    />
                  )}

                  <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/60">
                    {track?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.imageUrl}
                        alt={`${track.title ?? "Current track"} cover`}
                        className="h-full w-full object-cover opacity-95"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-7xl text-white/20">
                        ♪
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5" />
                  </div>
                </motion.div>
              </div>

              <div className="relative z-20 -mt-2 w-full max-w-4xl text-center">
                <p className="mb-3 text-xs uppercase tracking-[0.45em] text-green-300/70 sm:text-sm">
                  {isPlaying ? "Now playing" : "Paused"}
                </p>

                <h2 className="text-balance text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {track?.title || "Nothing playing"}
                </h2>

                <p className="mt-4 text-lg text-zinc-300 sm:text-2xl">
                  {artistText}
                </p>

                <p className="mt-2 text-sm text-zinc-500 sm:text-base">
                  {albumText}
                </p>

                <div className="mx-auto mt-8 w-full max-w-2xl">
                  <div className="relative h-3 overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-[0_0_35px_rgba(255,255,255,0.08)]">
                    {track?.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={track.imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full scale-150 object-cover opacity-80 blur-md"
                      />
                    )}

                    <div className="absolute inset-0 bg-black/35" />

                    <motion.div
                      className="relative h-full overflow-hidden rounded-full shadow-[0_0_22px_rgba(255,255,255,0.35)]"
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.35 }}
                    >
                      {track?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.imageUrl}
                          alt=""
                          className="h-full w-full scale-[3] object-cover blur-sm"
                        />
                      ) : (
                        <div className="h-full w-full bg-green-300" />
                      )}

                      <motion.div
                        className="absolute inset-0 bg-white/25"
                        animate={{ opacity: [0.18, 0.38, 0.18] }}
                        transition={{
                          duration: 2.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-zinc-500">
                    <span>{formatTime(track?.progressMs)}</span>
                    <span>{formatTime(track?.durationMs)}</span>
                  </div>
                </div>

                <div className="mt-8 flex cursor-auto items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={onPrevious}
                    disabled={controlLoading || !track}
                    className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous track"
                  >
                    <SkipBack size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    disabled={controlLoading || !track}
                    className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
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
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white"
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
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white"
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
    </AnimatePresence>,
    document.body,
  );
}