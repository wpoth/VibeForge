"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Page() {
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [view, setView] = useState<"ai" | "playlist">("ai");

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // PROFILE
  useEffect(() => {
    if (!session?.accessToken) return;

    fetch("/api/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: session.accessToken }),
    })
      .then((r) => r.json())
      .then(setProfile)
      .catch(console.error);
  }, [session?.accessToken]);

  // PLAYLISTS
  useEffect(() => {
    if (!session?.accessToken) return;

    const spotifyId = (session as any).spotifyId;
    if (!spotifyId) return;

    fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: session.accessToken,
        spotifyId,
      }),
    })
      .then((r) => r.json())
      .then((data) => setPlaylists(data.playlists ?? []))
      .catch(console.error);
  }, [session?.accessToken]);

  // OPEN PLAYLIST
  async function openPlaylist(pl: any) {
    if (!session?.accessToken) return;

    setView("playlist");
    setSelectedPlaylist(pl);
    setTracks([]);
    setAiAnalysis(null);
    setLoadingAI(false);

    const res = await fetch("/api/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playlistId: pl.id,
        accessToken: session.accessToken,
      }),
    });

    const full = await res.json();

    if (!res.ok || full?.error) return;

    setSelectedPlaylist(full);
    setTracks(full.tracks ?? []);

    const simplified = (full.tracks ?? []).map((t: any) => ({
      name: t.name,
      artists: t.artists,
    }));

    if (!simplified.length) return;

    setLoadingAI(true);

    try {
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist: simplified }),
      });

      const aiData = await aiRes.json();
      setAiAnalysis(aiData?.result ?? null);
    } finally {
      setLoadingAI(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-black to-zinc-900 text-white">
        <div className="animate-pulse text-zinc-400">Loading VibeForge...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-zinc-950 to-zinc-900 text-white">
        <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-emerald-600 text-transparent bg-clip-text animate-pulse">
          VibeForge
        </h1>

        <button
          onClick={() => signIn("spotify", { callbackUrl: "/" })}
          className="mt-8 px-6 py-3 rounded-full bg-green-500 hover:bg-green-400 text-black font-semibold transition transform hover:scale-105"
        >
          Login with Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-gradient-to-b from-black via-zinc-950 to-black">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 h-14 backdrop-blur-md bg-black/60 border-b border-zinc-800 flex items-center justify-between px-5 z-50">
        <h1 className="font-bold tracking-wide text-green-400">
          VibeForge
        </h1>

        <div className="flex gap-4">
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
      <div className="fixed left-0 top-14 w-72 h-[calc(100vh-56px)] bg-zinc-950/70 border-r border-zinc-800 p-4 overflow-y-auto">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500 mb-4">
          Playlists
        </h2>

        {playlists.map((pl: any, i: number) => (
          <div
            key={pl.id}
            onClick={() => openPlaylist(pl)}
            className="p-3 mb-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 cursor-pointer transition transform hover:translate-x-1 hover:scale-[1.02] duration-200"
            style={{
              animation: `fadeIn 0.2s ease ${i * 0.03}s both`,
            }}
          >
            <p className="font-medium">{pl.name}</p>
            <p className="text-xs text-zinc-500">
              {pl.trackCount ?? pl.tracks?.total ?? 0} tracks
            </p>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div className="ml-72 pt-20 p-6">
        {/* AI VIEW */}
        {view === "ai" && (
          <div className="max-w-2xl animate-[fadeIn_0.3s_ease]">
            <h2 className="text-3xl font-bold mb-6 text-zinc-200">
              AI Mode
            </h2>

            <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800 shadow-lg">
              <input
                placeholder="Describe a vibe..."
                className="w-full p-3 rounded-lg bg-black border border-zinc-800 focus:outline-none focus:border-green-500 transition"
              />
            </div>

            <div className="mt-8 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800">
              <p className="text-xs text-zinc-500">Logged in as</p>
              <p className="text-sm font-medium">{profile?.display_name}</p>
            </div>
          </div>
        )}

        {/* PLAYLIST VIEW */}
        {view === "playlist" && selectedPlaylist && (
          <div className="max-w-3xl animate-[fadeIn_0.25s_ease]">
            <h2 className="text-3xl font-bold mb-4 text-green-400">
              {selectedPlaylist.name}
            </h2>

            {loadingAI && (
              <div className="text-sm text-zinc-500 mb-4 animate-pulse">
                Generating AI analysis...
              </div>
            )}

            {aiAnalysis && (
              <div className="mb-6 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <p className="text-sm whitespace-pre-wrap text-zinc-300">
                  {aiAnalysis}
                </p>
              </div>
            )}

            {/* TRACKS */}
            <div className="space-y-2">
              {tracks.map((t: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-800/60 transition transform hover:translate-x-1"
                  style={{
                    animation: `fadeIn 0.2s ease ${i * 0.02}s both`,
                  }}
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-zinc-500">
                    {t.artists?.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SIMPLE KEYFRAME ANIMATION */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}