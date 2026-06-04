"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { AiPlaylistCreator } from "@/components/ai/AiPlaylistCreator";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PlaylistView } from "@/components/playlist/PlaylistView";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import type {
  AiPlaylistResponse,
  ApiErrorResponse,
  PlaylistTracksResponse,
  PlaylistsResponse,
  SpotifyPlaylist,
  SpotifyPlaylistItem,
  SpotifyProfile,
  SpotifyTrack,
} from "@/lib/spotify-types";

import {
  getErrorMessage,
  getTrackFromPlaylistItem,
} from "@/lib/ui-helpers";

export default function Page() {
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false);
  const [hiddenPlaylists, setHiddenPlaylists] = useState(0);

  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyPlaylist | null>(null);

  const [tracks, setTracks] = useState<SpotifyPlaylistItem[]>([]);
  const [view, setView] = useState<"ai" | "playlist">("ai");

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPlaylistName, setAiPlaylistName] = useState("");
  const [aiPlaylistMode, setAiPlaylistMode] = useState<"vibe" | "artist">(
    "vibe"
  );
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [createdPlaylistUrl, setCreatedPlaylistUrl] = useState<string | null>(
    null
  );

  const [playlistToRemove, setPlaylistToRemove] =
    useState<SpotifyPlaylist | null>(null);
  const [removingPlaylist, setRemovingPlaylist] = useState(false);
  const accessToken = session?.accessToken;

  useEffect(() => {
    if (!accessToken) return;

    fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    })
      .then((r) => r.json())
      .then((data: SpotifyProfile & ApiErrorResponse) => {
        if (data?.error) {
          throw new Error(data?.message || "Failed to load profile");
        }

        setProfile(data);
      })
      .catch((err: unknown) => {
        console.error(err);
        setError(getErrorMessage(err));
      });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    loadPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function loadPlaylists() {
    if (!accessToken) return;

    setPlaylistsLoaded(false);
    setError(null);

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err));
      setPlaylists([]);
      setHiddenPlaylists(0);
    } finally {
      setPlaylistsLoaded(true);
    }
  }

  async function generateAiAnalysis(playlistItems: SpotifyPlaylistItem[]) {
    const simplified = playlistItems
      .map(getTrackFromPlaylistItem)
      .filter((track): track is SpotifyTrack => Boolean(track?.name))
      .map((track) => ({
        name: track.name,
        artists:
          track.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
      }));

    if (!simplified.length) return;

    setLoadingAI(true);
    setError(null);

    try {
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist: simplified }),
      });

      const aiData = (await aiRes.json()) as ApiErrorResponse & {
        result?: string;
      };

      if (!aiRes.ok || aiData?.error) {
        throw new Error(
          aiData?.message || String(aiData?.error) || "AI analysis failed"
        );
      }

      setAiAnalysis(aiData?.result ?? null);
    } catch (err: unknown) {
      console.error("AI failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingAI(false);
    }
  }

  async function openPlaylist(playlist: SpotifyPlaylist) {
    if (!accessToken) return;

    setView("playlist");
    setSelectedPlaylist(playlist);
    setTracks([]);
    setAiAnalysis(null);
    setLoadingAI(false);
    setLoadingTracks(true);
    setError(null);

    try {
      const tracksRes = await fetch("/api/playlist-tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId: playlist.id,
          accessToken,
        }),
      });

      const tracksData = (await tracksRes.json()) as PlaylistTracksResponse;

      if (!tracksRes.ok || tracksData?.error) {
        throw new Error(
          tracksData?.message ||
          "Could not load playlist tracks. Spotify may not expose items for this playlist."
        );
      }

      setTracks(tracksData.items ?? []);
    } catch (err: unknown) {
      console.error("Failed to open playlist:", err);
      setError(getErrorMessage(err));
      setTracks([]);
    } finally {
      setLoadingTracks(false);
    }
  }

  function requestRemovePlaylist(playlist: SpotifyPlaylist) {
    setPlaylistToRemove(playlist);
  }

  async function confirmRemovePlaylist() {
    if (!accessToken || !playlistToRemove) return;

    const playlist = playlistToRemove;

    setRemovingPlaylist(true);
    setError(null);

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
        setView("ai");
      }

      setPlaylistToRemove(null);
    } catch (err: unknown) {
      console.error("Remove playlist failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setRemovingPlaylist(false);
    }
  }
  async function createAiPlaylist() {
    if (!accessToken) return;

    if (!aiPrompt.trim()) {
      setError("Type a vibe or artist first.");
      return;
    }

    setCreatingPlaylist(true);
    setCreatedPlaylistUrl(null);
    setError(null);

    try {
      const res = await fetch("/api/ai-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          prompt: aiPrompt,
          mode: aiPlaylistMode,
          playlistName: aiPlaylistName,
          isPublic: false,
        }),
      });

      const data = (await res.json()) as AiPlaylistResponse;

      console.log("AI PLAYLIST RESPONSE:", data);

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message || String(data?.error) || "Failed to create playlist"
        );
      }

      setCreatedPlaylistUrl(data.playlist?.url ?? null);

      const createdPlaylist = data.playlist;

      if (createdPlaylist?.id) {
        const playlistId = createdPlaylist.id;
        const playlistName = createdPlaylist.name ?? "Generated Playlist";

        const total =
          createdPlaylist.items?.total ??
          createdPlaylist.tracks?.total ??
          data.tracks?.length ??
          0;

        const newPlaylist: SpotifyPlaylist = {
          id: playlistId,
          name: playlistName,
          items: { total },
          tracks: { total },
          images: createdPlaylist.images ?? [],
        };

        setPlaylists((currentPlaylists) => {
          const alreadyExists = currentPlaylists.some(
            (playlist) => playlist.id === playlistId
          );

          if (alreadyExists) return currentPlaylists;

          return [newPlaylist, ...currentPlaylists];
        });
      }

      await loadPlaylists();
    } catch (err: unknown) {
      console.error("Create AI playlist failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setCreatingPlaylist(false);
    }
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
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">VibeForge</h1>
          <p className="mt-4 max-w-md text-center text-zinc-400">
            Analyze your playlists, discover the mood behind your music, and
            generate insights only when you need them.
          </p>

          <button
            onClick={() => signIn("spotify", { callbackUrl: "/" })}
            className="mt-8 px-7 py-3 bg-green-500 text-black rounded-full font-semibold hover:bg-green-400 transition shadow-lg shadow-green-500/20"
          >
            Login with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Header onAiModeClick={() => setView("ai")} />

      <Sidebar
        playlists={playlists}
        playlistsLoaded={playlistsLoaded}
        hiddenPlaylists={hiddenPlaylists}
        selectedPlaylist={selectedPlaylist}
        onPlaylistClick={openPlaylist}
        onPlaylistRemove={requestRemovePlaylist}
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
            aiPrompt={aiPrompt}
            aiPlaylistName={aiPlaylistName}
            aiPlaylistMode={aiPlaylistMode}
            creatingPlaylist={creatingPlaylist}
            createdPlaylistUrl={createdPlaylistUrl}
            onPromptChange={setAiPrompt}
            onPlaylistNameChange={setAiPlaylistName}
            onModeChange={setAiPlaylistMode}
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
            onGenerateAiAnalysis={() => generateAiAnalysis(tracks)}
          />
        )}
      </main>
      <ConfirmDialog
        open={Boolean(playlistToRemove)}
        title="Remove playlist?"
        description={
          playlistToRemove
            ? `This will remove "${playlistToRemove.name}" from your Spotify library. Spotify does not permanently delete playlists through the Web API.`
            : ""
        }
        confirmLabel="Remove playlist"
        cancelLabel="Keep playlist"
        loading={removingPlaylist}
        onConfirm={confirmRemovePlaylist}
        onCancel={() => {
          if (!removingPlaylist) {
            setPlaylistToRemove(null);
          }
        }}
      />
    </AppShell>
  );
}