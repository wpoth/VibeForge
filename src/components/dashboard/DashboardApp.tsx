"use client";

import { usePathname, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { SongResearchDrawer } from "@/components/ai/SongResearchDrawer";
import { useSongResearch } from "@/hooks/useSongResearch";
import { AiPlaylistCreator } from "@/components/ai/AiPlaylistCreator";
import { SimilarTracksDrawer } from "@/components/ai/SimilarTracksDrawer";
import { LandingPage } from "@/components/dashboard/LandingPage";
import { RecentlyPlayedDashboard } from "@/components/dashboard/RecentlyPlayedDashboard";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toast } from "@/components/common/ToastProvider";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

import { PlaylistView } from "@/components/playlist/PlaylistView";

import { useAiAnalysis } from "@/hooks/useAiAnalysis";
import { useAiPlaylistCreator } from "@/hooks/useAiPlaylistCreator";
import { useCurrentlyPlaying } from "@/hooks/useCurrentlyPlaying";
import { usePlaylistRemoval } from "@/hooks/usePlaylistRemoval";
import { usePlaylistTracks } from "@/hooks/usePlaylistTracks";
import {
    useRecentlyPlayed,
    type RecentlyPlayedTrack,
} from "@/hooks/useRecentlyPlayed";
import { useSpotifyPlayback } from "@/hooks/useSpotifyPlayback";
import { useSpotifyPlaylists } from "@/hooks/useSpotifyPlaylists";
import { useSpotifyProfile } from "@/hooks/useSpotifyProfile";
import { useTrackRemoval } from "@/hooks/useTrackRemoval";
import { useSimilarTracks, type SimilarTrack } from "@/hooks/useSimilarTracks";

import { usePlaylistCoverUpload } from "@/hooks/usePlaylistCoverUpload";
import { PlaylistCoverCropDialog } from "@/components/playlist/PlaylistCoverCropDialog";
import type { PreparedSpotifyCoverImage } from "@/lib/spotify-cover-image";

import type { SpotifyPlaylist, SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getErrorMessage, getTrackFromPlaylistItem } from "@/lib/ui-helpers";
import { AddToPlaylistDialog } from "@/components/playlist/AddToPlaylistDialog";
type DashboardLandingView = "home" | "recently-played" | "ai-playlist";

type DashboardAppProps = {
    initialLandingView?: DashboardLandingView;
    initialPlaylistId?: string;
};

export function DashboardApp({
    initialLandingView = "home",
    initialPlaylistId,
}: DashboardAppProps) {
    const router = useRouter();
    const pathname = usePathname();

    const { data: session, status } = useSession();
    const accessToken = session?.accessToken;

    const [view, setView] = useState<"ai" | "playlist">("ai");
    const [error, setError] = useState<string | null>(null);
    const [recentTrackActionLoadingUri, setRecentTrackActionLoadingUri] =
        useState<string | null>(null);
    const [coverEditorPlaylist, setCoverEditorPlaylist] =
        useState<SpotifyPlaylist | null>(null);
    const [coverEditorFile, setCoverEditorFile] = useState<File | null>(null);
    const [playlistRouteMissing, setPlaylistRouteMissing] = useState(false);

    const [addToPlaylistTrack, setAddToPlaylistTrack] =
        useState<SpotifyPlaylistItem | null>(null);
    const [addingToPlaylistId, setAddingToPlaylistId] = useState<string | null>(
        null,
    );
    const lastAiSuccessMessageRef = useRef<string | null>(null);

    const {
        researchOpen,
        researchLoading,
        researchError,
        research,
        researchTrack,
        researchSong,
        closeResearch,
    } = useSongResearch();

    const {
        similarOpen,
        similarLoading,
        similarError,
        similarTracks,
        similarSourceTrack,
        findSimilarTracks,
        closeSimilarTracks,
    } = useSimilarTracks({
        accessToken,
    });

    const {
        currentlyPlaying,
        isPlaying,
        currentlyPlayingError,
        refreshCurrentlyPlaying,
    } = useCurrentlyPlaying(accessToken);

    const {
        recentlyPlayed,
        recentlyPlayedStats,
        recentlyPlayedLoaded,
        recentlyPlayedLoading,
        recentlyPlayedError,
        loadRecentlyPlayed,
    } = useRecentlyPlayed(accessToken);

    const hasRecentlyPlayedScope = Boolean(
        session?.scope?.split(" ").includes("user-read-recently-played"),
    );

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
        loadingMoreTracks,
        hasMoreTracks,
        totalTrackCount,
        openPlaylist,
        loadMoreTracks,
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

    useEffect(() => {
        if (!initialPlaylistId) {
            setPlaylistRouteMissing(false);
            return;
        }

        if (!playlistsLoaded) return;

        // On route changes, DashboardApp can mount before playlists are available.
        // Avoid showing a false "not found" error while the list is still empty.
        if (playlists.length === 0) return;

        if (selectedPlaylist?.id === initialPlaylistId) {
            setError(null);
            setPlaylistRouteMissing(false);
            return;
        }

        const playlist = playlists.find((item) => item.id === initialPlaylistId);

        if (!playlist) {
            setPlaylistRouteMissing(true);
            setError("Playlist not found or not available in VibeForge.");
            return;
        }

        setError(null);
        setPlaylistRouteMissing(false);
        setAiAnalysis(null);

        void openPlaylist(playlist);
    }, [
        initialPlaylistId,
        playlistsLoaded,
        playlists,
        selectedPlaylist?.id,
        openPlaylist,
        setAiAnalysis,
    ]);

    const {
        playlistCoverUploadingId,
        playlistCoverUploadError,
        uploadPlaylistCover,
    } = usePlaylistCoverUpload({
        accessToken,
        selectedPlaylist,
        setSelectedPlaylist,
        setPlaylists,
        loadPlaylists,
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
        selectedPlaylist,
        tracks,
    });

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
            playlistCoverUploadError ||
            aiAnalysisError ||
            aiPlaylistCreatorError ||
            playlistRemovalError ||
            trackRemovalError ||
            currentlyPlayingError ||
            playbackError ||
            recentlyPlayedError;

        if (nextError) {
            setError(nextError);
        }
    }, [
        profileError,
        playlistsError,
        playlistTracksError,
        playlistCoverUploadError,
        aiAnalysisError,
        aiPlaylistCreatorError,
        playlistRemovalError,
        trackRemovalError,
        currentlyPlayingError,
        playbackError,
        recentlyPlayedError,
    ]);

    useEffect(() => {
        if (
            aiPlaylistSuccessMessage &&
            aiPlaylistSuccessMessage !== lastAiSuccessMessageRef.current
        ) {
            lastAiSuccessMessageRef.current = aiPlaylistSuccessMessage;

            toast({
                type: "success",
                title: "Playlist updated",
                description: aiPlaylistSuccessMessage,
            });
        }
    }, [aiPlaylistSuccessMessage]);

    function requestAddTrackToPlaylist(playlistItem: SpotifyPlaylistItem) {
        setAddToPlaylistTrack(playlistItem);
    }

    function handleAiModeClick() {
        setView("ai");

        if (pathname !== "/dashboard") {
            router.push("/dashboard");
        }
    }

    async function handleAddTrackToPlaylist(
        playlist: SpotifyPlaylist,
        playlistItem: SpotifyPlaylistItem,
    ) {
        setError(null);

        if (!accessToken) {
            toast({
                type: "error",
                title: "Could not add song",
                description: "Missing access token.",
            });
            return;
        }

        const track = getTrackFromPlaylistItem(playlistItem);
        const trackUri = track?.uri;

        if (!trackUri) {
            toast({
                type: "error",
                title: "Could not add song",
                description: "This song is missing a Spotify URI.",
            });
            return;
        }

        setAddingToPlaylistId(playlist.id);

        try {
            const res = await fetch("/api/add-track-to-playlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                    playlistId: playlist.id,
                    trackUri,
                }),
            });

            const data = await res.json();

            if (!res.ok || data?.error) {
                throw new Error(
                    data?.message ||
                    String(data?.error) ||
                    "Failed to add song to playlist",
                );
            }

            toast({
                type: "success",
                title: "Added to playlist",
                description: `${track.name ?? "Song"} was added to ${playlist.name}.`,
            });

            setAddToPlaylistTrack(null);
            await loadPlaylists();
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not add song",
                description: getErrorMessage(error),
            });
        } finally {
            setAddingToPlaylistId(null);
        }
    }

    async function handleResearchTrack(playlistItem: SpotifyPlaylistItem) {
        setError(null);
        await researchSong(playlistItem);
    }

    async function handleFindSimilarTracks(playlistItem: SpotifyPlaylistItem) {
        setError(null);
        await findSimilarTracks(playlistItem);
    }

    function handlePlaylistCoverFileSelect(
        playlist: SpotifyPlaylist,
        file: File,
    ) {
        setError(null);
        setCoverEditorPlaylist(playlist);
        setCoverEditorFile(file);
    }

    function closePlaylistCoverEditor() {
        if (playlistCoverUploadingId) return;

        setCoverEditorPlaylist(null);
        setCoverEditorFile(null);
    }

    async function handleConfirmPlaylistCoverUpload(
        preparedImage: PreparedSpotifyCoverImage,
    ) {
        if (!coverEditorPlaylist) return;

        setError(null);

        try {
            await uploadPlaylistCover({
                playlist: coverEditorPlaylist,
                preparedImage,
            });

            toast({
                type: "success",
                title: "Cover updated",
                description: `${coverEditorPlaylist.name} has a new cover image.`,
            });

            closePlaylistCoverEditor();
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not update cover",
                description: getErrorMessage(error),
            });
        }
    }

    async function handleAddSimilarTrackToQueue(track: SimilarTrack) {
        setError(null);

        if (!accessToken) {
            toast({
                type: "error",
                title: "Could not add to queue",
                description: "Missing access token.",
            });
            return;
        }

        if (!track.uri) {
            toast({
                type: "error",
                title: "Could not add to queue",
                description: "This track is missing a Spotify URI.",
            });
            return;
        }

        try {
            const res = await fetch("/api/add-to-queue", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                    trackUri: track.uri,
                }),
            });

            const data = await res.json();

            if (!res.ok || data?.error) {
                throw new Error(
                    data?.message || String(data?.error) || "Failed to add song to queue",
                );
            }

            toast({
                type: "success",
                title: "Added to queue",
                description: track.name ?? "Track added to queue.",
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not add to queue",
                description: getErrorMessage(error),
            });
        }
    }

    async function handlePlayRecentlyPlayedTrack(track: RecentlyPlayedTrack) {
        setError(null);

        if (!accessToken) {
            toast({
                type: "error",
                title: "Could not play song",
                description: "Missing access token.",
            });
            return;
        }

        if (!track.uri) {
            toast({
                type: "error",
                title: "Could not play song",
                description: "This track is missing a Spotify URI.",
            });
            return;
        }

        setRecentTrackActionLoadingUri(track.uri);

        try {
            const res = await fetch("/api/play-track-uri", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                    trackUri: track.uri,
                }),
            });

            const data = await res.json();

            if (!res.ok || data?.error) {
                throw new Error(
                    data?.message || String(data?.error) || "Failed to play song",
                );
            }

            await refreshCurrentlyPlaying();

            toast({
                type: "success",
                title: "Playing track",
                description: track.title,
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not play song",
                description: getErrorMessage(error),
            });
        } finally {
            setRecentTrackActionLoadingUri(null);
        }
    }

    async function handleAddRecentlyPlayedTrackToQueue(
        track: RecentlyPlayedTrack,
    ) {
        setError(null);

        if (!accessToken) {
            toast({
                type: "error",
                title: "Could not add to queue",
                description: "Missing access token.",
            });
            return;
        }

        if (!track.uri) {
            toast({
                type: "error",
                title: "Could not add to queue",
                description: "This track is missing a Spotify URI.",
            });
            return;
        }

        setRecentTrackActionLoadingUri(track.uri);

        try {
            const res = await fetch("/api/add-to-queue", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                    trackUri: track.uri,
                }),
            });

            const data = await res.json();

            if (!res.ok || data?.error) {
                throw new Error(
                    data?.message || String(data?.error) || "Failed to add song to queue",
                );
            }

            toast({
                type: "success",
                title: "Added to queue",
                description: track.title,
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not add to queue",
                description: getErrorMessage(error),
            });
        } finally {
            setRecentTrackActionLoadingUri(null);
        }
    }

    async function handlePlaylistClick(playlist: SpotifyPlaylist) {
        setError(null);
        setAiAnalysis(null);
        setPlaylistRouteMissing(false);

        const playlistPath = `/dashboard/playlist/${encodeURIComponent(
            playlist.id,
        )}`;

        if (pathname !== playlistPath) {
            window.history.pushState(null, "", playlistPath);
        }

        await openPlaylist(playlist);
    }

    async function handlePlaylistPlay(playlist: SpotifyPlaylist) {
        setError(null);

        try {
            await playPlaylist(playlist);
            await refreshCurrentlyPlaying();

            toast({
                type: "success",
                title: "Playing playlist",
                description: playlist.name,
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not play playlist",
                description: getErrorMessage(error),
            });
        }
    }

    async function handlePlayTrack(playlistItem: SpotifyPlaylistItem) {
        setError(null);

        const track = getTrackFromPlaylistItem(playlistItem);

        try {
            await playTrack(playlistItem);
            await refreshCurrentlyPlaying();

            toast({
                type: "success",
                title: "Playing from here",
                description: track?.name ?? "Track started.",
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not play song",
                description: getErrorMessage(error),
            });
        }
    }

    async function handleAddToQueue(playlistItem: SpotifyPlaylistItem) {
        setError(null);

        const track = getTrackFromPlaylistItem(playlistItem);

        try {
            await addToQueue(playlistItem);

            toast({
                type: "success",
                title: "Added to queue",
                description: track?.name ?? "Track added to queue.",
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not add to queue",
                description: getErrorMessage(error),
            });
        }
    }

    async function handleGenerateAiAnalysis() {
        setError(null);

        try {
            await generateAiAnalysis(tracks);

            toast({
                type: "success",
                title: "AI analysis generated",
                description: "Playlist insights are ready.",
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not generate analysis",
                description: getErrorMessage(error),
            });
        }
    }

    async function handleCreateAiPlaylist() {
        setError(null);

        try {
            await createAiPlaylist();
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not update playlist",
                description: getErrorMessage(error),
            });
        }
    }

    function handleRequestRemoveTrack(playlistItem: SpotifyPlaylistItem) {
        setError(null);
        requestRemoveTrack(playlistItem);
    }

    function handleRequestRemovePlaylist(playlist: SpotifyPlaylist) {
        setError(null);
        requestRemovePlaylist(playlist);
    }

    async function handleConfirmRemoveTrack() {
        const trackName = trackToRemove
            ? getTrackFromPlaylistItem(trackToRemove)?.name
            : null;

        try {
            await confirmRemoveTrack();

            toast({
                type: "success",
                title: "Song removed",
                description: trackName
                    ? `${trackName} was removed from the playlist.`
                    : "The song was removed from the playlist.",
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not remove song",
                description: getErrorMessage(error),
            });
        }
    }

    async function handleConfirmRemoveSelectedTracks() {
        const count = selectedTrackUris.length;

        try {
            await confirmRemoveSelectedTracks();

            toast({
                type: "success",
                title: "Songs removed",
                description: `${count} song${count === 1 ? "" : "s"
                    } removed from the playlist.`,
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not remove selected songs",
                description: getErrorMessage(error),
            });
        }
    }

    async function handleConfirmRemovePlaylist() {
        const playlistName = playlistToRemove?.name;

        try {
            await confirmRemovePlaylist();

            toast({
                type: "success",
                title: "Playlist removed",
                description: playlistName
                    ? `${playlistName} was removed from your library.`
                    : "Playlist removed from your library.",
            });
        } catch (error: unknown) {
            toast({
                type: "error",
                title: "Could not remove playlist",
                description: getErrorMessage(error),
            });
        }
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
            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] px-4 text-white">
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
                    <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
                </div>

                <div className="relative z-10 flex max-w-md flex-col items-center text-center">
                    <h1 className="text-4xl font-black tracking-tight">VibeForge</h1>

                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                        You need to connect Spotify before opening the dashboard.
                    </p>

                    <button
                        type="button"
                        onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
                        className="mt-8 cursor-pointer rounded-full bg-green-500 px-7 py-3 font-semibold text-black shadow-lg shadow-green-500/20 transition hover:bg-green-400"
                    >
                        Login with Spotify
                    </button>
                </div>
            </div>
        );
    }

    const openingPlaylistRoute = Boolean(
        initialPlaylistId &&
        !playlistRouteMissing &&
        (selectedPlaylist?.id !== initialPlaylistId || loadingTracks),
    );

    return (
        <AppShell>
            <Header
                accessToken={accessToken}
                onAiModeClick={handleAiModeClick}
                currentlyPlaying={currentlyPlaying}
                isPlaying={isPlaying}
                onRefreshPlayback={refreshCurrentlyPlaying}
            />

            <Sidebar
                playlists={playlists}
                playlistsLoaded={playlistsLoaded}
                hiddenPlaylists={hiddenPlaylists}
                selectedPlaylist={selectedPlaylist}
                playlistCoverUploadingId={playlistCoverUploadingId}
                onPlaylistClick={handlePlaylistClick}
                onPlaylistRemove={handleRequestRemovePlaylist}
                onPlaylistPlay={handlePlaylistPlay}
                onPlaylistCoverChange={handlePlaylistCoverFileSelect}
            />

            <main className="relative z-10 p-4 sm:p-6 lg:ml-80 lg:pt-20">
                {error && !openingPlaylistRoute && (
                    <div className="mb-6 rounded-xl border border-red-900/80 bg-red-950/60 p-4 text-sm text-red-200">
                        {error}
                    </div>
                )}

                {openingPlaylistRoute && (
                    <div className="flex min-h-[60vh] items-center justify-center">
                        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl shadow-black/20">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-400/10 text-green-300">
                                <Loader2 size={24} className="animate-spin" />
                            </div>

                            <h2 className="mt-5 text-2xl font-black tracking-tight text-white">
                                Opening playlist
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-zinc-500">
                                Loading your Spotify playlist from the URL.
                            </p>
                        </div>
                    </div>
                )}

                {!openingPlaylistRoute && view === "ai" && (
                    <LandingPage
                        initialView={initialLandingView}
                        currentlyPlaying={currentlyPlaying}
                        isPlaying={isPlaying}
                        recentlyPlayedCount={recentlyPlayedStats.total}
                        recentlyPlayedPanel={
                            <RecentlyPlayedDashboard
                                tracks={recentlyPlayed}
                                stats={recentlyPlayedStats}
                                loading={recentlyPlayedLoading}
                                loaded={recentlyPlayedLoaded}
                                hasRecentlyPlayedScope={hasRecentlyPlayedScope}
                                actionLoadingUri={recentTrackActionLoadingUri}
                                onRefresh={loadRecentlyPlayed}
                                onPlayTrack={handlePlayRecentlyPlayedTrack}
                                onAddToQueue={handleAddRecentlyPlayedTrackToQueue}
                            />
                        }
                        aiPlaylistPanel={
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
                                onCreatePlaylist={handleCreateAiPlaylist}
                            />
                        }
                    />
                )}

                {!openingPlaylistRoute && view === "playlist" && selectedPlaylist && (
                    <PlaylistView
                        selectedPlaylist={selectedPlaylist}
                        tracks={tracks}
                        loadingTracks={loadingTracks}
                        loadingMoreTracks={loadingMoreTracks}
                        hasMoreTracks={hasMoreTracks}
                        totalTrackCount={totalTrackCount}
                        loadingAI={loadingAI}
                        aiAnalysis={aiAnalysis}
                        selectionMode={selectionMode}
                        selectedTrackUris={selectedTrackUris}
                        playingTrackUri={currentlyPlaying?.uri ?? playingTrackUri}
                        playbackLoading={playbackLoading}
                        playlistCoverUploading={
                            playlistCoverUploadingId === selectedPlaylist.id
                        }
                        playlists={playlists}
                        onAddToPlaylist={requestAddTrackToPlaylist}
                        onToggleSelectionMode={toggleSelectionMode}
                        onClearSelection={clearTrackSelection}
                        onSelectAllTracks={selectAllTracks}
                        onGenerateAiAnalysis={handleGenerateAiAnalysis}
                        onRemoveTrack={handleRequestRemoveTrack}
                        onPlayTrack={handlePlayTrack}
                        onAddToQueue={handleAddToQueue}
                        onResearchTrack={handleResearchTrack}
                        onFindSimilarTracks={handleFindSimilarTracks}
                        onToggleTrackSelection={toggleTrackSelection}
                        onRequestRemoveSelectedTracks={requestRemoveSelectedTracks}
                        onLoadMoreTracks={loadMoreTracks}
                        onPlaylistCoverChange={handlePlaylistCoverFileSelect}
                    />
                )}
            </main>

            <AddToPlaylistDialog
                open={Boolean(addToPlaylistTrack)}
                playlistItem={addToPlaylistTrack}
                playlists={playlists}
                loadingPlaylistId={addingToPlaylistId}
                onAddToPlaylist={handleAddTrackToPlaylist}
                onClose={() => {
                    if (addingToPlaylistId) return;
                    setAddToPlaylistTrack(null);
                }}
            />

            <SongResearchDrawer
                open={researchOpen}
                loading={researchLoading}
                error={researchError}
                track={researchTrack}
                research={research}
                onClose={closeResearch}
            />

            <SimilarTracksDrawer
                open={similarOpen}
                loading={similarLoading}
                error={similarError}
                sourceTrack={similarSourceTrack}
                tracks={similarTracks}
                onClose={closeSimilarTracks}
                onAddToQueue={handleAddSimilarTrackToQueue}
            />

            <PlaylistCoverCropDialog
                open={Boolean(coverEditorPlaylist && coverEditorFile)}
                playlistName={coverEditorPlaylist?.name ?? "playlist"}
                file={coverEditorFile}
                uploading={Boolean(
                    coverEditorPlaylist &&
                    playlistCoverUploadingId === coverEditorPlaylist.id,
                )}
                onClose={closePlaylistCoverEditor}
                onConfirm={handleConfirmPlaylistCoverUpload}
            />

            <ConfirmDialog
                open={confirmingBulkRemove}
                title="Remove selected songs?"
                description={`This will remove ${selectedTrackUris.length} selected song${selectedTrackUris.length === 1 ? "" : "s"
                    } from "${selectedPlaylist?.name ?? "this playlist"}".`}
                confirmLabel="Remove songs"
                cancelLabel="Keep songs"
                loading={removingSelectedTracks}
                onConfirm={handleConfirmRemoveSelectedTracks}
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
                onConfirm={handleConfirmRemoveTrack}
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
                onConfirm={handleConfirmRemovePlaylist}
                onCancel={cancelRemovePlaylist}
            />
        </AppShell>
    );
}