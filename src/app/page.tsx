"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type SpotifyArtist = {
  name?: string;
};

type SpotifyTrack = {
  id?: string;
  name?: string;
  type?: string;
  artists?: SpotifyArtist[];
};

type SpotifyPlaylistItem = {
  item?: SpotifyTrack | null;
  track?: SpotifyTrack | null;
};

type SpotifyPlaylist = {
  id: string;
  name: string;
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
};

type PlaylistTracksResponse = ApiErrorResponse & {
  items?: SpotifyPlaylistItem[];
};

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unknown error";
}

function getTrackFromPlaylistItem(item: SpotifyPlaylistItem): SpotifyTrack | null {
  return item.item ?? item.track ?? null;
}

export default function Page() {
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistsLoaded, setPlaylistsLoaded] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyPlaylistItem[]>([]);
  const [view, setView] = useState<"ai" | "playlist">("ai");

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = session?.accessToken;

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

    fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    })
      .then((r) => r.json())
      .then((data: PlaylistsResponse) => {
        if (data?.error) {
          throw new Error(data?.message || "Failed to load playlists");
        }

        setPlaylists(data.items ?? []);
      })
      .catch((err: unknown) => {
        console.error(err);
        setError(getErrorMessage(err));
      })
      .finally(() => setPlaylistsLoaded(true));
  }, [accessToken]);

  async function generateAiAnalysis(playlistItems: SpotifyPlaylistItem[]) {
    const simplified = playlistItems
      .map(getTrackFromPlaylistItem)
      .filter((track): track is SpotifyTrack => Boolean(track?.name))
      .map((track) => ({
        name: track.name,
        artists: track.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
      }));

    if (!simplified.length) return;

    setLoadingAI(true);

    try {
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist: simplified }),
      });

      const aiData = (await aiRes.json()) as ApiErrorResponse & { result?: string };

      if (!aiRes.ok || aiData?.error) {
        throw new Error(aiData?.message || String(aiData?.error) || "AI analysis failed");
      }

      setAiAnalysis(aiData?.result ?? null);
    } catch (err: unknown) {
      console.error("AI failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingAI(false);
    }
  }

  // OPEN PLAYLIST
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
      await generateAiAnalysis(playlistItems);
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
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading VibeForge...
      </div>
    );
  }

  // LOGIN SCREEN
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-5xl font-bold">VibeForge</h1>

        <button
          onClick={() => signIn("spotify", { callbackUrl: "/" })}
          className="mt-6 px-6 py-3 bg-green-500 text-black rounded-full font-semibold"
        >
          Login with Spotify
        </button>
      </div>
    );
  }

  // MAIN UI
  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 h-14 border-b border-zinc-800 bg-black flex items-center justify-between px-4 z-50">
        <h1 className="font-bold">VibeForge</h1>

        <div className="flex gap-3">
          <button
            onClick={() => setView("ai")}
            className="text-sm text-zinc-400 hover:text-white"
          >
            AI Mode
          </button>

          <button
            onClick={() => signOut()}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="fixed left-0 top-14 h-[calc(100vh-56px)] w-72 bg-zinc-950 border-r border-zinc-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Playlists</h2>

        {!playlistsLoaded && (
          <p className="text-sm text-zinc-500">Loading playlists...</p>
        )}

        {playlistsLoaded && playlists.length === 0 && (
          <p className="text-sm text-zinc-500">No playlists found.</p>
        )}

        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => openPlaylist(pl)}
            className="p-3 rounded-lg mb-2 bg-zinc-900 hover:bg-zinc-800 cursor-pointer transition"
          >
            <p className="text-sm font-medium">{pl.name}</p>

            <p className="text-xs text-zinc-500">
              {pl.items?.total ?? pl.tracks?.total ?? 0} tracks
            </p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="ml-72 pt-20 p-6">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-900 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* AI MODE */}
        {view === "ai" && (
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">AI Mode</h2>

            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <input
                placeholder="Describe a vibe..."
                className="w-full p-3 bg-black border border-zinc-800 rounded-lg"
              />
            </div>

            <div className="mt-10 max-w-md bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm text-zinc-400">Logged in as</p>
              <p className="font-medium">{profile?.display_name}</p>
            </div>
          </div>
        )}

        {/* PLAYLIST VIEW */}
        {view === "playlist" && selectedPlaylist && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">
              {selectedPlaylist.name}
            </h2>

            {loadingTracks && (
              <div className="mb-4 text-sm text-zinc-400">
                Loading tracks...
              </div>
            )}

            {loadingAI && (
              <div className="mb-4 text-sm text-zinc-400">
                Generating AI analysis...
              </div>
            )}

            {aiAnalysis && (
              <div className="mb-6 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                <h3 className="font-semibold mb-2">AI Analysis</h3>
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

            {tracks.map((playlistItem, i) => {
              const track = getTrackFromPlaylistItem(playlistItem);
              if (!track) return null;

              return (
                <div
                  key={track.id ?? i}
                  className="p-3 mb-2 rounded-lg bg-zinc-900 border border-zinc-800"
                >
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-zinc-400">
                    {track.artists?.map((artist) => artist.name).join(", ")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
