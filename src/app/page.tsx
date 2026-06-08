"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { AiPlaylistCreator } from "@/components/ai/AiPlaylistCreator";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PlaylistView } from "@/components/playlist/PlaylistView";

import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { useAiPlaylistCreator } from "@/hooks/useAiPlaylistCreator";
import { useCurrentlyPlaying } from "@/hooks/useCurrentlyPlaying";
import { usePlaylistRemoval } from "@/hooks/usePlaylistRemoval";
import { usePlaylistTracks } from "@/hooks/usePlaylistTracks";
import { useSpotifyPlayback } from "@/hooks/useSpotifyPlayback";
import { useSpotifyPlaylists } from "@/hooks/useSpotifyPlaylists";
import { useSpotifyProfile } from "@/hooks/useSpotifyProfile";
import { useTrackRemoval } from "@/hooks/useTrackRemoval";

import type { SpotifyPlaylist, SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getTrackFromPlaylistItem } from "@/lib/ui-helpers";

export default function Page() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;

  const [view, setView] = useState<"ai" | "playlist">("ai");
  const [error, setError] = useState<string | null>(null);

  const { currentlyPlaying, isPlaying, currentlyPlayingError } =
    useCurrentlyPlaying(accessToken);

  const { profile, profileError } = useSpotifyProfile(accessToken);

  const {
    playlists,
    playlistsLoaded,
    hiddenPlaylists,
    playlistsError,
    setPlaylists,
    loadPlaylists,
  } = useSpotifyPlaylists(accessToken);

  const {
    selectedPlaylist,
    setSelectedPlaylist,
    tracks,
    setTracks,
    loadingTracks,
    openPlaylist,
    playlistTracksError,
  } = usePlaylistTracks({
    accessToken,
    onViewChange: setView,
  });

  const {
    playingTrackUri,
    playbackLoading,
    playbackError,
    playTrack,
    playPlaylist,
    addToQueue,
  } = useSpotifyPlayback({
    accessToken,
    selectedPlaylistId: selectedPlaylist?.id,
  });

  const {
    aiAnalysis,
    setAiAnalysis,
    loadingAI,
    generateAiAnalysis,
    aiAnalysisError,
  } = useAiAnalysis();

  const {
    aiPrompt,
    setAiPrompt,
    aiPlaylistName,
    setAiPlaylistName,
    aiPlaylistMode,
    setAiPlaylistMode,
    aiPlaylistTarget,
    setAiPlaylistTarget,
    selectedTargetPlaylistId,
    setSelectedTargetPlaylistId,
    creatingPlaylist,
    createdPlaylistUrl,
    aiPlaylistSuccessMessage,

    previewTracks,
    selectedPreviewTrackUris,
    generatingPreview,
    generateTrackPreview,
    togglePreviewTrack,
    selectAllPreviewTracks,
    clearPreviewSelection,
    clearPreview,

    createAiPlaylist,
    aiPlaylistCreatorError,
  } = useAiPlaylistCreator({
    accessToken,
    playlists,
    selectedPlaylist,
    setPlaylists,
    setSelectedPlaylist,
    loadPlaylists,
    openPlaylist,
  });

  const {
    playlistToRemove,
    removingPlaylist,
    requestRemovePlaylist,
    confirmRemovePlaylist,
    playlistRemovalError,
  } = usePlaylistRemoval({
    accessToken,
    selectedPlaylist,
    setPlaylists,
    setSelectedPlaylist,
    setTracks,
    setAiAnalysis,
    onViewChange: setView,
  });

  const {
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
  } = useTrackRemoval({
    accessToken,
    selectedPlaylist,
    tracks,
    setTracks,
    setPlaylists,
    setSelectedPlaylist,
  });

  useEffect(() => {
    const nextError =
      profileError ||
      playlistsError ||
      playlistTracksError ||
      aiAnalysisError ||
      aiPlaylistCreatorError ||
      playlistRemovalError ||
      trackRemovalError ||
      currentlyPlayingError ||
      playbackError;

    if (nextError) {
      setError(nextError);
    }
  }, [
    profileError,
    playlistsError,
    playlistTracksError,
    aiAnalysisError,
    aiPlaylistCreatorError,
    playlistRemovalError,
    trackRemovalError,
    currentlyPlayingError,
    playbackError,
  ]);

  function handleAiModeClick() {
    setView("ai");
  }

  async function handlePlaylistClick(playlist: SpotifyPlaylist) {
    setError(null);
    setAiAnalysis(null);
    await openPlaylist(playlist);
  }

  async function handlePlaylistPlay(playlist: SpotifyPlaylist) {
    setError(null);
    await playPlaylist(playlist);
  }

  async function handleGenerateAiAnalysis() {
    setError(null);
    await generateAiAnalysis(tracks);
  }

  function handleRequestRemoveTrack(playlistItem: SpotifyPlaylistItem) {
    setError(null);
    requestRemoveTrack(playlistItem);
  }

  function handleRequestRemovePlaylist(playlist: SpotifyPlaylist) {
    setError(null);
    requestRemovePlaylist(playlist);
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] text-white">
        Loading VibeForge...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] text-white">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
          <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-4">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            VibeForge
          </h1>

          <p className="mt-4 max-w-md text-center text-zinc-400">
            Analyze your playlists, discover the mood behind your music, and
            generate insights only when you need them.
          </p>

          <button
            type="button"
            onClick={() => signIn("spotify", { callbackUrl: "/" })}
            className="mt-8 cursor-pointer rounded-full bg-green-500 px-7 py-3 font-semibold text-black shadow-lg shadow-green-500/20 transition hover:bg-green-400"
          >
            Login with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Header
        onAiModeClick={handleAiModeClick}
        currentlyPlaying={currentlyPlaying}
        isPlaying={isPlaying}
      />

      <Sidebar
        playlists={playlists}
        playlistsLoaded={playlistsLoaded}
        hiddenPlaylists={hiddenPlaylists}
        selectedPlaylist={selectedPlaylist}
        onPlaylistClick={handlePlaylistClick}
        onPlaylistRemove={handleRequestRemovePlaylist}
        onPlaylistPlay={handlePlaylistPlay}
      />

      <main className="relative z-10 p-4 sm:p-6 lg:ml-80 lg:pt-20">
        {error && (
          <div className="mb-6 rounded-xl border border-red-900/80 bg-red-950/60 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {view === "ai" && (
          <AiPlaylistCreator
            profile={profile}
            playlists={playlists}
            aiPrompt={aiPrompt}
            aiPlaylistName={aiPlaylistName}
            aiPlaylistMode={aiPlaylistMode}
            aiPlaylistTarget={aiPlaylistTarget}
            selectedTargetPlaylistId={selectedTargetPlaylistId}
            creatingPlaylist={creatingPlaylist}
            createdPlaylistUrl={createdPlaylistUrl}
            successMessage={aiPlaylistSuccessMessage}
            previewTracks={previewTracks}
            selectedPreviewTrackUris={selectedPreviewTrackUris}
            generatingPreview={generatingPreview}
            onPromptChange={setAiPrompt}
            onPlaylistNameChange={setAiPlaylistName}
            onModeChange={setAiPlaylistMode}
            onTargetChange={setAiPlaylistTarget}
            onTargetPlaylistChange={setSelectedTargetPlaylistId}
            onGeneratePreview={generateTrackPreview}
            onTogglePreviewTrack={togglePreviewTrack}
            onSelectAllPreviewTracks={selectAllPreviewTracks}
            onClearPreviewSelection={clearPreviewSelection}
            onClearPreview={clearPreview}
            onCreatePlaylist={createAiPlaylist}
          />
        )}

        {view === "playlist" && selectedPlaylist && (
          <PlaylistView
            selectedPlaylist={selectedPlaylist}
            tracks={tracks}
            loadingTracks={loadingTracks}
            loadingAI={loadingAI}
            aiAnalysis={aiAnalysis}
            selectionMode={selectionMode}
            selectedTrackUris={selectedTrackUris}
            playingTrackUri={playingTrackUri}
            playbackLoading={playbackLoading}
            onToggleSelectionMode={toggleSelectionMode}
            onClearSelection={clearTrackSelection}
            onSelectAllTracks={selectAllTracks}
            onGenerateAiAnalysis={handleGenerateAiAnalysis}
            onRemoveTrack={handleRequestRemoveTrack}
            onPlayTrack={playTrack}
            onAddToQueue={addToQueue}
            onToggleTrackSelection={toggleTrackSelection}
            onRequestRemoveSelectedTracks={requestRemoveSelectedTracks}
          />
        )}
      </main>

      <ConfirmDialog
        open={confirmingBulkRemove}
        title="Remove selected songs?"
        description={`This will remove ${selectedTrackUris.length
          } selected song${selectedTrackUris.length === 1 ? "" : "s"
          } from "${selectedPlaylist?.name ?? "this playlist"}".`}
        confirmLabel="Remove songs"
        cancelLabel="Keep songs"
        loading={removingSelectedTracks}
        onConfirm={confirmRemoveSelectedTracks}
        onCancel={cancelRemoveSelectedTracks}
      />

      <ConfirmDialog
        open={Boolean(trackToRemove)}
        title="Remove song?"
        description={
          trackToRemove
            ? `This will remove "${getTrackFromPlaylistItem(trackToRemove)?.name ?? "this song"
            }" from "${selectedPlaylist?.name ?? "this playlist"}".`
            : ""
        }
        confirmLabel="Remove song"
        cancelLabel="Keep song"
        loading={removingTrack}
        onConfirm={confirmRemoveTrack}
        onCancel={cancelRemoveTrack}
      />

      <ConfirmDialog
        open={Boolean(playlistToRemove)}
        title="Remove playlist?"
        description={
          playlistToRemove
            ? `This will remove "${playlistToRemove.name}" from your Spotify library.`
            : ""
        }
        confirmLabel="Remove playlist"
        cancelLabel="Keep playlist"
        loading={removingPlaylist}
        onConfirm={confirmRemovePlaylist}
        onCancel={confirmRemovePlaylist}
      />
    </AppShell>
  );
}