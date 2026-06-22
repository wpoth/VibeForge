import { useState } from "react";

import type { SpotifyPlaylist, SpotifyPlaylistItem } from "@/lib/spotify-types";
import { isLikedSongsPlaylist } from "@/lib/spotify-types";

import { getErrorMessage, getTrackFromPlaylistItem } from "@/lib/ui-helpers";

type UseSpotifyPlaybackArgs = {
  accessToken: string | undefined;
  selectedPlaylist: SpotifyPlaylist | null;
  tracks: SpotifyPlaylistItem[];
};

type UseSpotifyPlaybackResult = {
  playingTrackUri: string | null;
  playingPlaylistId: string | null;
  playbackLoading: boolean;
  playbackError: string | null;
  playTrack: (playlistItem: SpotifyPlaylistItem) => Promise<void>;
  playPlaylist: (playlist: SpotifyPlaylist) => Promise<void>;
  addToQueue: (playlistItem: SpotifyPlaylistItem) => Promise<void>;
};

function getTrackUriFromPlaylistItem(playlistItem: SpotifyPlaylistItem) {
  return playlistItem.item?.uri ?? playlistItem.track?.uri ?? null;
}

function getLoadedUrisFromTrack({
  tracks,
  selectedTrackUri,
}: {
  tracks: SpotifyPlaylistItem[];
  selectedTrackUri: string;
}) {
  const selectedIndex = tracks.findIndex((playlistItem) => {
    return getTrackUriFromPlaylistItem(playlistItem) === selectedTrackUri;
  });

  if (selectedIndex === -1) {
    return [selectedTrackUri];
  }

  return tracks
    .slice(selectedIndex)
    .map(getTrackUriFromPlaylistItem)
    .filter((uri): uri is string => Boolean(uri))
    .slice(0, 100);
}

export function useSpotifyPlayback({
  accessToken,
  selectedPlaylist,
  tracks,
}: UseSpotifyPlaybackArgs): UseSpotifyPlaybackResult {
  const [playingTrackUri, setPlayingTrackUri] = useState<string | null>(null);
  const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(
    null,
  );
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  async function playTrack(playlistItem: SpotifyPlaylistItem) {
    if (!accessToken) {
      const message = "Could not play this song because you are not logged in.";
      setPlaybackError(message);
      throw new Error(message);
    }

    if (!selectedPlaylist) {
      const message = "Could not play this song because no playlist is selected.";
      setPlaybackError(message);
      throw new Error(message);
    }

    const track = getTrackFromPlaylistItem(playlistItem);

    if (!track?.uri) {
      const message =
        "Could not play this song because it is missing a Spotify URI.";
      setPlaybackError(message);
      throw new Error(message);
    }

    setPlaybackLoading(true);
    setPlaybackError(null);

    try {
      const likedSongs = isLikedSongsPlaylist(selectedPlaylist);

      const res = await fetch("/api/play-track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          trackUri: track.uri,
          trackUris: likedSongs
            ? getLoadedUrisFromTrack({
              tracks,
              selectedTrackUri: track.uri,
            })
            : undefined,
          playlistId: selectedPlaylist.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message || String(data?.error) || "Failed to play song",
        );
      }

      setPlayingTrackUri(track.uri);
      setPlayingPlaylistId(selectedPlaylist.id);
    } catch (error: unknown) {
      console.error("Play song failed:", error);
      setPlaybackError(getErrorMessage(error));
      throw error;
    } finally {
      setPlaybackLoading(false);
    }
  }

  async function playPlaylist(playlist: SpotifyPlaylist) {
    if (!accessToken) {
      const message =
        "Could not play this playlist because you are not logged in.";
      setPlaybackError(message);
      throw new Error(message);
    }

    if (isLikedSongsPlaylist(playlist)) {
      const message =
        "Spotify does not expose Liked Songs as a normal playable playlist. Open it and start a song instead.";
      setPlaybackError(message);
      throw new Error(message);
    }

    if (!playlist.id) {
      const message = "Could not play this playlist because it is missing an ID.";
      setPlaybackError(message);
      throw new Error(message);
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
          playlistId: playlist.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message || String(data?.error) || "Failed to play playlist",
        );
      }

      setPlayingTrackUri(null);
      setPlayingPlaylistId(playlist.id);
    } catch (error: unknown) {
      console.error("Play playlist failed:", error);
      setPlaybackError(getErrorMessage(error));
      throw error;
    } finally {
      setPlaybackLoading(false);
    }
  }

  async function addToQueue(playlistItem: SpotifyPlaylistItem) {
    if (!accessToken) {
      const message =
        "Could not add this song to queue because you are not logged in.";
      setPlaybackError(message);
      throw new Error(message);
    }

    const track = getTrackFromPlaylistItem(playlistItem);

    if (!track?.uri) {
      const message =
        "Could not add this song to queue because it is missing a Spotify URI.";
      setPlaybackError(message);
      throw new Error(message);
    }

    setPlaybackLoading(true);
    setPlaybackError(null);

    try {
      const res = await fetch("/api/add-to-queue", {
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
          data?.message ||
          String(data?.error) ||
          "Failed to add song to queue",
        );
      }
    } catch (error: unknown) {
      console.error("Add to queue failed:", error);
      setPlaybackError(getErrorMessage(error));
      throw error;
    } finally {
      setPlaybackLoading(false);
    }
  }

  return {
    playingTrackUri,
    playingPlaylistId,
    playbackLoading,
    playbackError,
    playTrack,
    playPlaylist,
    addToQueue,
  };
}