"use client";

import { AnimatePresence, motion } from "motion/react";

import { EmptyTracksState } from "@/components/playlist/EmptyTracksState";
import { ManageTracksPanel } from "@/components/playlist/ManageTracksPanel";
import { PlaylistAiFeatures } from "@/components/playlist/PlaylistAiFeatures";
import { PlaylistHeader } from "@/components/playlist/PlaylistHeader";
import { PlaylistLoadingState } from "@/components/playlist/PlaylistLoadingState";
import { PlaylistTrackList } from "@/components/playlist/PlaylistTrackList";
import type { SpotifyPlaylist, SpotifyPlaylistItem } from "@/lib/spotify-types";

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
  if (loadingTracks) {
    return <PlaylistLoadingState />;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="w-full max-w-6xl"
    >
      <PlaylistHeader selectedPlaylist={selectedPlaylist} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <PlaylistAiFeatures
            selectedPlaylist={selectedPlaylist}
            tracks={tracks}
            loadingAI={loadingAI}
            aiAnalysis={aiAnalysis}
            selectionMode={selectionMode}
            onGenerateAiAnalysis={onGenerateAiAnalysis}
          />

          <AnimatePresence>
            {tracks.length === 0 && <EmptyTracksState />}
          </AnimatePresence>

          <PlaylistTrackList
            tracks={tracks}
            selectionMode={selectionMode}
            selectedTrackUris={selectedTrackUris}
            playingTrackUri={playingTrackUri}
            playbackLoading={playbackLoading}
            onPlayTrack={onPlayTrack}
            onAddToQueue={onAddToQueue}
            onResearchTrack={onResearchTrack}
            onFindSimilarTracks={onFindSimilarTracks}
            onRemoveTrack={onRemoveTrack}
            onToggleTrackSelection={onToggleTrackSelection}
          />
        </div>

        <AnimatePresence>
          {tracks.length > 0 && (
            <ManageTracksPanel
              key="manage-tracks-panel"
              selectionMode={selectionMode}
              selectedTrackCount={selectedTrackUris.length}
              onToggleSelectionMode={onToggleSelectionMode}
              onClearSelection={onClearSelection}
              onSelectAllTracks={onSelectAllTracks}
              onRequestRemoveSelectedTracks={onRequestRemoveSelectedTracks}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}