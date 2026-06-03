"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Page() {
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);
  const [tracks, setTracks] = useState<any>(null);
  const [view, setView] = useState<"ai" | "playlist">("ai");

  // Profile
  useEffect(() => {
    if (!session?.accessToken) return;

    fetch("/api/me", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken: session.accessToken }),
    })
      .then((r) => r.json())
      .then(setProfile);
  }, [session]);

  // Playlists
  useEffect(() => {
    if (!session?.accessToken) return;

    fetch("/api/playlists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken: session.accessToken }),
    })
      .then((r) => r.json())
      .then(setPlaylists);
  }, [session]);

  async function openPlaylist(pl: any) {
    setSelectedPlaylist(pl);
    setView("playlist");

    const res = await fetch("/api/playlist-tracks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: session?.accessToken,
        playlistId: pl.id,
      }),
    });

    const data = await res.json();
    setTracks(data);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading VibeForge...
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 h-14 border-b border-zinc-800 bg-black flex items-center justify-between px-4 z-50">
        <h1 className="font-bold">VibeForge</h1>

        <div className="flex gap-3 items-center">
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

        {playlists?.items?.map((pl: any) => (
          <div
            key={pl.id}
            onClick={() => openPlaylist(pl)}
            className="p-3 rounded-lg mb-2 bg-zinc-900 hover:bg-zinc-800 cursor-pointer transition"
          >
            <p className="text-sm font-medium">{pl.name}</p>
            <p className="text-xs text-zinc-500">
              {pl.tracks?.total ?? 0} tracks
            </p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="ml-72 pt-20 p-6">

        {/* AI VIEW */}
        {view === "ai" && (
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-6">AI Mode</h2>

            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <input
                placeholder="Describe a vibe..."
                className="w-full p-3 bg-black border border-zinc-800 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* PLAYLIST VIEW */}
        {view === "playlist" && selectedPlaylist && (
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-6">
              {selectedPlaylist.name}
            </h2>

            {tracks?.items?.map((t: any, i: number) => {
              const track = t?.track;
              if (!track) return null;

              return (
                <div
                  key={i}
                  className="p-3 mb-2 rounded-lg bg-zinc-900 border border-zinc-800"
                >
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-zinc-400">
                    {track.artists?.map((a: any) => a.name).join(", ")}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* PROFILE (optional small section) */}
        {view === "ai" && (
          <div className="mt-10 max-w-md bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
            <p className="text-sm text-zinc-400">Logged in as</p>
            <p className="font-medium">{profile?.display_name}</p>
          </div>
        )}
      </div>
    </div>
  );
}