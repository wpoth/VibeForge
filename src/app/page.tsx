"use client";

import { signIn } from "next-auth/react";

import { BetaAccessNotice } from "@/components/common/BetaAccessNotice";

export default function PublicLandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#12141f] via-[#0f1117] to-[#17111f] px-4 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/5 blur-3xl" />
      </div>

      <section className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-200">
          AI Spotify playlist tools
        </div>

        <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
          VibeForge
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
          A calm Spotify dashboard for creating AI-powered playlists, exploring
          your recently played songs, and managing your music library without
          clutter.
        </p>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500 sm:text-base">
          Connect your Spotify account to generate playlists from prompts, view
          your latest listening activity, open your playlists, queue tracks, and
          use AI tools to better understand the mood and structure of your
          music.
        </p>

        <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-lg shadow-black/10">
            <p className="text-sm font-semibold text-white">AI playlists</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Generate Spotify playlists from moods, scenes, artists, or custom
              prompts.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-lg shadow-black/10">
            <p className="text-sm font-semibold text-white">Recent listens</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              See your recently played tracks and discover what you keep coming
              back to.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-lg shadow-black/10">
            <p className="text-sm font-semibold text-white">Playlist tools</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Play songs, add tracks to queue, inspect playlists, and manage
              your library.
            </p>
          </div>
        </div>

        <BetaAccessNotice />

        <button
          type="button"
          onClick={() => signIn("spotify", { callbackUrl: "/dashboard" })}
          className="mt-8 cursor-pointer rounded-full bg-green-500 px-7 py-3 font-semibold text-black shadow-lg shadow-green-500/20 transition hover:bg-green-400"
        >
          Login with Spotify
        </button>

        <p className="mt-4 max-w-md text-xs leading-5 text-zinc-600">
          VibeForge uses Spotify login to access your playlists, playback state,
          and recently played tracks. Your dashboard becomes available after
          connecting.
        </p>
      </section>
    </main>
  );
}