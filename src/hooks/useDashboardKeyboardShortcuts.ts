"use client";

import { useEffect } from "react";

type DashboardKeyboardShortcutsOptions = {
  enabled?: boolean;
  hasCurrentTrack?: boolean;
  isPlaying?: boolean;
  currentProgressMs?: number;
  currentDurationMs?: number;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (positionMs: number) => void;
  onOpenFullscreen: () => void;
  onOpenQueue: () => void;
  onGoHome: () => void;
  onGoAi: () => void;
  onGoRecent: () => void;
  onGoStats: () => void;
  onOpenHelp: () => void;
  onCloseHelp?: () => void;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
}

export function useDashboardKeyboardShortcuts({
  enabled = true,
  hasCurrentTrack = false,
  currentProgressMs = 0,
  currentDurationMs = 0,
  onTogglePlay,
  onPrevious,
  onNext,
  onSeek,
  onOpenFullscreen,
  onOpenQueue,
  onGoHome,
  onGoAi,
  onGoRecent,
  onGoStats,
  onOpenHelp,
  onCloseHelp,
}: DashboardKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();

      if (event.key === "Escape") {
        onCloseHelp?.();
        return;
      }

      if (event.key === "?" || (event.shiftKey && event.key === "/")) {
        event.preventDefault();
        onOpenHelp();
        return;
      }

      if (event.code === "Space") {
        if (!hasCurrentTrack) return;

        event.preventDefault();
        onTogglePlay();
        return;
      }

      if (event.key === "ArrowLeft") {
        if (!hasCurrentTrack) return;

        event.preventDefault();

        if (event.shiftKey) {
          onPrevious();
          return;
        }

        onSeek(Math.max(0, currentProgressMs - 10_000));
        return;
      }

      if (event.key === "ArrowRight") {
        if (!hasCurrentTrack) return;

        event.preventDefault();

        if (event.shiftKey) {
          onNext();
          return;
        }

        onSeek(Math.min(currentDurationMs, currentProgressMs + 10_000));
        return;
      }

      if (key === "f") {
        if (!hasCurrentTrack) return;

        event.preventDefault();
        onOpenFullscreen();
        return;
      }

      if (key === "q") {
        event.preventDefault();
        onOpenQueue();
        return;
      }

      if (key === "h") {
        event.preventDefault();
        onGoHome();
        return;
      }

      if (key === "a") {
        event.preventDefault();
        onGoAi();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        onGoRecent();
        return;
      }

      if (key === "s") {
        event.preventDefault();
        onGoStats();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    enabled,
    hasCurrentTrack,
    currentProgressMs,
    currentDurationMs,
    onTogglePlay,
    onPrevious,
    onNext,
    onSeek,
    onOpenFullscreen,
    onOpenQueue,
    onGoHome,
    onGoAi,
    onGoRecent,
    onGoStats,
    onOpenHelp,
    onCloseHelp,
  ]);
}
