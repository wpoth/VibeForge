"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type SpotifyArtist = {
  name?: string;
};

type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

type SpotifyAlbum = {
  name?: string;
  images?: SpotifyImage[];
};

type SpotifyTrack = {
  id?: string;
  name?: string;
  type?: string;
  artists?: SpotifyArtist[];
  album?: SpotifyAlbum;
};

type SpotifyPlaylistItem = {
  item?: SpotifyTrack | null;
  track?: SpotifyTrack | null;
};

type SpotifyPlaylist = {
  id: string;
  name: string;
  images?: SpotifyImage[];
  items?: {
    total?: number;
  };
  tracks?: {
    total?: number;
  };
};

type SpotifyProfile = {
  display_name?: string;
};

type ApiErrorResponse = {
  error?: boolean | string;
  message?: string;
};

type PlaylistsResponse = ApiErrorResponse & {
  items?: SpotifyPlaylist[];
  total?: number;
  hidden?: number;
};

type PlaylistTracksResponse = ApiErrorResponse & {
  items?: SpotifyPlaylistItem[];
};

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unknown error";
}

function getTrackFromPlaylistItem(
  item: SpotifyPlaylistItem
): SpotifyTrack | null {
  return item.item ?? item.track ?? null;
}

function getBestImage(images?: SpotifyImage[]) {
  return images?.[0]?.url ?? null;
}

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

  const accessToken = session?.accessToken;

  console.log("SESSION SCOPE DEBUG:", {
    hasAccessToken: Boolean(accessToken),
    scope: session?.scope,
    error: session?.error,
  });

  async function testCreatePlaylist() {
    if (!accessToken) {
      console.error("No access token");
      return;
    }

    try {
      const res = await fetch("/api/test-create-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();

      console.log("TEST CREATE PLAYLIST RESPONSE:", {
        status: res.status,
        ok: res.ok,
        data,
      });
    } catch (err) {
      console.error("TEST CREATE PLAYLIST FAILED:", err);
    }
  }

  // LOAD PROFILE
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

  // LOAD PLAYLISTS
  useEffect(() => {
    if (!accessToken) return;

    setPlaylistsLoaded(false);
    setError(null);

    fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    })
      .then(async (r) => {
        const data = (await r.json()) as PlaylistsResponse;

        if (!r.ok || data?.error) {
          console.error("PLAYLISTS ERROR RESPONSE:", data);

          throw new Error(
            data?.message ||
            String(data?.error) ||
            `Failed to load playlists: ${r.status}`
          );
        }

        return data;
      })
      .then((data) => {
        console.log("PLAYLISTS RESPONSE:", data);

        setPlaylists(data.items ?? []);
        setHiddenPlaylists(data.hidden ?? 0);
      })
      .catch((err: unknown) => {
        console.error(err);
        setError(getErrorMessage(err));
        setPlaylists([]);
        setHiddenPlaylists(0);
      })
      .finally(() => {
        setPlaylistsLoaded(true);
      });
  }, [accessToken]);

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

      const data = await res.json();

      console.log("AI PLAYLIST RESPONSE:", data);

      if (!res.ok || data?.error) {
        throw new Error(
          data?.step
            ? `${data.step}: ${data.message}`
            : data?.message || String(data?.error) || "Failed to create playlist"
        );
      }

      setCreatedPlaylistUrl(data.playlist?.url ?? null);

      // Refresh sidebar playlists after creation
      const playlistsRes = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const playlistsData = (await playlistsRes.json()) as PlaylistsResponse;

      if (playlistsRes.ok && !playlistsData?.error) {
        setPlaylists(playlistsData.items ?? []);
        setHiddenPlaylists(playlistsData.hidden ?? 0);
      }
    } catch (err: unknown) {
      console.error("Create AI playlist failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setCreatingPlaylist(false);
    }
  }

  async function openPlaylist(pl: SpotifyPlaylist) {
    if (!accessToken) return;

    setView("playlist");
    setSelectedPlaylist(pl);
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
          playlistId: pl.id,
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

      const playlistItems = tracksData.items ?? [];
      setTracks(playlistItems);
    } catch (err: unknown) {
      console.error("Failed to open playlist:", err);
      setError(getErrorMessage(err));
      setTracks([]);
    } finally {
      setLoadingTracks(false);
    }
  }

  // LOADING STATE
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] text-white">
        Loading VibeForge...
      </div>
    );
  }

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] text-white relative overflow-hidden">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
          <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-6xl font-bold tracking-tight">VibeForge</h1>
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

  // MAIN UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] text-white">
      <style jsx global>{`
        .custom-sidebar-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 197, 94, 0.55) rgba(255, 255, 255, 0.05);
        }

        .custom-sidebar-scrollbar::-webkit-scrollbar {
          width: 10px;
        }

        .custom-sidebar-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 999px;
        }

        .custom-sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            180deg,
            rgba(34, 197, 94, 0.85),
            rgba(168, 85, 247, 0.55)
          );
          border-radius: 999px;
          border: 2px solid rgba(15, 17, 23, 0.95);
        }

        .custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            180deg,
            rgba(74, 222, 128, 0.95),
            rgba(192, 132, 252, 0.75)
          );
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 h-14 border-b border-white/10 bg-[#0f1117]/80 backdrop-blur-xl flex items-center justify-between px-5 z-50">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-green-500/20 border border-green-400/30 flex items-center justify-center text-green-300 text-sm">
            ♪
          </div>
          <h1 className="font-bold tracking-tight">VibeForge</h1>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setView("ai")}
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            AI Mode
          </button>

          <button
            onClick={() => signOut()}
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="custom-sidebar-scrollbar fixed left-0 top-14 h-[calc(100vh-56px)] w-80 bg-white/[0.03] backdrop-blur-xl border-r border-white/10 p-4 overflow-y-auto z-20">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Playlists</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Owned and collaborative playlists
          </p>
        </div>

        {!playlistsLoaded && (
          <p className="text-sm text-zinc-500">Loading playlists...</p>
        )}

        {playlistsLoaded && playlists.length === 0 && (
          <p className="text-sm text-zinc-500">No playlists found.</p>
        )}

        {playlistsLoaded && hiddenPlaylists > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/10">
            <p className="text-xs text-zinc-400">
              {hiddenPlaylists} playlists are hidden because Spotify does not
              allow reading tracks from playlists you do not own or collaborate
              on.
            </p>
          </div>
        )}

        {playlists.map((pl) => {
          const imageUrl = getBestImage(pl.images);
          const isSelected = selectedPlaylist?.id === pl.id;

          return (
            <div
              key={pl.id}
              onClick={() => openPlaylist(pl)}
              className={`p-3 rounded-xl mb-2 cursor-pointer transition flex gap-3 border ${isSelected
                ? "bg-green-500/10 border-green-400/40 shadow-lg shadow-green-500/10"
                : "bg-white/[0.04] border-white/5 hover:bg-white/[0.08] hover:border-white/10"
                }`}
            >
              <div className="w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden shrink-0 shadow-lg">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={`${pl.name} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                    ♪
                  </div>
                )}
              </div>

              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-sm font-medium truncate">{pl.name}</p>

                <p className="text-xs text-zinc-500">
                  {pl.items?.total ?? pl.tracks?.total ?? 0} tracks
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 ml-80 pt-20 p-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-900/80 text-sm text-red-200">
            {error}
          </div>
        )}
        {/* ai view */}
        {view === "ai" && (
          <div className="max-w-3xl">
            <p className="text-sm text-green-400 font-medium mb-3">
              AI Playlist Creator
            </p>

            <h2 className="text-4xl font-bold mb-3 tracking-tight">
              Turn a vibe or artist into a playlist.
            </h2>

            <p className="text-zinc-400 mb-8 max-w-2xl">
              Describe a mood, setting, genre, or artist direction. VibeForge will find
              matching Spotify tracks and create a private playlist in your account.
            </p>

            <div className="p-6 bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAiPlaylistMode("vibe")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${aiPlaylistMode === "vibe"
                    ? "bg-green-500 text-black"
                    : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
                    }`}
                >
                  Vibe
                </button>

                <button
                  onClick={() => setAiPlaylistMode("artist")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${aiPlaylistMode === "artist"
                    ? "bg-green-500 text-black"
                    : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
                    }`}
                >
                  Artist-based
                </button>
              </div>

              <label className="block text-sm text-zinc-400 mb-2">
                Playlist prompt
              </label>

              <textarea
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder={
                  aiPlaylistMode === "vibe"
                    ? "Example: rainy night drive, emotional indie pop, soft synths"
                    : "Example: music like The Weeknd, Chase Atlantic, and PARTYNEXTDOOR"
                }
                className="w-full min-h-32 p-4 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-green-400/60 transition placeholder:text-zinc-600 resize-none"
              />

              <label className="block text-sm text-zinc-400 mt-5 mb-2">
                Playlist name
              </label>

              <input
                value={aiPlaylistName}
                onChange={(event) => setAiPlaylistName(event.target.value)}
                placeholder="Optional, e.g. Midnight Coding"
                className="w-full p-4 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-green-400/60 transition placeholder:text-zinc-600"
              />

              <button
                onClick={createAiPlaylist}
                disabled={creatingPlaylist || !aiPrompt.trim()}
                className="mt-5 px-5 py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-green-500/20"
              >
                {creatingPlaylist ? "Creating playlist..." : "Create Spotify playlist"}
              </button>

              {createdPlaylistUrl && (
                <div className="mt-5 p-4 rounded-xl bg-green-500/10 border border-green-400/30">
                  <p className="text-sm text-green-300 font-medium">
                    Playlist created successfully.
                  </p>

                  <a
                    href={createdPlaylistUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-sm text-green-400 hover:text-green-300 underline underline-offset-4"
                  >
                    Open in Spotify
                  </a>
                </div>
              )}
            </div>

            <div className="mt-10 max-w-md bg-white/[0.04] border border-white/10 rounded-2xl p-4">
              <p className="text-sm text-zinc-400">Logged in as</p>
              <p className="font-medium">{profile?.display_name}</p>
            </div>
          </div>
        )}

        {/* PLAYLIST VIEW */}
        {view === "playlist" && selectedPlaylist && (
          <div className="max-w-4xl">
            <div className="flex items-end gap-6 mb-10 p-6 rounded-2xl bg-white/[0.04] border border-white/10 shadow-2xl">
              <div className="w-32 h-32 rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden shrink-0 shadow-2xl">
                {getBestImage(selectedPlaylist.images) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getBestImage(selectedPlaylist.images) ?? ""}
                    alt={`${selectedPlaylist.name} cover`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    ♪
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm text-green-400 font-medium mb-2">
                  Playlist
                </p>

                <h2 className="text-4xl font-bold tracking-tight truncate">
                  {selectedPlaylist.name}
                </h2>

                <p className="text-sm text-zinc-500 mt-2">
                  {selectedPlaylist.items?.total ??
                    selectedPlaylist.tracks?.total ??
                    0}{" "}
                  tracks
                </p>
              </div>
            </div>

            {loadingTracks && (
              <div className="mb-4 text-sm text-zinc-400">
                Loading tracks...
              </div>
            )}

            {tracks.length > 0 && !aiAnalysis && (
              <button
                onClick={() => generateAiAnalysis(tracks)}
                disabled={loadingAI}
                className="mb-4 px-4 py-2 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-green-500/20"
              >
                Generate AI analysis
              </button>
            )}

            {loadingAI && (
              <div className="mb-4 text-sm text-zinc-400">
                Generating AI analysis...
              </div>
            )}

            {aiAnalysis && (
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.04] border border-white/10 shadow-xl">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3 className="font-semibold">AI Analysis</h3>

                  <button
                    onClick={() => generateAiAnalysis(tracks)}
                    disabled={loadingAI}
                    className="text-xs px-3 py-1 rounded-full bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Regenerate
                  </button>
                </div>

                <pre className="text-sm text-zinc-300 whitespace-pre-wrap">
                  {aiAnalysis}
                </pre>
              </div>
            )}

            {/* TRACK LIST */}
            {!loadingTracks && tracks.length === 0 && (
              <p className="text-sm text-zinc-500">
                No tracks found for this playlist.
              </p>
            )}

            <div className="space-y-2">
              {tracks.map((playlistItem, i) => {
                const track = getTrackFromPlaylistItem(playlistItem);
                if (!track) return null;

                const trackImageUrl = getBestImage(track.album?.images);

                return (
                  <div
                    key={track.id ?? i}
                    className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                      {trackImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={trackImageUrl}
                          alt={`${track.name} cover`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                          ♪
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-sm text-zinc-400 truncate">
                        {track.artists
                          ?.map((artist) => artist.name)
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}