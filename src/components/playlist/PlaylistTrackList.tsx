"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { TrackRow } from "@/components/playlist/TrackRow";
import type { SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getTrackFromPlaylistItem } from "@/lib/ui-helpers";

type PlaylistTrackListProps = {
  tracks: SpotifyPlaylistItem[];
  selectionMode: boolean;
  selectedTrackUris: string[];
  playingTrackUri: string | null;
  playbackLoading: boolean;
  canRemoveTracks?: boolean;
  isPagedPlaylist?: boolean;
  hasMoreTracks?: boolean;
  loadingMoreTracks?: boolean;
  totalTrackCount?: number | null;

  onLoadMoreTracks?: () => void;
  onPlayTrack: (playlistItem: SpotifyPlaylistItem) => void;
  onAddToQueue: (playlistItem: SpotifyPlaylistItem) => void;
  onResearchTrack: (playlistItem: SpotifyPlaylistItem) => void;
  onFindSimilarTracks: (playlistItem: SpotifyPlaylistItem) => void;
  onRemoveTrack: (playlistItem: SpotifyPlaylistItem) => void;
  onToggleTrackSelection: (playlistItem: SpotifyPlaylistItem) => void;
};

function getSearchableTrackText(playlistItem: SpotifyPlaylistItem) {
  const track = getTrackFromPlaylistItem(playlistItem);

  const title = track?.name ?? "";
  const artists =
    track?.artists
      ?.map((artist) => artist.name)
      .filter(Boolean)
      .join(" ") ?? "";
  const album = track?.album?.name ?? "";

  return `${title} ${artists} ${album}`.toLowerCase();
}

export function PlaylistTrackList({
  tracks,
  selectionMode,
  selectedTrackUris,
  playingTrackUri,
  playbackLoading,
  canRemoveTracks = true,
  isPagedPlaylist = false,
  hasMoreTracks = false,
  loadingMoreTracks = false,
  totalTrackCount = null,
  onLoadMoreTracks,
  onPlayTrack,
  onAddToQueue,
  onResearchTrack,
  onFindSimilarTracks,
  onRemoveTrack,
  onToggleTrackSelection,
}: PlaylistTrackListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredTracks = useMemo(() => {
    return tracks
      .map((playlistItem, originalIndex) => ({
        playlistItem,
        originalIndex,
      }))
      .filter(({ playlistItem }) => {
        if (!normalizedSearchQuery) return true;

        return getSearchableTrackText(playlistItem).includes(
          normalizedSearchQuery,
        );
      });
  }, [tracks, normalizedSearchQuery]);

  useEffect(() => {
    if (!isPagedPlaylist) return;
    if (!hasMoreTracks) return;
    if (loadingMoreTracks) return;
    if (!onLoadMoreTracks) return;
    if (normalizedSearchQuery) return;

    const target = loadMoreRef.current;

    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry?.isIntersecting) {
          onLoadMoreTracks();
        }
      },
      {
        root: null,
        rootMargin: "700px 0px",
        threshold: 0,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    isPagedPlaylist,
    hasMoreTracks,
    loadingMoreTracks,
    normalizedSearchQuery,
    onLoadMoreTracks,
  ]);

  const loadedText =
    totalTrackCount && totalTrackCount > tracks.length
      ? `${tracks.length} of ${totalTrackCount} songs loaded`
      : `${tracks.length} songs loaded`;

  return (
    <div className="space-y-3">
      {tracks.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <Search
              size={17}
              strokeWidth={2.3}
              className="shrink-0 text-zinc-500"
            />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={
                isPagedPlaylist
                  ? "Search loaded liked songs..."
                  : "Search this playlist..."
              }
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-full bg-white/[0.08] p-1.5 text-zinc-400 transition hover:bg-white/[0.12] hover:text-white"
                aria-label="Clear playlist search"
              >
                <X size={15} strokeWidth={2.3} />
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
            <p>
              {normalizedSearchQuery
                ? `Showing ${filteredTracks.length} of ${tracks.length} loaded songs`
                : loadedText}
            </p>

            {isPagedPlaylist && hasMoreTracks && normalizedSearchQuery && (
              <p className="text-zinc-600">
                Search only checks loaded songs. Load more to search deeper.
              </p>
            )}
          </div>
        </div>
      )}

      {normalizedSearchQuery && filteredTracks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center"
        >
          <p className="text-sm font-semibold text-white">No matching songs</p>
          <p className="mt-2 text-sm text-zinc-500">
            Try searching by song title, artist, or album.
          </p>
        </motion.div>
      )}

      <motion.div layout className="space-y-2">
        <AnimatePresence initial={false}>
          {filteredTracks.map(({ playlistItem, originalIndex }) => {
            const uri = playlistItem.item?.uri ?? playlistItem.track?.uri ?? "";
            const selected = uri ? selectedTrackUris.includes(uri) : false;

            return (
              <motion.div
                key={
                  playlistItem.item?.id ??
                  playlistItem.track?.id ??
                  originalIndex
                }
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                transition={{
                  opacity: { duration: 0.16 },
                  y: { duration: 0.18 },
                  x: { duration: 0.16 },
                  layout: { duration: 0.22 },
                }}
              >
                <TrackRow
                  playlistItem={playlistItem}
                  index={originalIndex}
                  selectionMode={selectionMode}
                  selected={selected}
                  playingTrackUri={playingTrackUri}
                  playbackLoading={playbackLoading}
                  canRemove={canRemoveTracks}
                  onToggleSelect={onToggleTrackSelection}
                  onRemove={onRemoveTrack}
                  onPlay={onPlayTrack}
                  onAddToQueue={onAddToQueue}
                  onResearch={onResearchTrack}
                  onFindSimilar={onFindSimilarTracks}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {isPagedPlaylist && hasMoreTracks && (
        <div ref={loadMoreRef} className="flex justify-center py-5">
          <button
            type="button"
            disabled={loadingMoreTracks}
            onClick={onLoadMoreTracks}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMoreTracks && (
              <Loader2 size={16} className="animate-spin" />
            )}
            {loadingMoreTracks ? "Loading more..." : "Load more songs"}
          </button>
        </div>
      )}

      {isPagedPlaylist && !hasMoreTracks && tracks.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-xs text-zinc-600">
          All liked songs loaded.
        </div>
      )}
    </div>
  );
}