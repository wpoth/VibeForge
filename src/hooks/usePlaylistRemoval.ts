import { useState } from "react";

import type {
  SpotifyPlaylist,
  SpotifyPlaylistItem,
} from "@/lib/spotify-types";

import { getErrorMessage } from "@/lib/ui-helpers";

type UsePlaylistRemovalArgs = {
  accessToken: string | undefined;
  selectedPlaylist: SpotifyPlaylist | null;
  setPlaylists: React.Dispatch<React.SetStateAction<SpotifyPlaylist[]>>;
  setSelectedPlaylist: React.Dispatch<
    React.SetStateAction<SpotifyPlaylist | null>
  >;
  setTracks: React.Dispatch<React.SetStateAction<SpotifyPlaylistItem[]>>;
  setAiAnalysis: React.Dispatch<React.SetStateAction<string | null>>;
  onViewChange: (view: "ai" | "playlist") => void;
};

type UsePlaylistRemovalResult = {
  playlistToRemove: SpotifyPlaylist | null;
  removingPlaylist: boolean;
  requestRemovePlaylist: (playlist: SpotifyPlaylist) => void;
  confirmRemovePlaylist: () => Promise<void>;
  cancelRemovePlaylist: () => void;
  playlistRemovalError: string | null;
};

export function usePlaylistRemoval({
  accessToken,
  selectedPlaylist,
  setPlaylists,
  setSelectedPlaylist,
  setTracks,
  setAiAnalysis,
  onViewChange,
}: UsePlaylistRemovalArgs): UsePlaylistRemovalResult {
  const [playlistToRemove, setPlaylistToRemove] =
    useState<SpotifyPlaylist | null>(null);

  const [removingPlaylist, setRemovingPlaylist] = useState(false);
  const [playlistRemovalError, setPlaylistRemovalError] = useState<
    string | null
  >(null);

  function requestRemovePlaylist(playlist: SpotifyPlaylist) {
    setPlaylistToRemove(playlist);
    setPlaylistRemovalError(null);
  }

  function cancelRemovePlaylist() {
    if (removingPlaylist) return;

    setPlaylistToRemove(null);
    setPlaylistRemovalError(null);
  }

  async function confirmRemovePlaylist() {
    if (!accessToken || !playlistToRemove) return;

    const playlist = playlistToRemove;

    setRemovingPlaylist(true);
    setPlaylistRemovalError(null);

    try {
      const res = await fetch("/api/remove-playlist", {
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
          data?.message || String(data?.error) || "Failed to remove playlist"
        );
      }

      setPlaylists((currentPlaylists) =>
        currentPlaylists.filter((item) => item.id !== playlist.id)
      );

      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(null);
        setTracks([]);
        setAiAnalysis(null);
        onViewChange("ai");
      }

      setPlaylistToRemove(null);
    } catch (error: unknown) {
      console.error("Remove playlist failed:", error);
      setPlaylistRemovalError(getErrorMessage(error));
    } finally {
      setRemovingPlaylist(false);
    }
  }

  return {
    playlistToRemove,
    removingPlaylist,
    requestRemovePlaylist,
    confirmRemovePlaylist,
    cancelRemovePlaylist,
    playlistRemovalError,
  };
}