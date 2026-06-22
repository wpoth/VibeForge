import { useCallback, useState } from "react";

import type {
  PlaylistTracksResponse,
  SpotifyPlaylist,
  SpotifyPlaylistItem,
} from "@/lib/spotify-types";
import { isLikedSongsPlaylist } from "@/lib/spotify-types";

import { getErrorMessage } from "@/lib/ui-helpers";

const LIKED_SONGS_PAGE_SIZE = 50;

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
  loadingMoreTracks: boolean;
  hasMoreTracks: boolean;
  totalTrackCount: number | null;
  openPlaylist: (playlist: SpotifyPlaylist) => Promise<void>;
  loadMoreTracks: () => Promise<void>;
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
  const [loadingMoreTracks, setLoadingMoreTracks] = useState(false);
  const [hasMoreTracks, setHasMoreTracks] = useState(false);
  const [nextTrackOffset, setNextTrackOffset] = useState<number | null>(null);
  const [totalTrackCount, setTotalTrackCount] = useState<number | null>(null);
  const [playlistTracksError, setPlaylistTracksError] = useState<string | null>(
    null,
  );

  const resetPlaylistView = useCallback(() => {
    setSelectedPlaylist(null);
    setTracks([]);
    setHasMoreTracks(false);
    setNextTrackOffset(null);
    setTotalTrackCount(null);
    setPlaylistTracksError(null);
    onViewChange("ai");
  }, [onViewChange]);

  const fetchPlaylistTracks = useCallback(
    async ({
      playlist,
      offset = 0,
    }: {
      playlist: SpotifyPlaylist;
      offset?: number;
    }) => {
      if (!accessToken) {
        throw new Error("Missing access token.");
      }

      const shouldUsePagedLoading = isLikedSongsPlaylist(playlist);

      const tracksRes = await fetch("/api/playlist-tracks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playlistId: playlist.id,
          accessToken,
          limit: shouldUsePagedLoading ? LIKED_SONGS_PAGE_SIZE : undefined,
          offset: shouldUsePagedLoading ? offset : undefined,
        }),
      });

      const tracksData = (await tracksRes.json()) as PlaylistTracksResponse;

      if (!tracksRes.ok || tracksData?.error) {
        throw new Error(
          tracksData?.message ||
          "Could not load playlist tracks. Spotify may not expose items for this playlist.",
        );
      }

      return tracksData;
    },
    [accessToken],
  );

  const openPlaylist = useCallback(
    async (playlist: SpotifyPlaylist) => {
      if (!accessToken) return;

      onViewChange("playlist");
      setSelectedPlaylist(playlist);
      setTracks([]);
      setHasMoreTracks(false);
      setNextTrackOffset(null);
      setTotalTrackCount(null);
      setLoadingTracks(true);
      setPlaylistTracksError(null);

      try {
        const tracksData = await fetchPlaylistTracks({
          playlist,
          offset: 0,
        });

        setTracks(tracksData.items ?? []);
        setHasMoreTracks(Boolean(tracksData.hasMore));
        setNextTrackOffset(tracksData.nextOffset ?? null);
        setTotalTrackCount(
          tracksData.total ?? tracksData.items?.length ?? null,
        );
      } catch (error: unknown) {
        console.error("Failed to open playlist:", error);
        setPlaylistTracksError(getErrorMessage(error));
        setTracks([]);
        setHasMoreTracks(false);
        setNextTrackOffset(null);
        setTotalTrackCount(null);
      } finally {
        setLoadingTracks(false);
      }
    },
    [accessToken, fetchPlaylistTracks, onViewChange],
  );

  const loadMoreTracks = useCallback(async () => {
    if (!accessToken) return;
    if (!selectedPlaylist) return;
    if (!isLikedSongsPlaylist(selectedPlaylist)) return;
    if (!hasMoreTracks) return;
    if (loadingTracks || loadingMoreTracks) return;
    if (nextTrackOffset === null) return;

    setLoadingMoreTracks(true);
    setPlaylistTracksError(null);

    try {
      const tracksData = await fetchPlaylistTracks({
        playlist: selectedPlaylist,
        offset: nextTrackOffset,
      });

      setTracks((currentTracks) => [
        ...currentTracks,
        ...(tracksData.items ?? []),
      ]);

      setHasMoreTracks(Boolean(tracksData.hasMore));
      setNextTrackOffset(tracksData.nextOffset ?? null);
      setTotalTrackCount((currentTotal) => tracksData.total ?? currentTotal);
    } catch (error: unknown) {
      console.error("Failed to load more tracks:", error);
      setPlaylistTracksError(getErrorMessage(error));
    } finally {
      setLoadingMoreTracks(false);
    }
  }, [
    accessToken,
    selectedPlaylist,
    hasMoreTracks,
    loadingTracks,
    loadingMoreTracks,
    nextTrackOffset,
    fetchPlaylistTracks,
  ]);

  return {
    selectedPlaylist,
    setSelectedPlaylist,
    tracks,
    setTracks,
    loadingTracks,
    loadingMoreTracks,
    hasMoreTracks,
    totalTrackCount,
    openPlaylist,
    loadMoreTracks,
    resetPlaylistView,
    playlistTracksError,
  };
}