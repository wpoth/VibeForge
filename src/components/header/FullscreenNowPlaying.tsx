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
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
} from "react";
import { createPortal } from "react-dom";

import type { CurrentlyPlayingTrack } from "@/hooks/useCurrentlyPlaying";
import { useImageAccentColor } from "@/hooks/useImageAccentColor";

type FullscreenNowPlayingProps = {
  open: boolean;
  track: CurrentlyPlayingTrack | null;
  nextTrack?: CurrentlyPlayingTrack | null;
  isPlaying: boolean;
  controlLoading?: boolean;
  seekLoading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSeek: (positionMs: number) => void;
  onClose: () => void;
};

function formatTime(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getArtistText(artists?: string[] | null) {
  if (!artists?.length) return "Unknown artist";

  return artists.join(", ");
}

function MiniVisualizer({
  playing,
  accentRgb,
  accentGlow,
}: {
  playing: boolean;
  accentRgb: string;
  accentGlow: string;
}) {
  const bars = [0.34, 0.72, 0.48, 0.92, 0.58, 0.82, 0.42, 0.68, 0.5, 0.88];

  return (
    <div className="flex h-9 items-end justify-center gap-1.5">
      {bars.map((height, index) => (
        <motion.span
          key={index}
          initial={{ height: `${height * 100}%` }}
          animate={
            playing
              ? {
                  height: [
                    `${Math.max(18, height * 70)}%`,
                    `${Math.min(100, height * 125)}%`,
                    `${Math.max(24, height * 85)}%`,
                  ],
                  opacity: [0.45, 1, 0.6],
                }
              : {
                  height: "28%",
                  opacity: 0.26,
                }
          }
          transition={{
            duration: 0.75 + index * 0.035,
            repeat: playing ? Infinity : 0,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: index * 0.045,
          }}
          className="w-1.5 rounded-full"
          style={{
            backgroundColor: `rgb(${accentRgb})`,
            boxShadow: playing ? `0 0 14px ${accentGlow}` : "none",
          }}
        />
      ))}
    </div>
  );
}

export function FullscreenNowPlaying({
  open,
  track,
  nextTrack = null,
  isPlaying,
  controlLoading = false,
  seekLoading = false,
  onPrevious,
  onNext,
  onTogglePlay,
  onSeek,
  onClose,
}: FullscreenNowPlayingProps) {
  const [mounted, setMounted] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [fullscreenChromeVisible, setFullscreenChromeVisible] = useState(true);
  const [localProgressMs, setLocalProgressMs] = useState(0);

  const hasEnteredFullscreenRef = useRef(false);
  const progressBarRef = useRef<HTMLButtonElement | null>(null);

  const accentColor = useImageAccentColor(track?.imageUrl);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalProgressMs(track?.progressMs ?? 0);
  }, [track?.uri, track?.progressMs]);

  useEffect(() => {
    if (!isPlaying || !track?.durationMs) return;

    const intervalId = window.setInterval(() => {
      setLocalProgressMs((current) =>
        Math.min(current + 1000, track.durationMs ?? current),
      );
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, track?.durationMs]);

  useEffect(() => {
    if (!open) {
      hasEnteredFullscreenRef.current = false;
      return;
    }

    async function enterFullscreen() {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }

        hasEnteredFullscreenRef.current = true;
        setFullscreenActive(Boolean(document.fullscreenElement));
      } catch {
        setFullscreenActive(Boolean(document.fullscreenElement));
      }
    }

    void enterFullscreen();
  }, [open]);

  useEffect(() => {
    function syncFullscreenState() {
      const isFullscreen = Boolean(document.fullscreenElement);

      setFullscreenActive(isFullscreen);

      if (isFullscreen) {
        hasEnteredFullscreenRef.current = true;
        return;
      }

      if (open && hasEnteredFullscreenRef.current) {
        onClose();
      }
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;

    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const previousHtmlOverscrollBehavior = html.style.overscrollBehavior;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;

    const scrollbarWidth = window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      html.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
    };
  }, [open]);

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

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        void closeFullscreenNowPlaying();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const progressPercent = useMemo(() => {
    if (!track?.durationMs) return 0;

    return Math.min(
      100,
      Math.max(0, (localProgressMs / track.durationMs) * 100),
    );
  }, [localProgressMs, track?.durationMs]);

  const remainingMs = useMemo(() => {
    if (!track?.durationMs) return null;

    return Math.max(0, track.durationMs - localProgressMs);
  }, [localProgressMs, track?.durationMs]);

  const showNextUp = Boolean(
    nextTrack && remainingMs !== null && remainingMs <= 10_000 && remainingMs > 0,
  );

  async function closeFullscreenNowPlaying() {
    onClose();

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Browser may reject exitFullscreen if fullscreen was already closed.
    }
  }

  async function toggleBrowserFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenActive(Boolean(document.fullscreenElement));
    }
  }

  function seekFromClientX(clientX: number) {
    if (!track?.durationMs || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const nextPositionMs = Math.floor(track.durationMs * ratio);

    setLocalProgressMs(nextPositionMs);
    onSeek(nextPositionMs);
  }

  function handleProgressClick(event: MouseEvent<HTMLButtonElement>) {
    seekFromClientX(event.clientX);
  }

  function handleProgressTouch(event: TouchEvent<HTMLButtonElement>) {
    const touch = event.changedTouches[0];

    if (!touch) return;

    seekFromClientX(touch.clientX);
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && track && (
        <motion.div
          key="fullscreen-now-playing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[150] h-[100dvh] w-screen overflow-hidden bg-black text-white"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {track.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={track.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-125 object-cover opacity-28 blur-3xl"
                />

                <motion.div
                  animate={
                    isPlaying
                      ? {
                          scale: [1, 1.08, 1],
                          opacity: [0.3, 0.55, 0.3],
                        }
                      : {
                          scale: 1,
                          opacity: 0.28,
                        }
                  }
                  transition={{
                    duration: 7,
                    repeat: isPlaying ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                  className="absolute left-[7vw] top-[8vh] h-[min(42vw,42vh,380px)] w-[min(42vw,42vh,380px)] rounded-full blur-3xl"
                  style={{
                    backgroundColor: accentColor.rgbaStrong,
                  }}
                />

                <motion.div
                  animate={
                    isPlaying
                      ? {
                          scale: [1, 1.14, 1],
                          x: [0, -18, 0],
                          y: [0, 12, 0],
                          opacity: [0.24, 0.46, 0.24],
                        }
                      : {
                          scale: 1,
                          x: 0,
                          y: 0,
                          opacity: 0.2,
                        }
                  }
                  transition={{
                    duration: 8,
                    repeat: isPlaying ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                  className="absolute bottom-[7vh] right-[8vw] h-[min(48vw,48vh,460px)] w-[min(48vw,48vh,460px)] rounded-full blur-3xl"
                  style={{
                    backgroundColor: accentColor.rgbaMedium,
                  }}
                />

                <motion.div
                  animate={
                    isPlaying
                      ? {
                          scale: [1, 1.18, 1],
                          opacity: [0.12, 0.28, 0.12],
                        }
                      : {
                          scale: 1,
                          opacity: 0.12,
                        }
                  }
                  transition={{
                    duration: 9,
                    repeat: isPlaying ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                  className="absolute left-1/2 top-1/2 h-[min(64vw,64vh,620px)] w-[min(64vw,64vh,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                  style={{
                    backgroundColor: accentColor.rgbaSoft,
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-br from-black/76 via-[#0d1018]/84 to-black/96" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.11),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.13),transparent_38%)]" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#10131c] via-[#151923] to-black" />
                <div className="absolute left-[7vw] top-[8vh] h-[min(42vw,42vh,380px)] w-[min(42vw,42vh,380px)] rounded-full bg-green-400/24 blur-3xl" />
                <div className="absolute bottom-[7vh] right-[8vw] h-[min(48vw,48vh,460px)] w-[min(48vw,48vh,460px)] rounded-full bg-purple-400/20 blur-3xl" />
                <div className="absolute left-1/2 top-1/2 h-[min(64vw,64vh,620px)] w-[min(64vw,64vh,620px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
              </>
            )}
          </div>

          <AnimatePresence>
            {fullscreenChromeVisible && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
                className="fixed left-1/2 top-4 z-30 hidden -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-medium text-zinc-300 shadow-xl shadow-black/30 backdrop-blur-xl md:block"
              >
                Move to the top-right to exit fullscreen or press Esc
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {fullscreenChromeVisible && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="fixed right-4 top-4 z-40 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleBrowserFullscreen}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-zinc-300 shadow-xl shadow-black/30 backdrop-blur-xl transition hover:bg-white/[0.1] hover:text-white"
                  aria-label={
                    fullscreenActive
                      ? "Exit browser fullscreen"
                      : "Enter browser fullscreen"
                  }
                  title={
                    fullscreenActive
                      ? "Exit browser fullscreen"
                      : "Enter browser fullscreen"
                  }
                >
                  {fullscreenActive ? (
                    <Minimize2 size={17} strokeWidth={2.2} />
                  ) : (
                    <Maximize2 size={17} strokeWidth={2.2} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={closeFullscreenNowPlaying}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-zinc-300 shadow-xl shadow-black/30 backdrop-blur-xl transition hover:bg-white/[0.1] hover:text-white"
                  aria-label="Close fullscreen now playing"
                  title="Close fullscreen now playing"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showNextUp && nextTrack && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className="fixed bottom-5 right-5 z-30 hidden w-80 rounded-3xl border border-white/10 bg-black/35 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl md:block"
              >
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">
                  Next up
                </p>

                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-600">
                    {nextTrack.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={nextTrack.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Play size={18} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {nextTrack.title ?? "Unknown track"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {getArtistText(nextTrack.artists)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
            <motion.div
              key={track.uri ?? track.title}
              initial={{
                opacity: 0,
                y: 16,
                scale: 0.98,
                filter: "blur(10px)",
              }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                y: -12,
                scale: 0.98,
                filter: "blur(10px)",
              }}
              transition={{
                duration: 0.32,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex w-full max-w-[min(92vw,880px)] flex-col items-center"
            >
              <div
                className="relative aspect-square w-[min(54vw,54vh,390px)] max-w-[390px] overflow-hidden rounded-[clamp(1.5rem,4vw,2.6rem)] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/45"
                style={{
                  boxShadow: `0 24px 90px ${accentColor.rgbaMedium}`,
                }}
              >
                {track.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={track.imageUrl}
                    alt={`${track.title ?? "Track"} cover`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-600">
                    <Play size={54} strokeWidth={1.8} />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25" />

                {isPlaying && (
                  <span
                    className="absolute bottom-5 right-5 h-4 w-4 rounded-full border-2 border-black bg-green-300"
                    style={{
                      boxShadow: `0 0 24px ${accentColor.rgbaStrong}`,
                    }}
                  />
                )}
              </div>

              <div className="mt-[clamp(0.8rem,2vh,1.2rem)]">
                <MiniVisualizer
                  playing={isPlaying}
                  accentRgb={accentColor.rgb}
                  accentGlow={accentColor.rgbaStrong}
                />
              </div>

              <h1 className="mt-[clamp(0.8rem,2.2vh,1.4rem)] max-w-[min(90vw,760px)] text-center text-[clamp(1.7rem,5vw,4rem)] font-black leading-[0.98] tracking-tight text-white">
                {track.title ?? "Unknown track"}
              </h1>

              <p className="mt-3 max-w-[min(86vw,680px)] truncate text-center text-[clamp(0.95rem,2vw,1.2rem)] font-semibold text-zinc-300">
                {getArtistText(track.artists)}
              </p>

              {track.album && (
                <p className="mt-1 max-w-[min(82vw,620px)] truncate text-center text-sm text-zinc-500">
                  {track.album}
                </p>
              )}

              <div className="mt-[clamp(1rem,2.6vh,1.6rem)] w-full max-w-[min(86vw,680px)]">
                <button
                  ref={progressBarRef}
                  type="button"
                  onClick={handleProgressClick}
                  onTouchEnd={handleProgressTouch}
                  disabled={!track.durationMs || seekLoading}
                  className="group relative h-6 w-full cursor-pointer rounded-full disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Seek playback position"
                >
                  <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-white/10 shadow-inner">
                    <motion.div
                      animate={{ width: `${progressPercent}%` }}
                      transition={{
                        duration: 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="relative h-full overflow-hidden rounded-full"
                      style={{
                        backgroundColor: `rgb(${accentColor.rgb})`,
                        boxShadow: `0 0 24px ${accentColor.rgbaStrong}`,
                      }}
                    >
                      {isPlaying && (
                        <motion.div
                          animate={{ x: ["-120%", "220%"] }}
                          transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                        />
                      )}
                    </motion.div>
                  </div>

                  <motion.span
                    animate={{ left: `${progressPercent}%` }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100"
                    style={{
                      backgroundColor: `rgb(${accentColor.rgb})`,
                      boxShadow: `0 0 18px ${accentColor.rgbaStrong}`,
                    }}
                  />
                </button>

                <div className="mt-2 flex justify-between text-xs text-zinc-500">
                  <span>{formatTime(localProgressMs)}</span>
                  <span>{formatTime(track.durationMs ?? 0)}</span>
                </div>
              </div>

              <div className="mt-[clamp(1rem,2.6vh,1.6rem)] flex items-center justify-center gap-3 sm:gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onPrevious}
                  disabled={controlLoading}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-white shadow-lg shadow-black/20 transition hover:bg-white/[0.13] disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
                  aria-label="Previous track"
                >
                  <SkipBack size={19} strokeWidth={2.4} />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{
                    scale: 1.08,
                    boxShadow: `0 0 36px ${accentColor.rgbaStrong}`,
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onTogglePlay}
                  disabled={controlLoading}
                  className="relative flex h-14 w-14 items-center justify-center rounded-full text-black shadow-xl transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-16"
                  style={{
                    backgroundColor: `rgb(${accentColor.rgb})`,
                    boxShadow: `0 16px 44px ${accentColor.rgbaMedium}`,
                  }}
                  aria-label={isPlaying ? "Pause" : "Resume"}
                >
                  {isPlaying && (
                    <motion.span
                      initial={{ opacity: 0.55, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.72 }}
                      transition={{
                        duration: 1.35,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                      className="absolute inset-0 rounded-full border border-white/50"
                    />
                  )}

                  <span className="relative z-10">
                    {isPlaying ? (
                      <Pause size={24} fill="currentColor" strokeWidth={2.4} />
                    ) : (
                      <Play
                        size={24}
                        fill="currentColor"
                        strokeWidth={2.4}
                        className="ml-0.5"
                      />
                    )}
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onNext}
                  disabled={controlLoading}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-white shadow-lg shadow-black/20 transition hover:bg-white/[0.13] disabled:cursor-not-allowed disabled:opacity-50 sm:h-12 sm:w-12"
                  aria-label="Next track"
                >
                  <SkipForward size={19} strokeWidth={2.4} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}