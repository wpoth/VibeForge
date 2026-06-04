import { useState } from "react";

import type {
  SpotifyPlaylist,
  SpotifyPlaylistItem,
} from "@/lib/spotify-types";

import {
  getErrorMessage,
  getTrackFromPlaylistItem,
} from "@/lib/ui-helpers";

type UseTrackRemovalArgs = {
  accessToken: string | undefined;
  selectedPlaylist: SpotifyPlaylist | null;
  tracks: SpotifyPlaylistItem[];
  setTracks: React.Dispatch<React.SetStateAction<SpotifyPlaylistItem[]>>;
  setPlaylists: React.Dispatch<React.SetStateAction<SpotifyPlaylist[]>>;
  setSelectedPlaylist: React.Dispatch<
    React.SetStateAction<SpotifyPlaylist | null>
  >;
};

type UseTrackRemovalResult = {
  trackToRemove: SpotifyPlaylistItem | null;
  removingTrack: boolean;

  selectionMode: boolean;
  selectedTrackUris: string[];
  removingSelectedTracks: boolean;
  confirmingBulkRemove: boolean;

  requestRemoveTrack: (playlistItem: SpotifyPlaylistItem) => void;
  confirmRemoveTrack: () => Promise<void>;
  cancelRemoveTrack: () => void;

  toggleSelectionMode: () => void;
  clearTrackSelection: () => void;
  selectAllTracks: () => void;
  toggleTrackSelection: (playlistItem: SpotifyPlaylistItem) => void;

  requestRemoveSelectedTracks: () => void;
  confirmRemoveSelectedTracks: () => Promise<void>;
  cancelRemoveSelectedTracks: () => void;

  trackRemovalError: string | null;
};

export function useTrackRemoval({
  accessToken,
  selectedPlaylist,
  tracks,
  setTracks,
  setPlaylists,
  setSelectedPlaylist,
}: UseTrackRemovalArgs): UseTrackRemovalResult {
  const [trackToRemove, setTrackToRemove] =
    useState<SpotifyPlaylistItem | null>(null);

  const [removingTrack, setRemovingTrack] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTrackUris, setSelectedTrackUris] = useState<string[]>([]);
  const [removingSelectedTracks, setRemovingSelectedTracks] = useState(false);
  const [confirmingBulkRemove, setConfirmingBulkRemove] = useState(false);

  const [trackRemovalError, setTrackRemovalError] = useState<string | null>(
    null
  );

  function updatePlaylistCounts(delta: number) {
    if (!selectedPlaylist) return;

    setPlaylists((currentPlaylists) =>
      currentPlaylists.map((playlist) => {
        if (playlist.id !== selectedPlaylist.id) return playlist;

        const currentTotal =
          playlist.items?.total ?? playlist.tracks?.total ?? tracks.length;

        const nextTotal = Math.max(currentTotal + delta, 0);

        return {
          ...playlist,
          items: { total: nextTotal },
          tracks: { total: nextTotal },
        };
      })
    );

    setSelectedPlaylist((currentPlaylist) => {
      if (!currentPlaylist || currentPlaylist.id !== selectedPlaylist.id) {
        return currentPlaylist;
      }

      const currentTotal =
        currentPlaylist.items?.total ??
        currentPlaylist.tracks?.total ??
        tracks.length;

      const nextTotal = Math.max(currentTotal + delta, 0);

      return {
        ...currentPlaylist,
        items: { total: nextTotal },
        tracks: { total: nextTotal },
      };
    });
  }

  function requestRemoveTrack(playlistItem: SpotifyPlaylistItem) {
    setTrackToRemove(playlistItem);
    setTrackRemovalError(null);
  }

  function cancelRemoveTrack() {
    if (removingTrack) return;

    setTrackToRemove(null);
    setTrackRemovalError(null);
  }

  async function confirmRemoveTrack() {
    if (!accessToken || !selectedPlaylist || !trackToRemove) return;

    const track = getTrackFromPlaylistItem(trackToRemove);

    if (!track?.uri) {
      setTrackRemovalError(
        "Could not remove song because it is missing a Spotify URI."
      );
      setTrackToRemove(null);
      return;
    }

    setRemovingTrack(true);
    setTrackRemovalError(null);

    try {
      const res = await fetch("/api/remove-playlist-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          playlistId: selectedPlaylist.id,
          itemUri: track.uri,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message || String(data?.error) || "Failed to remove song"
        );
      }

      setTracks((currentTracks) => {
        let removed = false;

        return currentTracks.filter((playlistItem) => {
          const currentTrack = getTrackFromPlaylistItem(playlistItem);

          if (!removed && currentTrack?.uri === track.uri) {
            removed = true;
            return false;
          }

          return true;
        });
      });

      setSelectedTrackUris((currentUris) =>
        currentUris.filter((uri) => uri !== track.uri)
      );

      updatePlaylistCounts(-1);

      setTrackToRemove(null);
    } catch (error: unknown) {
      console.error("Remove song failed:", error);
      setTrackRemovalError(getErrorMessage(error));
    } finally {
      setRemovingTrack(false);
    }
  }

  function toggleSelectionMode() {
    setSelectionMode((current) => {
      const next = !current;

      if (!next) {
        setSelectedTrackUris([]);
      }

      return next;
    });
  }

  function clearTrackSelection() {
    setSelectedTrackUris([]);
  }

  function selectAllTracks() {
    const uris = tracks
      .map((playlistItem) => {
        const track = getTrackFromPlaylistItem(playlistItem);
        return track?.uri;
      })
      .filter((uri): uri is string => Boolean(uri));

    setSelectedTrackUris(Array.from(new Set(uris)));
  }

  function toggleTrackSelection(playlistItem: SpotifyPlaylistItem) {
    const track = getTrackFromPlaylistItem(playlistItem);

    if (!track?.uri) {
      setTrackRemovalError(
        "Could not select this song because it is missing a Spotify URI."
      );
      return;
    }

    setSelectedTrackUris((currentUris) => {
      if (currentUris.includes(track.uri!)) {
        return currentUris.filter((uri) => uri !== track.uri);
      }

      return [...currentUris, track.uri!];
    });
  }

  function requestRemoveSelectedTracks() {
    if (!selectedTrackUris.length) return;

    setTrackRemovalError(null);
    setConfirmingBulkRemove(true);
  }

  function cancelRemoveSelectedTracks() {
    if (removingSelectedTracks) return;

    setConfirmingBulkRemove(false);
    setTrackRemovalError(null);
  }

  async function confirmRemoveSelectedTracks() {
    if (!accessToken || !selectedPlaylist || !selectedTrackUris.length) return;

    const urisToRemove = selectedTrackUris;

    setRemovingSelectedTracks(true);
    setTrackRemovalError(null);

    try {
      const res = await fetch("/api/remove-playlist-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          playlistId: selectedPlaylist.id,
          itemUris: urisToRemove,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message || String(data?.error) || "Failed to remove songs"
        );
      }

      setTracks((currentTracks) =>
        currentTracks.filter((playlistItem) => {
          const track = getTrackFromPlaylistItem(playlistItem);
          return !track?.uri || !urisToRemove.includes(track.uri);
        })
      );

      updatePlaylistCounts(-urisToRemove.length);

      setSelectedTrackUris([]);
      setSelectionMode(false);
      setConfirmingBulkRemove(false);
    } catch (error: unknown) {
      console.error("Remove selected songs failed:", error);
      setTrackRemovalError(getErrorMessage(error));
    } finally {
      setRemovingSelectedTracks(false);
    }
  }

  return {
    trackToRemove,
    removingTrack,

    selectionMode,
    selectedTrackUris,
    removingSelectedTracks,
    confirmingBulkRemove,

    requestRemoveTrack,
    confirmRemoveTrack,
    cancelRemoveTrack,

    toggleSelectionMode,
    clearTrackSelection,
    selectAllTracks,
    toggleTrackSelection,

    requestRemoveSelectedTracks,
    confirmRemoveSelectedTracks,
    cancelRemoveSelectedTracks,

    trackRemovalError,
  };
}