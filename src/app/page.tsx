"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Page() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    fetch("/api/me", {
      method: "POST",
      body: JSON.stringify({ accessToken: session.accessToken }),
    })
      .then((r) => r.json())
      .then(setProfile);
  }, [session]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading VibeForge...
      </div>
    );
  }

  // Logged out
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-zinc-900 to-black text-white">
        <h1 className="text-5xl font-bold tracking-tight">
          VibeForge
        </h1>

        <p className="mt-4 text-zinc-400 text-center max-w-md">
          Turn your mood into music. AI-powered Spotify experience.
        </p>

        <button
          onClick={() => signIn("spotify", { callbackUrl: "/" })}
          className="mt-8 px-6 py-3 rounded-full bg-green-500 hover:bg-green-400 text-black font-semibold transition"
        >
          Login with Spotify
        </button>
      </div>
    );
  }

  // Logged in
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white px-6 py-10">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          VibeForge
        </h1>

        <button
          onClick={() => signOut()}
          className="text-sm text-zinc-400 hover:text-white transition"
        >
          Logout
        </button>
      </div>

      {/* Profile Card */}
      <div className="mt-10 max-w-md bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 backdrop-blur">
        <h2 className="text-xl font-semibold mb-4">
          Your Spotify Profile
        </h2>

        {profile ? (
          <div className="space-y-2 text-sm text-zinc-300">
            <p>
              <span className="text-zinc-500">Name:</span>{" "}
              {profile.display_name}
            </p>
            <p>
              <span className="text-zinc-500">Country:</span>{" "}
              {profile.country}
            </p>
            <p>
              <span className="text-zinc-500">Product:</span>{" "}
              {profile.product}
            </p>
          </div>
        ) : (
          <p className="text-zinc-500">Loading profile...</p>
        )}
      </div>

      {/* Future AI Section */}
      <div className="mt-10">
        <div className="text-zinc-400 text-sm mb-2">
          AI Feature (coming next)
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-zinc-500">
          “Describe a vibe → generate playlist”
        </div>
      </div>
    </div>
  );
}