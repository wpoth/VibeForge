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
import { useImageAccentColor } from "@/hooks/useImageAccentColor";

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
  const [fullscreenChromeVisible, setFullscreenChromeVisible] = useState(true);

  const accentColor = useImageAccentColor(track?.imageUrl);

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

  useEffect(() => {
    if (!open) {
      setFullscreenChromeVisible(false);
      return;
    }

    let hideTimeout: number | undefined;

    function showFullscreenChrome() {
      setFullscreenChromeVisible(true);

      if (hideTimeout !== undefined) {
        window.clearTimeout(hideTimeout);
      }

      hideTimeout = window.setTimeout(() => {
        setFullscreenChromeVisible(false);
      }, 1500);
    }

    showFullscreenChrome();

    window.addEventListener("mousemove", showFullscreenChrome);
    window.addEventListener("mousedown", showFullscreenChrome);
    window.addEventListener("touchstart", showFullscreenChrome);
    window.addEventListener("keydown", showFullscreenChrome);

    return () => {
      if (hideTimeout !== undefined) {
        window.clearTimeout(hideTimeout);
      }

      window.removeEventListener("mousemove", showFullscreenChrome);
      window.removeEventListener("mousedown", showFullscreenChrome);
      window.removeEventListener("touchstart", showFullscreenChrome);
      window.removeEventListener("keydown", showFullscreenChrome);
    };
  }, [open]);

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
          className={`fixed inset-0 z-[100] overflow-hidden bg-black text-white ${fullscreenChromeVisible ? "cursor-default" : "cursor-none"
            }`}
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
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-3xl"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/72 to-black/95" />
            </>
          )}

          {!track?.imageUrl && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.14),transparent_35%),#000]" />
          )}

          <motion.div
            aria-hidden="true"
            className="absolute h-[34rem] w-[34rem] rounded-full blur-[90px]"
            style={{
              backgroundColor: accentColor.rgbaStrong,
              boxShadow: `0 0 160px ${accentColor.rgbaMedium}`,
            }}
            animate={{
              x: ["-8vw", "58vw", "28vw", "-8vw"],
              y: ["4vh", "14vh", "58vh", "4vh"],
              scale: [1, 1.18, 0.92, 1],
              opacity: [0.72, 0.95, 0.8, 0.72],
            }}
            transition={{ duration: 42, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute h-[30rem] w-[30rem] rounded-full blur-[85px]"
            style={{
              backgroundColor: accentColor.rgbaMedium,
              boxShadow: `0 0 150px ${accentColor.rgbaSoft}`,
            }}
            animate={{
              x: ["68vw", "12vw", "62vw", "68vw"],
              y: ["62vh", "48vh", "0vh", "62vh"],
              scale: [0.95, 1.22, 1, 0.95],
              opacity: [0.58, 0.9, 0.72, 0.58],
            }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute h-[24rem] w-[24rem] rounded-full blur-[75px]"
            style={{
              backgroundColor: `rgba(${accentColor.rgb}, 0.32)`,
            }}
            animate={{
              x: ["38vw", "76vw", "8vw", "38vw"],
              y: ["-8vh", "42vh", "72vh", "-8vh"],
              scale: [0.8, 1.12, 0.95, 0.8],
              opacity: [0.45, 0.8, 0.65, 0.45],
            }}
            transition={{ duration: 58, repeat: Infinity, ease: "linear" }}
          />

          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(${accentColor.rgb}, 0.16), transparent 34%)`,
            }}
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
                <div
                  className="relative aspect-square overflow-hidden rounded-[2rem] border bg-white/[0.04] shadow-2xl shadow-black/60"
                  style={{
                    borderColor: accentColor.rgbaMedium,
                    boxShadow: `0 28px 110px ${accentColor.rgbaMedium}`,
                  }}
                >
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
                </div>
              </div>

              <div className="min-w-0 text-center lg:text-left">
                <p
                  className="mb-4 text-sm uppercase tracking-[0.45em]"
                  style={{
                    color: isPlaying
                      ? `rgb(${accentColor.rgb})`
                      : "rgba(212, 212, 216, 0.65)",
                    textShadow: isPlaying
                      ? `0 0 24px ${accentColor.rgbaStrong}`
                      : undefined,
                  }}
                >
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

                <div className="mx-auto mt-10 w-full max-w-2xl lg:mx-0">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: `rgb(${accentColor.rgb})`,
                        boxShadow: `0 0 22px ${accentColor.rgbaStrong}`,
                      }}
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
                    className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-200 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous track"
                  >
                    <SkipBack size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    disabled={controlLoading || !track}
                    className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      backgroundColor: `rgb(${accentColor.rgb})`,
                      boxShadow: `0 0 45px ${accentColor.rgbaStrong}`,
                    }}
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

          <div
            className={`pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-center text-xs font-medium text-zinc-300 shadow-2xl shadow-black/30 backdrop-blur-xl transition-all duration-300 ${fullscreenChromeVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
              }`}
          >
            Move to the top-right to exit fullscreen. Press Esc to close.
          </div>

          <div
            className={`absolute right-4 top-4 z-30 flex items-center gap-2 transition-all duration-300 ${fullscreenChromeVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
              }`}
          >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}