import type { SpotifyProfile } from "@/lib/spotify-types";

type AiPlaylistCreatorProps = {
  profile: SpotifyProfile | null;
  aiPrompt: string;
  aiPlaylistName: string;
  aiPlaylistMode: "vibe" | "artist";
  creatingPlaylist: boolean;
  createdPlaylistUrl: string | null;
  onPromptChange: (value: string) => void;
  onPlaylistNameChange: (value: string) => void;
  onModeChange: (value: "vibe" | "artist") => void;
  onCreatePlaylist: () => void;
};

export function AiPlaylistCreator({
  profile,
  aiPrompt,
  aiPlaylistName,
  aiPlaylistMode,
  creatingPlaylist,
  createdPlaylistUrl,
  onPromptChange,
  onPlaylistNameChange,
  onModeChange,
  onCreatePlaylist,
}: AiPlaylistCreatorProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm text-green-400 font-medium mb-3">
        AI Playlist Creator
      </p>

      <h2 className="text-4xl font-bold mb-3 tracking-tight">
        Turn a vibe or artist into a playlist.
      </h2>

      <p className="text-zinc-400 mb-8 max-w-2xl">
        Describe a mood, setting, genre, or artist direction. VibeForge will
        find matching Spotify tracks and create a private playlist in your
        account.
      </p>

      <div className="p-6 bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => onModeChange("vibe")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              aiPlaylistMode === "vibe"
                ? "bg-green-500 text-black"
                : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
            }`}
          >
            Vibe
          </button>

          <button
            onClick={() => onModeChange("artist")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              aiPlaylistMode === "artist"
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
          onChange={(event) => onPromptChange(event.target.value)}
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
          onChange={(event) => onPlaylistNameChange(event.target.value)}
          placeholder="Optional, e.g. Midnight Coding"
          className="w-full p-4 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-green-400/60 transition placeholder:text-zinc-600"
        />

        <button
          onClick={onCreatePlaylist}
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
  );
}