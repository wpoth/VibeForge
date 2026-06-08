import { useCallback, useEffect, useState } from "react";

import { getErrorMessage } from "@/lib/ui-helpers";

export type CurrentlyPlayingTrack = {
  id?: string;
  uri?: string;
  title?: string;
  artists?: string[];
  album?: string;
  imageUrl?: string | null;
  progressMs?: number;
  durationMs?: number;
  spotifyUrl?: string;
};

type CurrentlyPlayingResponse = {
  success?: boolean;
  error?: boolean | string;
  message?: string;
  isPlaying?: boolean;
  currentlyPlaying?: CurrentlyPlayingTrack | null;
};

export function useCurrentlyPlaying(accessToken: string | undefined) {
  const [currentlyPlaying, setCurrentlyPlaying] =
    useState<CurrentlyPlayingTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingError, setCurrentlyPlayingError] = useState<
    string | null
  >(null);

  const refreshCurrentlyPlaying = useCallback(async () => {
    if (!accessToken) {
      setCurrentlyPlaying(null);
      setIsPlaying(false);
      return;
    }

    try {
      const res = await fetch("/api/currently-playing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
        }),
      });

      const data = (await res.json()) as CurrentlyPlayingResponse;

      if (!res.ok || data.error) {
        throw new Error(
          data.message ||
          String(data.error) ||
          "Failed to fetch currently playing track"
        );
      }

      setCurrentlyPlaying(data.currentlyPlaying ?? null);
      setIsPlaying(Boolean(data.isPlaying));
      setCurrentlyPlayingError(null);
    } catch (error: unknown) {
      console.error("Currently playing failed:", error);
      setCurrentlyPlayingError(getErrorMessage(error));
    }
  }, [accessToken]);

  useEffect(() => {
    void refreshCurrentlyPlaying();

    if (!accessToken) return;

    const intervalId = window.setInterval(() => {
      void refreshCurrentlyPlaying();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [accessToken, refreshCurrentlyPlaying]);

  return {
    currentlyPlaying,
    isPlaying,
    currentlyPlayingError,
    refreshCurrentlyPlaying,
  };
}