"use client";

import { LogOut, Maximize2, Sparkles, Settings } from "lucide-react";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { signOut } from "next-auth/react";

import { SettingsDrawer } from "@/components/settings/SettingsDrawer";
import { toast } from "@/components/common/ToastProvider";
import { CurrentlyPlayingBox } from "@/components/header/CurrentlyPlayingBox";
import { NowPlayingPopover } from "@/components/header/NowPlayingPopover";
import { FullscreenNowPlaying } from "@/components/header/FullscreenNowPlaying";
import type { CurrentlyPlayingTrack } from "@/hooks/useCurrentlyPlaying";
import { getErrorMessage } from "@/lib/ui-helpers";
import { QueueDrawer } from "@/components/header/QueueDrawer";
import { usePlayerQueue } from "@/hooks/usePlayerQueue";

type HeaderProps = {
  accessToken: string | undefined;
  onAiModeClick: () => void;
  currentlyPlaying?: CurrentlyPlayingTrack | null;
  isPlaying?: boolean;
  onRefreshPlayback?: () => Promise<void>;
};

type PlayerControlAction = "next" | "previous" | "pause" | "resume";

export function Header({
  accessToken,
  onAiModeClick,
  currentlyPlaying,
  isPlaying = false,
  onRefreshPlayback,
}: HeaderProps) {
  const nowPlayingRef = useRef<HTMLDivElement | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreenNowPlayingOpen, setFullscreenNowPlayingOpen] = useState(
    false,
  );

  const {
    queueOpen,
    queueLoading,
    queueError,
    currentlyPlayingQueueItem,
    queueItems,
    loadQueue,
    closeQueue,
  } = usePlayerQueue({
    accessToken,
  });
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [controlLoading, setControlLoading] = useState(false);
  const [seekLoading, setSeekLoading] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  async function openFullscreenNowPlaying() {
    setPopoverOpen(false);
    setFullscreenNowPlayingOpen(true);

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.warn("Fullscreen request failed:", error);
    }
  }

  async function controlPlayback(action: PlayerControlAction) {
    if (!accessToken) {
      toast({
        type: "error",
        title: "Could not control playback",
        description: "Missing access token.",
      });
      return;
    }

    setControlLoading(true);

    try {
      const res = await fetch("/api/player-control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          action,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message ||
            String(data?.error) ||
            "Failed to control Spotify playback",
        );
      }

      await onRefreshPlayback?.();
    } catch (error) {
      toast({
        type: "error",
        title: "Spotify control failed",
        description: getErrorMessage(error),
      });
    } finally {
      setControlLoading(false);
    }
  }

  async function seekPlayback(positionMs: number) {
    if (!accessToken) {
      toast({
        type: "error",
        title: "Could not seek playback",
        description: "Missing access token.",
      });
      return;
    }

    setSeekLoading(true);

    try {
      const res = await fetch("/api/player-seek", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          positionMs,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message ||
            String(data?.error) ||
            "Failed to seek Spotify playback",
        );
      }

      await onRefreshPlayback?.();
    } catch (error) {
      toast({
        type: "error",
        title: "Seek failed",
        description: getErrorMessage(error),
      });
    } finally {
      setSeekLoading(false);
    }
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center border-b border-white/10 bg-[#0f1117]/80 px-3 backdrop-blur-xl sm:px-5"
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="relative z-20 flex min-w-0 shrink-0 items-center gap-2"
      >
        <motion.div
          whileHover={{ scale: 1.08, rotate: -4 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-green-400/30 bg-green-500/20 text-sm text-green-300 shadow-lg shadow-green-500/10"
        >
          ♪
        </motion.div>

        <motion.h1
          layout
          className="font-display hidden truncate font-bold tracking-tight sm:block"
        >
          VibeForge
        </motion.h1>
      </motion.div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex min-w-0 -translate-x-1/2 -translate-y-1/2 justify-center">
        <AnimatePresence mode="wait">
          {currentlyPlaying?.title ? (
            <motion.div
              ref={nowPlayingRef}
              key="currently-playing-active"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto min-w-0"
            >
              <div className="flex items-center gap-2">
                <CurrentlyPlayingBox
                  title={currentlyPlaying.title}
                  artists={currentlyPlaying.artists}
                  imageUrl={currentlyPlaying.imageUrl}
                  isPlaying={isPlaying}
                  onClick={() => {
                    if (nowPlayingRef.current) {
                      setAnchorRect(
                        nowPlayingRef.current.getBoundingClientRect(),
                      );
                    }

                    setPopoverOpen((current) => !current);
                  }}
                />

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={openFullscreenNowPlaying}
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 shadow-lg shadow-black/10 backdrop-blur-xl transition hover:bg-white/[0.1] hover:text-white sm:flex"
                  aria-label="Open fullscreen now playing"
                  title="Open fullscreen now playing"
                >
                  <Maximize2 size={15} strokeWidth={2.2} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="currently-playing-empty"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto min-w-0"
            >
              <CurrentlyPlayingBox isPlaying={false} />
            </motion.div>
          )}
        </AnimatePresence>

        <NowPlayingPopover
          open={popoverOpen}
          track={currentlyPlaying ?? null}
          isPlaying={isPlaying}
          controlLoading={controlLoading}
          seekLoading={seekLoading}
          anchorRect={anchorRect}
          onPrevious={() => controlPlayback("previous")}
          onNext={() => controlPlayback("next")}
          onTogglePlay={() => controlPlayback(isPlaying ? "pause" : "resume")}
          onSeek={seekPlayback}
          onOpenQueue={loadQueue}
          onClose={() => setPopoverOpen(false)}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, delay: 0.08 }}
        className="relative z-20 ml-auto flex shrink-0 items-center gap-1 sm:gap-2"
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAiModeClick}
          className="flex h-9 items-center gap-1.5 rounded-full px-2 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white sm:px-3"
          aria-label="AI Mode"
        >
          <Sparkles size={16} strokeWidth={2.2} />
          <span className="hidden sm:inline">AI Mode</span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setSettingsOpen(true)}
          className="flex h-9 items-center gap-1.5 rounded-full px-2 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white sm:px-3"
          aria-label="Settings"
        >
          <Settings size={16} strokeWidth={2.2} />
          <span className="hidden sm:inline">Settings</span>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => signOut()}
          className="flex h-9 items-center gap-1.5 rounded-full px-2 text-sm text-zinc-400 transition hover:bg-white/[0.06] hover:text-white sm:px-3"
          aria-label="Logout"
        >
          <LogOut size={16} strokeWidth={2.2} />
          <span className="hidden sm:inline">Logout</span>
        </motion.button>
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </motion.div>
      <QueueDrawer
        open={queueOpen}
        loading={queueLoading}
        error={queueError}
        currentlyPlaying={currentlyPlayingQueueItem}
        queue={queueItems}
        onClose={closeQueue}
        onRefresh={loadQueue}
      />

      <FullscreenNowPlaying
        open={fullscreenNowPlayingOpen}
        track={currentlyPlaying ?? null}
        isPlaying={isPlaying}
        controlLoading={controlLoading}
        onPrevious={() => controlPlayback("previous")}
        onNext={() => controlPlayback("next")}
        onTogglePlay={() => controlPlayback(isPlaying ? "pause" : "resume")}
        onClose={() => setFullscreenNowPlayingOpen(false)}
      />
    </motion.header>
  );
}
