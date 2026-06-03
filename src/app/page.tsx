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

  // PROFILE (unchanged if you still use it)
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setProfile)
      .catch(console.error);
  }, []);

  // PLAYLISTS (clean DTO)
  useEffect(() => {
    if (!session) return;

    fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotifyId: (session as any).spotifyId,
      }),
    })
      .then((r) => r.json())
      .then((data) => setPlaylists(data.playlists ?? []))
      .catch(console.error);
  }, [session]);

  // OPEN PLAYLIST
  async function openPlaylist(pl: any) {
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
      }),
    });

    const full = await res.json();

    if (!res.ok || full?.error) {
      console.error("Failed to load playlist:", full);
      return;
    }

    // ✅ CLEAN DTO: no Spotify nesting anymore
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
    } catch (err) {
      console.error("AI failed:", err);
    } finally {
      setLoadingAI(false);
    }
  }

  // LOADING
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </div>
    );
  }

  // LOGIN
  if (!session) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-5xl font-bold">VibeForge</h1>

        <button
          onClick={() => signIn("spotify", { callbackUrl: "/" })}
          className="mt-6 px-6 py-3 bg-green-500 text-black rounded-full font-semibold hover:scale-105 transition"
        >
          Login with Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-black/60 backdrop-blur border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <h1 className="font-bold text-green-400">VibeForge</h1>

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
      <div className="fixed left-0 top-14 w-72 h-[calc(100vh-56px)] bg-zinc-950 border-r border-zinc-800 p-4 overflow-y-auto">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
          Playlists
        </h2>

        {playlists.map((pl: any, i: number) => (
          <div
            key={pl.id}
            onClick={() => openPlaylist(pl)}
            className="p-3 mb-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-800 cursor-pointer transition transform hover:translate-x-1"
            style={{
              animation: `fadeIn 0.2s ease ${i * 0.02}s both`,
            }}
          >
            <p className="font-medium">{pl.name}</p>
            <p className="text-xs text-zinc-500">{pl.trackCount ?? 0} tracks</p>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div className="ml-72 pt-20 p-6">
        {/* AI VIEW */}
        {view === "ai" && (
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">AI Mode</h2>

            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl">
              <input
                placeholder="Describe a vibe..."
                className="w-full p-3 bg-black border border-zinc-800 rounded-lg focus:border-green-500 outline-none"
              />
            </div>

            <div className="mt-8 text-sm text-zinc-400">
              Logged in as {profile?.display_name}
            </div>
          </div>
        )}

        {/* PLAYLIST VIEW */}
        {view === "playlist" && selectedPlaylist && (
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-4 text-green-400">
              {selectedPlaylist.name}
            </h2>

            {loadingAI && (
              <div className="text-sm text-zinc-500 mb-4 animate-pulse">
                Generating AI analysis...
              </div>
            )}

            {aiAnalysis && (
              <div className="mb-6 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                <pre className="text-sm whitespace-pre-wrap text-zinc-300">
                  {aiAnalysis}
                </pre>
              </div>
            )}

            {/* TRACKS */}
            <div className="space-y-2">
              {tracks.map((t: any, i: number) => (
                <div
                  key={i}
                  className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg hover:bg-zinc-800/60 transition transform hover:translate-x-1"
                  style={{
                    animation: `fadeIn 0.15s ease ${i * 0.015}s both`,
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

      {/* ANIMATION */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
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
