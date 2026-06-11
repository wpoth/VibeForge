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
import { useEffect, useId, useMemo, useRef, useState } from "react";
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

  const touchStartYRef = useRef<number | null>(null);
  const touchCurrentYRef = useRef<number | null>(null);
  const cursorTimeoutRef = useRef<number | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [hintPosition, setHintPosition] = useState<"top" | "bottom">("top");

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
    document.documentElement.style.overflow = "hidden";

    setHintPosition("top");

    hintTimeoutRef.current = window.setTimeout(() => {
      setHintPosition("bottom");
    }, 3500);

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      setDragOffset(0);
      setCursorVisible(false);
      setHintPosition("top");
      touchStartYRef.current = null;
      touchCurrentYRef.current = null;

      if (cursorTimeoutRef.current) {
        window.clearTimeout(cursorTimeoutRef.current);
        cursorTimeoutRef.current = null;
      }

      if (hintTimeoutRef.current) {
        window.clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = null;
      }
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

  function handleMouseMove() {
    setCursorVisible(true);

    if (cursorTimeoutRef.current) {
      window.clearTimeout(cursorTimeoutRef.current);
    }

    cursorTimeoutRef.current = window.setTimeout(() => {
      setCursorVisible(false);
    }, 1400);
  }

  function handleMouseLeave() {
    setCursorVisible(false);

    if (cursorTimeoutRef.current) {
      window.clearTimeout(cursorTimeoutRef.current);
      cursorTimeoutRef.current = null;
    }
  }

  function moveHintToBottom() {
    setHintPosition("bottom");

    if (hintTimeoutRef.current) {
      window.clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = null;
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
    touchCurrentYRef.current = event.touches[0]?.clientY ?? null;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const startY = touchStartYRef.current;
    const currentY = event.touches[0]?.clientY ?? null;

    if (startY === null || currentY === null) return;

    touchCurrentYRef.current = currentY;

    const distance = currentY - startY;

    if (distance > 0) {
      setDragOffset(Math.min(distance, 180));
    }
  }

  function handleTouchEnd() {
    const startY = touchStartYRef.current;
    const currentY = touchCurrentYRef.current;

    touchStartYRef.current = null;
    touchCurrentYRef.current = null;

    if (startY === null || currentY === null) {
      setDragOffset(0);
      return;
    }

    const distance = currentY - startY;

    if (distance > 90) {
      void leaveFullscreen();
      return;
    }

    setDragOffset(0);
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity:
              dragOffset > 0 ? Math.max(0.55, 1 - dragOffset / 260) : 1,
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className={`fixed inset-0 z-[999999] overflow-hidden bg-black text-white ${cursorVisible ? "sm:cursor-auto" : "sm:cursor-none"
            }`}
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen now playing"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <style>
            {`
              @keyframes vf-background-float-a {
                0% {
                  transform: translate3d(10vw, 15vh, 0);
                }
                25% {
                  transform: translate3d(70vw, 25vh, 0);
                }
                50% {
                  transform: translate3d(40vw, 70vh, 0);
                }
                75% {
                  transform: translate3d(18vw, 52vh, 0);
                }
                100% {
                  transform: translate3d(10vw, 15vh, 0);
                }
              }

              @keyframes vf-background-float-b {
                0% {
                  transform: translate3d(75vw, 70vh, 0);
                }
                25% {
                  transform: translate3d(25vw, 60vh, 0);
                }
                50% {
                  transform: translate3d(60vw, 12vh, 0);
                }
                75% {
                  transform: translate3d(82vw, 30vh, 0);
                }
                100% {
                  transform: translate3d(75vw, 70vh, 0);
                }
              }

              @keyframes vf-stage-drift {
                0% {
                  transform: translate3d(0, 0, 0);
                }
                25% {
                  transform: translate3d(26px, -18px, 0);
                }
                50% {
                  transform: translate3d(-22px, 20px, 0);
                }
                75% {
                  transform: translate3d(14px, 12px, 0);
                }
                100% {
                  transform: translate3d(0, 0, 0);
                }
              }

              @keyframes vf-album-drift {
                0% {
                  transform: translate3d(0, 0, 0);
                }
                25% {
                  transform: translate3d(18px, -12px, 0);
                }
                50% {
                  transform: translate3d(-14px, 16px, 0);
                }
                75% {
                  transform: translate3d(10px, 8px, 0);
                }
                100% {
                  transform: translate3d(0, 0, 0);
                }
              }

              @keyframes vf-mobile-album-drift {
                0% {
                  transform: translate3d(0, 0, 0);
                }
                25% {
                  transform: translate3d(6px, -4px, 0);
                }
                50% {
                  transform: translate3d(-5px, 5px, 0);
                }
                75% {
                  transform: translate3d(4px, 3px, 0);
                }
                100% {
                  transform: translate3d(0, 0, 0);
                }
              }

              @keyframes vf-progress-shimmer {
                0% {
                  opacity: 0.18;
                }
                50% {
                  opacity: 0.38;
                }
                100% {
                  opacity: 0.18;
                }
              }

              .vf-gpu-smooth {
                transform: translate3d(0, 0, 0);
                backface-visibility: hidden;
                perspective: 1000px;
                will-change: transform;
              }

              .vf-background-float-a {
                animation: vf-background-float-a 48s linear infinite;
              }

              .vf-background-float-b {
                animation: vf-background-float-b 55s linear infinite;
              }

              .vf-stage-drift {
                animation: vf-stage-drift 95s linear infinite;
              }

              .vf-album-drift {
                animation: vf-album-drift 68s linear infinite;
              }

              .vf-progress-shimmer {
                animation: vf-progress-shimmer 2.6s ease-in-out infinite;
              }

              @media (max-width: 639px) {
                .vf-background-float-a,
                .vf-background-float-b {
                  animation-duration: 90s;
                  opacity: 0.55;
                }

                .vf-stage-drift {
                  animation: none;
                  transform: translate3d(0, 0, 0);
                }

                .vf-album-drift {
                  animation: vf-mobile-album-drift 42s linear infinite;
                }
              }
            `}
          </style>

          {track?.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={track.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-20 blur-3xl sm:opacity-20"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black via-black/85 to-black/95" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.14),transparent_35%),#000]" />
          )}

          <div
            aria-hidden="true"
            className="vf-background-float-a vf-gpu-smooth absolute h-52 w-52 rounded-full bg-green-400/10 blur-3xl sm:h-80 sm:w-80"
          />

          <div
            aria-hidden="true"
            className="vf-background-float-b vf-gpu-smooth absolute h-48 w-48 rounded-full bg-purple-400/10 blur-3xl sm:h-72 sm:w-72"
          />

          <motion.div
            animate={{ y: dragOffset }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative flex h-[100dvh] w-screen items-center justify-center overflow-hidden px-4 pb-6 pt-12 sm:h-screen sm:px-10 sm:py-8"
          >
            <div className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 flex-col items-center gap-2 sm:hidden">
              <div className="h-1.5 w-12 rounded-full bg-white/25" />
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                Swipe down to close
              </p>
            </div>

            <div className="vf-stage-drift vf-gpu-smooth flex h-full w-full max-w-6xl flex-col items-center justify-center">
              <div className="relative flex w-full flex-1 items-center justify-center sm:min-h-[min(68vh,640px)]">
                <div className="vf-album-drift vf-gpu-smooth relative z-10 w-[min(64vw,280px)] min-w-[210px] sm:w-[min(58vw,430px)] sm:min-w-[260px]">
                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[calc(100%+3.25rem)] w-[calc(100%+3.25rem)] -translate-x-1/2 -translate-y-1/2 overflow-visible sm:h-[calc(100%+5.5rem)] sm:w-[calc(100%+5.5rem)]">
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
                        className="fill-white/90 text-[18px] font-black uppercase tracking-[0.28em] sm:text-[18px]"
                        dominantBaseline="middle"
                      >
                        <textPath
                          href={`#${snakeBorderPathId}`}
                          startOffset="-100%"
                        >
                          {snakeText}
                          <animate
                            attributeName="startOffset"
                            from="-100%"
                            to="100%"
                            dur="18s"
                            repeatCount="indefinite"
                          />
                        </textPath>
                      </text>

                      <text
                        className="fill-white/25 text-[18px] font-black uppercase tracking-[0.28em] sm:text-[18px]"
                        dominantBaseline="middle"
                      >
                        <textPath
                          href={`#${snakeBorderPathId}`}
                          startOffset="-200%"
                        >
                          {snakeText}
                          <animate
                            attributeName="startOffset"
                            from="-200%"
                            to="0%"
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
                      className="pointer-events-none absolute inset-0 -z-20 h-full w-full scale-110 rounded-[2.4rem] object-cover opacity-25 blur-2xl sm:scale-125 sm:opacity-35 sm:blur-3xl"
                    />
                  )}

                  <div className="relative aspect-square overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/60 sm:rounded-[2rem]">
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
                </div>
              </div>

              <div className="relative z-20 w-full max-w-4xl shrink-0 text-center sm:-mt-2">
                <p className="mb-2 text-[10px] uppercase tracking-[0.35em] text-green-300/70 sm:mb-3 sm:text-sm sm:tracking-[0.45em]">
                  {isPlaying ? "Now playing" : "Paused"}
                </p>

                <h2 className="mx-auto line-clamp-2 max-w-[92vw] text-balance text-2xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {track?.title || "Nothing playing"}
                </h2>

                <p className="mx-auto mt-3 line-clamp-1 max-w-[88vw] text-base text-zinc-300 sm:mt-4 sm:text-2xl">
                  {artistText}
                </p>

                <p className="mx-auto mt-1 line-clamp-1 max-w-[84vw] text-xs text-zinc-500 sm:mt-2 sm:text-base">
                  {albumText}
                </p>

                <div className="mx-auto mt-6 w-full max-w-[88vw] sm:mt-8 sm:max-w-2xl">
                  <div className="relative h-2.5 overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-[0_0_35px_rgba(255,255,255,0.08)] sm:h-3">
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

                      <div className="vf-progress-shimmer absolute inset-0 bg-white/25" />
                    </motion.div>
                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-zinc-500 sm:mt-3 sm:text-xs">
                    <span>{formatTime(track?.progressMs)}</span>
                    <span>{formatTime(track?.durationMs)}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4 sm:mt-8">
                  <button
                    type="button"
                    onClick={onPrevious}
                    disabled={controlLoading || !track}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12 ${cursorVisible ? "sm:cursor-pointer" : "sm:cursor-none"
                      }`}
                    aria-label="Previous track"
                  >
                    <SkipBack size={19} />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    disabled={controlLoading || !track}
                    className={`flex h-15 w-15 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 sm:h-16 sm:w-16 ${cursorVisible ? "sm:cursor-pointer" : "sm:cursor-none"
                      }`}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause size={25} fill="currentColor" />
                    ) : (
                      <Play size={25} fill="currentColor" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onNext}
                    disabled={controlLoading || !track}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12 ${cursorVisible ? "sm:cursor-pointer" : "sm:cursor-none"
                      }`}
                    aria-label="Next track"
                  >
                    <SkipForward size={19} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <div
            className={`absolute right-4 top-4 hidden items-center gap-2 opacity-0 transition hover:opacity-100 focus-within:opacity-100 sm:flex ${cursorVisible ? "sm:cursor-auto" : "sm:cursor-none"
              }`}
          >
            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white ${cursorVisible ? "sm:cursor-pointer" : "sm:cursor-none"
                }`}
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
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 backdrop-blur-xl transition hover:bg-white/[0.12] hover:text-white ${cursorVisible ? "sm:cursor-pointer" : "sm:cursor-none"
                }`}
              aria-label="Close fullscreen now playing"
            >
              <X size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={leaveFullscreen}
            className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/35 text-zinc-200 backdrop-blur-xl transition active:scale-95 sm:hidden"
            aria-label="Close fullscreen now playing"
          >
            <X size={18} />
          </button>

          <motion.div
            initial={false}
            animate={{
              top: hintPosition === "top" ? 18 : "auto",
              bottom: hintPosition === "bottom" ? 16 : "auto",
              opacity: cursorVisible ? 1 : 0,
              y: hintPosition === "top" ? 0 : 0,
            }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            onMouseEnter={moveHintToBottom}
            className={`absolute left-1/2 hidden -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-500 backdrop-blur-xl transition-colors hover:bg-white/[0.07] hover:text-zinc-300 sm:block ${cursorVisible ? "sm:cursor-auto" : "sm:cursor-none"
              }`}
          >
            Move to the top-right to exit fullscreen.
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}