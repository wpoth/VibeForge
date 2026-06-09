"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Radar } from "lucide-react";
import { CoverImage } from "@/components/common/CoverImage";
import {
  ManagePanelSkeleton,
  PlaylistHeaderSkeleton,
  TrackRowSkeleton,
} from "@/components/common/Skeletons";
import { PlaylistVibeMap } from "@/components/playlist/PlaylistVibeMap";
import { TrackRow } from "@/components/playlist/TrackRow";
import { usePlaylistVibeMap } from "@/hooks/usePlaylistVibeMap";
import type { SpotifyPlaylist, SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";
import { AnimatePresence, motion } from "motion/react";

type PlaylistViewProps = {
  selectedPlaylist: SpotifyPlaylist;
  tracks: SpotifyPlaylistItem[];
  loadingTracks: boolean;
  loadingAI: boolean;
  aiAnalysis: string | null;
  playingTrackUri: string | null;
  playbackLoading: boolean;
  selectionMode: boolean;
  selectedTrackUris: string[];

  onPlayTrack: (playlistItem: SpotifyPlaylistItem) => void;
  onAddToQueue: (playlistItem: SpotifyPlaylistItem) => void;
  onResearchTrack: (playlistItem: SpotifyPlaylistItem) => void;
  onFindSimilarTracks: (playlistItem: SpotifyPlaylistItem) => void;
  onToggleSelectionMode: () => void;
  onClearSelection: () => void;
  onSelectAllTracks: () => void;
  onGenerateAiAnalysis: () => void;
  onRemoveTrack: (playlistItem: SpotifyPlaylistItem) => void;
  onToggleTrackSelection: (playlistItem: SpotifyPlaylistItem) => void;
  onRequestRemoveSelectedTracks: () => void;
};

export function PlaylistView({
  selectedPlaylist,
  tracks,
  loadingTracks,
  loadingAI,
  aiAnalysis,
  selectionMode,
  selectedTrackUris,
  playingTrackUri,
  playbackLoading,
  onToggleSelectionMode,
  onClearSelection,
  onSelectAllTracks,
  onGenerateAiAnalysis,
  onRemoveTrack,
  onToggleTrackSelection,
  onRequestRemoveSelectedTracks,
  onPlayTrack,
  onAddToQueue,
  onResearchTrack,
  onFindSimilarTracks,
}: PlaylistViewProps) {
  const [analysisHidden, setAnalysisHidden] = useState(false);

  const {
    vibeMap,
    vibeMapLoading,
    vibeMapError,
    vibeMapHidden,
    generateVibeMap,
    hideVibeMap,
    showVibeMap,
  } = usePlaylistVibeMap({
    selectedPlaylist,
    tracks,
  });

  useEffect(() => {
    setAnalysisHidden(false);
  }, [selectedPlaylist.id]);

  function handleGenerateAiAnalysis() {
    setAnalysisHidden(false);
    onGenerateAiAnalysis();
  }

  if (loadingTracks) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-6xl"
      >
        <PlaylistHeaderSkeleton />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <TrackRowSkeleton key={index} />
            ))}
          </div>

          <ManagePanelSkeleton />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="w-full max-w-6xl"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        className="mb-8 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:mb-10 sm:flex-row sm:items-end sm:gap-6 sm:p-6"
      >
        <CoverImage
          images={selectedPlaylist.images}
          alt={`${selectedPlaylist.name} cover`}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm font-medium text-green-400">Playlist</p>

          <h2 className="break-words text-3xl font-bold tracking-tight sm:truncate sm:text-4xl">
            {selectedPlaylist.name}
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            {getPlaylistTrackCount(selectedPlaylist)} tracks
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <AnimatePresence>
            {tracks.length > 0 && !selectionMode && (
              <motion.div
                key="playlist-ai-actions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
              >
                {!vibeMap && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={generateVibeMap}
                    disabled={vibeMapLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/[0.08] px-4 py-2 font-semibold text-zinc-100 shadow-lg shadow-black/10 transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <Radar size={16} strokeWidth={2.3} />
                    {vibeMapLoading ? "Mapping vibes..." : "Generate vibe map"}
                  </motion.button>
                )}

                {!aiAnalysis && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={handleGenerateAiAnalysis}
                    disabled={loadingAI}
                    className="w-full rounded-lg bg-green-500 px-4 py-2 font-semibold text-black shadow-lg shadow-green-500/20 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Generate AI analysis
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {vibeMapLoading && (
              <motion.div
                key="vibe-map-loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="mb-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="mb-4 flex items-center gap-2 text-green-300">
                  <Radar size={16} strokeWidth={2.3} />
                  <p className="text-sm font-semibold">Mapping playlist vibe...</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                    >
                      <div className="mb-3 h-3 w-24 animate-pulse rounded bg-white/[0.08]" />
                      <div className="h-1.5 animate-pulse rounded-full bg-white/[0.08]" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {vibeMapError && !vibeMapLoading && (
              <motion.div
                key="vibe-map-error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4"
              >
                <p className="text-sm font-semibold text-red-200">
                  Could not generate vibe map
                </p>
                <p className="mt-2 text-sm text-red-100/80">{vibeMapError}</p>
              </motion.div>
            )}

            {!vibeMapLoading && vibeMap && vibeMapHidden && (
              <motion.div
                key="vibe-map-hidden"
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.2 }}
                className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Vibe map hidden
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    The playlist vibe map is still available.
                  </p>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={showVibeMap}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.1] sm:w-auto"
                >
                  <Eye size={14} strokeWidth={2.2} />
                  Show again
                </motion.button>
              </motion.div>
            )}

            {!vibeMapLoading && vibeMap && !vibeMapHidden && (
              <PlaylistVibeMap
                key="vibe-map-result"
                vibeMap={vibeMap}
                loading={vibeMapLoading}
                onRegenerate={generateVibeMap}
                onHide={hideVibeMap}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {loadingAI && (
              <motion.div
                key="ai-analysis-loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="h-4 w-32 animate-pulse rounded bg-white/[0.08]" />
                <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
              </motion.div>
            )}

            {!loadingAI && aiAnalysis && analysisHidden && (
              <motion.div
                key="ai-analysis-hidden"
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.2 }}
                className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    AI analysis hidden
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    The playlist analysis is still available.
                  </p>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAnalysisHidden(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.1] sm:w-auto"
                >
                  <Eye size={14} strokeWidth={2.2} />
                  Show again
                </motion.button>
              </motion.div>
            )}

            {!loadingAI && aiAnalysis && !analysisHidden && (
              <motion.div
                key="ai-analysis-result"
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.22 }}
                className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl"
              >
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">AI Analysis</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Generated from the current playlist.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleGenerateAiAnalysis}
                      disabled={loadingAI}
                      className="w-full rounded-full bg-white/[0.06] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-1"
                    >
                      Regenerate
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setAnalysisHidden(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.1] sm:w-auto sm:py-1"
                    >
                      <EyeOff size={14} strokeWidth={2.2} />
                      Hide
                    </motion.button>
                  </div>
                </div>

                <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-zinc-300">
                  {aiAnalysis}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {tracks.length === 0 && (
              <motion.div
                key="empty-tracks"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center"
              >
                <p className="text-lg font-semibold text-white">
                  No tracks found
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  This playlist does not have any readable tracks yet.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="space-y-2">
            <AnimatePresence initial={false}>
              {tracks.map((playlistItem, index) => {
                const uri =
                  playlistItem.item?.uri ?? playlistItem.track?.uri ?? "";
                const selected = uri ? selectedTrackUris.includes(uri) : false;

                return (
                  <motion.div
                    key={playlistItem.item?.id ?? playlistItem.track?.id ?? index}
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
                      index={index}
                      selectionMode={selectionMode}
                      selected={selected}
                      playingTrackUri={playingTrackUri}
                      playbackLoading={playbackLoading}
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
        </div>

        <AnimatePresence>
          {tracks.length > 0 && (
            <motion.aside
              layout
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="order-first xl:order-none xl:sticky xl:top-20 xl:self-start"
            >
              <div className="rounded-2xl border border-white/10 bg-[#12141f]/90 p-4 shadow-xl backdrop-blur-xl">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-white">
                    {selectionMode
                      ? `${selectedTrackUris.length} selected`
                      : "Manage tracks"}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Select multiple songs and remove them in one action.
                  </p>
                </div>

                <div className="grid gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={onToggleSelectionMode}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition ${selectionMode
                        ? "bg-white/[0.08] text-zinc-300 hover:bg-white/[0.12]"
                        : "bg-green-500 text-black hover:bg-green-400"
                      }`}
                  >
                    {selectionMode ? "Exit select" : "Select songs"}
                  </motion.button>

                  <AnimatePresence>
                    {selectionMode && (
                      <motion.div
                        key="selection-actions"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="grid gap-2 overflow-hidden"
                      >
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={onSelectAllTracks}
                          className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.1]"
                        >
                          Select all
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={onClearSelection}
                          disabled={selectedTrackUris.length === 0}
                          className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Clear selection
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.985 }}
                          onClick={onRequestRemoveSelectedTracks}
                          disabled={selectedTrackUris.length === 0}
                          className="rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove selected
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}