import { useEffect, useState } from "react";

import { getErrorMessage } from "@/lib/ui-helpers";

type CurrentlyPlayingTrack = {
  id?: string;
  uri?: string;
  title?: string;
  album?: string;
  imageUrl?: string | null;
  artists?: string[];
};

type CurrentlyPlayingResponse = {
  error?: boolean | string;
  message?: string;
  isPlaying?: boolean;
  track?: CurrentlyPlayingTrack | null;
};

type UseCurrentlyPlayingResult = {
  currentlyPlaying: CurrentlyPlayingTrack | null;
  isPlaying: boolean;
  currentlyPlayingError: string | null;
};

export function useCurrentlyPlaying(
  accessToken: string | undefined
): UseCurrentlyPlayingResult {
  const [currentlyPlaying, setCurrentlyPlaying] =
    useState<CurrentlyPlayingTrack | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingError, setCurrentlyPlayingError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setCurrentlyPlaying(null);
      setIsPlaying(false);
      setCurrentlyPlayingError(null);
      return;
    }

    let cancelled = false;

    async function loadCurrentlyPlaying() {
      try {
        const res = await fetch("/api/currently-playing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken }),
        });

        const data = (await res.json()) as CurrentlyPlayingResponse;

        if (!res.ok || data?.error) {
          throw new Error(
            data?.message ||
              String(data?.error) ||
              "Failed to load currently playing"
          );
        }

        if (!cancelled) {
          setCurrentlyPlaying(data.track ?? null);
          setIsPlaying(Boolean(data.isPlaying));
          setCurrentlyPlayingError(null);
        }
      } catch (error: unknown) {
        console.error("Currently playing failed:", error);

        if (!cancelled) {
          setCurrentlyPlaying(null);
          setIsPlaying(false);
          setCurrentlyPlayingError(getErrorMessage(error));
        }
      }
    }

    loadCurrentlyPlaying();

    const interval = window.setInterval(loadCurrentlyPlaying, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [accessToken]);

  return {
    currentlyPlaying,
    isPlaying,
    currentlyPlayingError,
  };
}