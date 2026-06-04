"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { AiPlaylistCreator } from "@/components/ai/AiPlaylistCreator";
import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { PlaylistView } from "@/components/playlist/PlaylistView";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";

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

  const [aiPlaylistTarget, setAiPlaylistTarget] = useState<"new" | "existing">(
    "new"
  );

  const [selectedTargetPlaylistId, setSelectedTargetPlaylistId] = useState("");
  const [aiPlaylistSuccessMessage, setAiPlaylistSuccessMessage] =
    useState<string | null>(null);

  const [playlistToRemove, setPlaylistToRemove] =
    useState<SpotifyPlaylist | null>(null);
  const [removingPlaylist, setRemovingPlaylist] = useState(false);
  const accessToken = session?.accessToken;

  const [trackToRemove, setTrackToRemove] =
    useState<SpotifyPlaylistItem | null>(null);
  const [removingTrack, setRemovingTrack] = useState(false);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTrackUris, setSelectedTrackUris] = useState<string[]>([]);
  const [removingSelectedTracks, setRemovingSelectedTracks] = useState(false);
  const [confirmingBulkRemove, setConfirmingBulkRemove] = useState(false);

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
    setSelectionMode(false);
    setSelectedTrackUris([]);
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
      setError("Could not select this song because it is missing a Spotify URI.");
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
    setConfirmingBulkRemove(true);
  }
  async function confirmRemoveSelectedTracks() {
    if (!accessToken || !selectedPlaylist || !selectedTrackUris.length) return;

    const urisToRemove = selectedTrackUris;

    setRemovingSelectedTracks(true);
    setError(null);

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

      setPlaylists((currentPlaylists) =>
        currentPlaylists.map((playlist) => {
          if (playlist.id !== selectedPlaylist.id) return playlist;

          const currentTotal =
            playlist.items?.total ?? playlist.tracks?.total ?? tracks.length;

          const nextTotal = Math.max(currentTotal - urisToRemove.length, 0);

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

        const nextTotal = Math.max(currentTotal - urisToRemove.length, 0);

        return {
          ...currentPlaylist,
          items: { total: nextTotal },
          tracks: { total: nextTotal },
        };
      });

      setSelectedTrackUris([]);
      setSelectionMode(false);
      setConfirmingBulkRemove(false);
    } catch (err: unknown) {
      console.error("Remove selected songs failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setRemovingSelectedTracks(false);
    }
  }
  async function createAiPlaylist() {
    if (!accessToken) return;

    if (!aiPrompt.trim()) {
      setError("Type a vibe or artist first.");
      return;
    }
    
    if (aiPlaylistTarget === "existing" && !selectedTargetPlaylistId) {
      setError("Choose a playlist to add songs to.");
      return;
    }
    setCreatingPlaylist(true);
    setCreatedPlaylistUrl(null);
    setAiPlaylistSuccessMessage(null);
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
          action: aiPlaylistTarget === "existing" ? "append" : "create",
          targetPlaylistId:
            aiPlaylistTarget === "existing" ? selectedTargetPlaylistId : undefined,
        }),
      });

      const data = (await res.json()) as AiPlaylistResponse;

      console.log("AI PLAYLIST RESPONSE:", data);

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message || String(data?.error) || "Failed to create playlist"
        );
      }

      if (data.action === "append") {
        const addedCount = data.tracks?.length ?? 0;

        setPlaylists((currentPlaylists) =>
          currentPlaylists.map((playlist) => {
            if (playlist.id !== selectedTargetPlaylistId) return playlist;

            const currentTotal =
              playlist.items?.total ?? playlist.tracks?.total ?? 0;

            const nextTotal = currentTotal + addedCount;

            return {
              ...playlist,
              items: { total: nextTotal },
              tracks: { total: nextTotal },
            };
          })
        );

        setSelectedPlaylist((currentPlaylist) => {
          if (!currentPlaylist || currentPlaylist.id !== selectedTargetPlaylistId) {
            return currentPlaylist;
          }

          const currentTotal =
            currentPlaylist.items?.total ?? currentPlaylist.tracks?.total ?? 0;

          const nextTotal = currentTotal + addedCount;

          return {
            ...currentPlaylist,
            items: { total: nextTotal },
            tracks: { total: nextTotal },
          };
        });

        if (selectedPlaylist?.id === selectedTargetPlaylistId) {
          await openPlaylist(selectedPlaylist);
        }

        setCreatedPlaylistUrl(null);
        setAiPlaylistSuccessMessage(
          `Added ${addedCount} songs to the selected playlist.`
        );

        return;
      }

      setCreatedPlaylistUrl(data.playlist?.url ?? null);
      setAiPlaylistSuccessMessage("Playlist created successfully.");
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
  function requestRemoveTrack(playlistItem: SpotifyPlaylistItem) {
    setTrackToRemove(playlistItem);
  }

  async function confirmRemoveTrack() {
    if (!accessToken || !selectedPlaylist || !trackToRemove) return;

    const track = getTrackFromPlaylistItem(trackToRemove);

    if (!track?.uri) {
      setError("Could not remove song because it is missing a Spotify URI.");
      setTrackToRemove(null);
      return;
    }

    setRemovingTrack(true);
    setError(null);

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

      setPlaylists((currentPlaylists) =>
        currentPlaylists.map((playlist) => {
          if (playlist.id !== selectedPlaylist.id) return playlist;

          const currentTotal =
            playlist.items?.total ?? playlist.tracks?.total ?? tracks.length;

          const nextTotal = Math.max(currentTotal - 1, 0);

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

        const nextTotal = Math.max(currentTotal - 1, 0);

        return {
          ...currentPlaylist,
          items: { total: nextTotal },
          tracks: { total: nextTotal },
        };
      });

      setTrackToRemove(null);
    } catch (err: unknown) {
      console.error("Remove song failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setRemovingTrack(false);
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
            onGenerateAiAnalysis={() => generateAiAnalysis(tracks)}
            onRemoveTrack={requestRemoveTrack}
            onToggleTrackSelection={toggleTrackSelection}
            onRequestRemoveSelectedTracks={requestRemoveSelectedTracks}
          />
        )}
      </main>
      <ConfirmDialog
        open={confirmingBulkRemove}
        title="Remove selected songs?"
        description={`This will remove ${selectedTrackUris.length} selected song${selectedTrackUris.length === 1 ? "" : "s"
          } from "${selectedPlaylist?.name ?? "this playlist"}".`}
        confirmLabel="Remove songs"
        cancelLabel="Keep songs"
        loading={removingSelectedTracks}
        onConfirm={confirmRemoveSelectedTracks}
        onCancel={() => {
          if (!removingSelectedTracks) {
            setConfirmingBulkRemove(false);
          }
        }}
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
        onCancel={() => {
          if (!removingTrack) {
            setTrackToRemove(null);
          }
        }}
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
        onCancel={() => {
          if (!removingPlaylist) {
            setPlaylistToRemove(null);
          }
        }}
      />
    </AppShell>
  );
}