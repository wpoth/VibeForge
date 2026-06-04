import { useState } from "react";

import type { SpotifyPlaylistItem } from "@/lib/spotify-types";

import {
  getErrorMessage,
  getTrackFromPlaylistItem,
} from "@/lib/ui-helpers";

type UseSpotifyPlaybackArgs = {
  accessToken: string | undefined;
};

type UseSpotifyPlaybackResult = {
  playingTrackUri: string | null;
  playbackLoading: boolean;
  playbackError: string | null;
  playTrack: (playlistItem: SpotifyPlaylistItem) => Promise<void>;
};

export function useSpotifyPlayback({
  accessToken,
}: UseSpotifyPlaybackArgs): UseSpotifyPlaybackResult {
  const [playingTrackUri, setPlayingTrackUri] = useState<string | null>(null);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  async function playTrack(playlistItem: SpotifyPlaylistItem) {
    if (!accessToken) return;

    const track = getTrackFromPlaylistItem(playlistItem);

    if (!track?.uri) {
      setPlaybackError(
        "Could not play this song because it is missing a Spotify URI."
      );
      return;
    }

    setPlaybackLoading(true);
    setPlaybackError(null);

    try {
      const res = await fetch("/api/play-track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          trackUri: track.uri,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message || String(data?.error) || "Failed to play song"
        );
      }

      setPlayingTrackUri(track.uri);
    } catch (error: unknown) {
      console.error("Play song failed:", error);
      setPlaybackError(getErrorMessage(error));
    } finally {
      setPlaybackLoading(false);
    }
  }

  return {
    playingTrackUri,
    playbackLoading,
    playbackError,
    playTrack,
  };
}