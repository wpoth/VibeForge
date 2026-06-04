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
import { usePlaylistRemoval } from "@/hooks/usePlaylistRemoval";
import { usePlaylistTracks } from "@/hooks/usePlaylistTracks";
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

  const { profile, profileError } = useSpotifyProfile(accessToken);

  const {
    playlists,
    playlistsLoaded,
    hiddenPlaylists,
    playlistsError,
    setPlaylists,
    setHiddenPlaylists,
    loadPlaylists,
  } = useSpotifyPlaylists(accessToken);

  const {
    selectedPlaylist,
    setSelectedPlaylist,
    tracks,
    setTracks,
    loadingTracks,
    openPlaylist,
    resetPlaylistView,
    playlistTracksError,
  } = usePlaylistTracks({
    accessToken,
    onViewChange: setView,
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
    cancelRemovePlaylist,
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
      trackRemovalError;

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
  ]);

  function handleAiModeClick() {
    setView("ai");
  }

  async function handlePlaylistClick(playlist: SpotifyPlaylist) {
    setError(null);
    setAiAnalysis(null);
    await openPlaylist(playlist);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] text-white">
        Loading VibeForge...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] text-white relative overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
          <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            VibeForge
          </h1>

          <p className="mt-4 max-w-md text-center text-zinc-400">
            Analyze your playlists, discover the mood behind your music, and
            generate insights only when you need them.
          </p>

          <button
            onClick={() => signIn("spotify", { callbackUrl: "/" })}
            className="mt-8 px-7 py-3 bg-green-500 cursor-pointer text-black rounded-full font-semibold hover:bg-green-400 transition shadow-lg shadow-green-500/20"
          >
            Login with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Header onAiModeClick={handleAiModeClick} />

      <Sidebar
        playlists={playlists}
        playlistsLoaded={playlistsLoaded}
        hiddenPlaylists={hiddenPlaylists}
        selectedPlaylist={selectedPlaylist}
        onPlaylistClick={handlePlaylistClick}
        onPlaylistRemove={handleRequestRemovePlaylist}
      />

      <main className="relative z-10 p-4 sm:p-6 lg:ml-80 lg:pt-20">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-900/80 text-sm text-red-200">
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
            onPromptChange={setAiPrompt}
            onPlaylistNameChange={setAiPlaylistName}
            onModeChange={setAiPlaylistMode}
            onTargetChange={setAiPlaylistTarget}
            onTargetPlaylistChange={setSelectedTargetPlaylistId}
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
            onToggleSelectionMode={toggleSelectionMode}
            onClearSelection={clearTrackSelection}
            onSelectAllTracks={selectAllTracks}
            onGenerateAiAnalysis={handleGenerateAiAnalysis}
            onRemoveTrack={handleRequestRemoveTrack}
            onToggleTrackSelection={toggleTrackSelection}
            onRequestRemoveSelectedTracks={requestRemoveSelectedTracks}
          />
        )}
      </main>

      <ConfirmDialog
        open={confirmingBulkRemove}
        title="Remove selected songs?"
        description={`This will remove ${selectedTrackUris.length} selected song${
          selectedTrackUris.length === 1 ? "" : "s"
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
            ? `This will remove "${
                getTrackFromPlaylistItem(trackToRemove)?.name ?? "this song"
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
        onCancel={cancelRemovePlaylist}
      />
    </AppShell>
  );
}