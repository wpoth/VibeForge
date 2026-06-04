import { useState } from "react";

import type {
  PlaylistTracksResponse,
  SpotifyPlaylist,
  SpotifyPlaylistItem,
} from "@/lib/spotify-types";

import { getErrorMessage } from "@/lib/ui-helpers";

type UsePlaylistTracksArgs = {
  accessToken: string | undefined;
  onViewChange: (view: "ai" | "playlist") => void;
};

type UsePlaylistTracksResult = {
  selectedPlaylist: SpotifyPlaylist | null;
  setSelectedPlaylist: React.Dispatch<
    React.SetStateAction<SpotifyPlaylist | null>
  >;
  tracks: SpotifyPlaylistItem[];
  setTracks: React.Dispatch<React.SetStateAction<SpotifyPlaylistItem[]>>;
  loadingTracks: boolean;
  openPlaylist: (playlist: SpotifyPlaylist) => Promise<void>;
  resetPlaylistView: () => void;
  playlistTracksError: string | null;
};

export function usePlaylistTracks({
  accessToken,
  onViewChange,
}: UsePlaylistTracksArgs): UsePlaylistTracksResult {
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyPlaylist | null>(null);

  const [tracks, setTracks] = useState<SpotifyPlaylistItem[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [playlistTracksError, setPlaylistTracksError] = useState<string | null>(
    null
  );

  function resetPlaylistView() {
    setSelectedPlaylist(null);
    setTracks([]);
    setPlaylistTracksError(null);
    onViewChange("ai");
  }

  async function openPlaylist(playlist: SpotifyPlaylist) {
    if (!accessToken) return;

    onViewChange("playlist");
    setSelectedPlaylist(playlist);
    setTracks([]);
    setLoadingTracks(true);
    setPlaylistTracksError(null);

    try {
      const tracksRes = await fetch("/api/playlist-tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playlistId: playlist.id,
          accessToken,
        }),
      });

      const tracksData = (await tracksRes.json()) as PlaylistTracksResponse;

      if (!tracksRes.ok || tracksData?.error) {
        throw new Error(
          tracksData?.message ||
            "Could not load playlist tracks. Spotify may not expose items for this playlist."
        );
      }

      setTracks(tracksData.items ?? []);
    } catch (error: unknown) {
      console.error("Failed to open playlist:", error);
      setPlaylistTracksError(getErrorMessage(error));
      setTracks([]);
    } finally {
      setLoadingTracks(false);
    }
  }

  return {
    selectedPlaylist,
    setSelectedPlaylist,
    tracks,
    setTracks,
    loadingTracks,
    openPlaylist,
    resetPlaylistView,
    playlistTracksError,
  };
}