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

function getTrackFromPlaylistItem(item: SpotifyPlaylistItem): SpotifyTrack | null {
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
      <div className="fixed left-0 top-14 h-[calc(100vh-56px)] w-80 bg-zinc-950 border-r border-zinc-800 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Playlists</h2>

        {!playlistsLoaded && (
          <p className="text-sm text-zinc-500">Loading playlists...</p>
        )}

        {playlistsLoaded && playlists.length === 0 && (
          <p className="text-sm text-zinc-500">No playlists found.</p>
        )}

        {playlistsLoaded && hiddenPlaylists > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800">
            <p className="text-xs text-zinc-400">
              {hiddenPlaylists} playlists are hidden because Spotify does not
              allow reading tracks from playlists you do not own or collaborate
              on.
            </p>
          </div>
        )}

        {playlists.map((pl) => {
          const imageUrl = getBestImage(pl.images);

          return (
            <div
              key={pl.id}
              onClick={() => openPlaylist(pl)}
              className="p-3 rounded-lg mb-2 bg-zinc-900 hover:bg-zinc-800 cursor-pointer transition flex gap-3"
            >
              <div className="w-12 h-12 rounded-md bg-zinc-800 overflow-hidden shrink-0">
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

              <div className="min-w-0">
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
      <div className="ml-80 pt-20 p-6">
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
            <div className="flex items-center gap-4 mb-8">
              <div className="w-24 h-24 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
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

              <div>
                <p className="text-sm text-zinc-500">Playlist</p>
                <h2 className="text-2xl font-bold">
                  {selectedPlaylist.name}
                </h2>
                <p className="text-sm text-zinc-500">
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
                className="mb-4 px-4 py-2 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="mb-6 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h3 className="font-semibold">AI Analysis</h3>

                  <button
                    onClick={() => generateAiAnalysis(tracks)}
                    disabled={loadingAI}
                    className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {tracks.map((playlistItem, i) => {
              const track = getTrackFromPlaylistItem(playlistItem);
              if (!track) return null;

              const trackImageUrl = getBestImage(track.album?.images);

              return (
                <div
                  key={track.id ?? i}
                  className="p-3 mb-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-md bg-zinc-800 overflow-hidden shrink-0">
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
        )}
      </div>
    </div>
  );
}