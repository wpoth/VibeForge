import { useCallback, useEffect, useState } from "react";

import type {
  PlaylistsResponse,
  SpotifyPlaylist,
} from "@/lib/spotify-types";

import { getErrorMessage } from "@/lib/ui-helpers";

type UseSpotifyPlaylistsResult = {
  playlists: SpotifyPlaylist[];
  playlistsLoaded: boolean;
  hiddenPlaylists: number;
  playlistsError: string | null;
  setPlaylists: React.Dispatch<React.SetStateAction<SpotifyPlaylist[]>>;
  setHiddenPlaylists: React.Dispatch<React.SetStateAction<number>>;
  loadPlaylists: () => Promise<void>;
};

export function useSpotifyPlaylists(
  accessToken: string | undefined
): UseSpotifyPlaylistsResult {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false);
  const [hiddenPlaylists, setHiddenPlaylists] = useState(0);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);

  const loadPlaylists = useCallback(async () => {
    if (!accessToken) {
      setPlaylists([]);
      setHiddenPlaylists(0);
      setPlaylistsLoaded(false);
      setPlaylistsError(null);
      return;
    }

    setPlaylistsLoaded(false);
    setPlaylistsError(null);

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = (await res.json()) as PlaylistsResponse;

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message ||
            String(data?.error) ||
            `Failed to load playlists: ${res.status}`
        );
      }

      setPlaylists(data.items ?? []);
      setHiddenPlaylists(data.hidden ?? 0);
    } catch (error: unknown) {
      console.error("Load playlists failed:", error);
      setPlaylists([]);
      setHiddenPlaylists(0);
      setPlaylistsError(getErrorMessage(error));
    } finally {
      setPlaylistsLoaded(true);
    }
  }, [accessToken]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  return {
    playlists,
    playlistsLoaded,
    hiddenPlaylists,
    playlistsError,
    setPlaylists,
    setHiddenPlaylists,
    loadPlaylists,
  };
}