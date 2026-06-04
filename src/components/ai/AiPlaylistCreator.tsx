import type {
  AiPreviewTrack,
  SpotifyPlaylist,
  SpotifyProfile,
} from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";

type AiPlaylistCreatorProps = {
  profile: SpotifyProfile | null;
  playlists: SpotifyPlaylist[];

  aiPrompt: string;
  aiPlaylistName: string;
  aiPlaylistMode: "vibe" | "artist";
  aiPlaylistTarget: "new" | "existing";
  selectedTargetPlaylistId: string;

  creatingPlaylist: boolean;
  createdPlaylistUrl: string | null;
  successMessage: string | null;

  previewTracks: AiPreviewTrack[];
  selectedPreviewTrackUris: string[];
  generatingPreview: boolean;

  onPromptChange: (value: string) => void;
  onPlaylistNameChange: (value: string) => void;
  onModeChange: (value: "vibe" | "artist") => void;
  onTargetChange: (value: "new" | "existing") => void;
  onTargetPlaylistChange: (value: string) => void;

  onGeneratePreview: () => void;
  onTogglePreviewTrack: (trackUri: string) => void;
  onSelectAllPreviewTracks: () => void;
  onClearPreviewSelection: () => void;
  onClearPreview: () => void;

  onCreatePlaylist: () => void;
};

export function AiPlaylistCreator({
  profile,
  playlists,
  aiPrompt,
  aiPlaylistName,
  aiPlaylistMode,
  aiPlaylistTarget,
  selectedTargetPlaylistId,
  creatingPlaylist,
  createdPlaylistUrl,
  successMessage,

  previewTracks,
  selectedPreviewTrackUris,
  generatingPreview,

  onPromptChange,
  onPlaylistNameChange,
  onModeChange,
  onTargetChange,
  onTargetPlaylistChange,

  onGeneratePreview,
  onTogglePreviewTrack,
  onSelectAllPreviewTracks,
  onClearPreviewSelection,
  onClearPreview,

  onCreatePlaylist,
}: AiPlaylistCreatorProps) {
  return (
    <div className="w-full max-w-3xl">
      <p className="text-sm text-green-400 font-medium mb-3">
        AI Playlist Creator
      </p>

      <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
        Turn a vibe or artist into a playlist.
      </h2>

      <p className="text-zinc-400 mb-6 sm:mb-8 max-w-2xl">
        Describe a mood, setting, genre, or artist direction. VibeForge will
        find matching Spotify tracks and create a private playlist in your
        account.
      </p>

      <div className="p-4 sm:p-6 bg-white/[0.04] border border-white/10 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-2 gap-2 mb-4 sm:flex">
          <button
            onClick={() => onModeChange("vibe")}
            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition ${
              aiPlaylistMode === "vibe"
                ? "bg-green-500 text-black"
                : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
            }`}
          >
            Vibe
          </button>

          <button
            onClick={() => onModeChange("artist")}
            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition ${
              aiPlaylistMode === "artist"
                ? "bg-green-500 text-black"
                : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
            }`}
          >
            Artist-based
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="mb-3 text-sm font-medium text-zinc-300">
            Playlist destination
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onTargetChange("new")}
              className={`rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition ${
                aiPlaylistTarget === "new"
                  ? "bg-green-500 text-black"
                  : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
              }`}
            >
              New playlist
            </button>

            <button
              type="button"
              onClick={() => onTargetChange("existing")}
              className={`rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition ${
                aiPlaylistTarget === "existing"
                  ? "bg-green-500 text-black"
                  : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
              }`}
            >
              Existing playlist
            </button>
          </div>

          {aiPlaylistTarget === "existing" && (
            <div className="mt-4">
              <label className="mb-2 block text-sm text-zinc-400">
                Choose playlist
              </label>

              <select
                value={selectedTargetPlaylistId}
                onChange={(event) => onTargetPlaylistChange(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white outline-none transition focus:border-green-400/60"
              >
                <option value="">Select a playlist</option>

                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name} · {getPlaylistTrackCount(playlist)} tracks
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-zinc-500">
                Tracks will be appended to the selected playlist.
              </p>
            </div>
          )}
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

        {aiPlaylistTarget === "new" && (
          <>
            <label className="block text-sm text-zinc-400 mt-5 mb-2">
              Playlist name
            </label>

            <input
              value={aiPlaylistName}
              onChange={(event) => onPlaylistNameChange(event.target.value)}
              placeholder="Optional, e.g. Midnight Coding"
              className="w-full p-4 bg-black/30 border border-white/10 rounded-xl outline-none focus:border-green-400/60 transition placeholder:text-zinc-600"
            />
          </>
        )}

        <button
          onClick={onCreatePlaylist}
          disabled={
            creatingPlaylist ||
            !aiPrompt.trim() ||
            (aiPlaylistTarget === "existing" && !selectedTargetPlaylistId)
          }
          className="mt-5 w-full sm:w-auto px-5 py-3 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-green-500/20"
        >
          {creatingPlaylist
            ? aiPlaylistTarget === "existing"
              ? "Adding songs..."
              : "Creating playlist..."
            : aiPlaylistTarget === "existing"
            ? "Add songs to playlist"
            : "Create Spotify playlist"}
        </button>
        {previewTracks.length > 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  Preview tracks
                </p>
                <p className="text-xs text-zinc-500">
                  {selectedPreviewTrackUris.length} of {previewTracks.length}{" "}
                  selected
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onSelectAllPreviewTracks}
                  className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.1]"
                >
                  Select all
                </button>

                <button
                  type="button"
                  onClick={onClearPreviewSelection}
                  disabled={selectedPreviewTrackUris.length === 0}
                  className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear selection
                </button>

                <button
                  type="button"
                  onClick={onClearPreview}
                  className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  Clear preview
                </button>
              </div>
            </div>

            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {previewTracks.map((track: AiPreviewTrack) => {
                if (!track.uri) return null;

                const selected = selectedPreviewTrackUris.includes(track.uri);

                return (
                  <button
                    key={track.uri}
                    type="button"
                    onClick={() => onTogglePreviewTrack(track.uri!)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-green-400/40 bg-green-500/10"
                        : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                        {track.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={track.imageUrl}
                            alt={`${track.name ?? "Track"} cover`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                            ♪
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {track.name ?? "Unknown track"}
                        </p>
                        <p className="truncate text-xs text-zinc-400">
                          {track.artists?.join(", ") || "Unknown artist"}
                        </p>
                      </div>

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                          selected
                            ? "border-green-400 bg-green-500 text-black"
                            : "border-white/20 text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-5 p-4 rounded-xl bg-green-500/10 border border-green-400/30">
            <p className="text-sm text-green-300 font-medium">
              {successMessage}
            </p>

            {createdPlaylistUrl && (
              <a
                href={createdPlaylistUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 text-sm text-green-400 hover:text-green-300 underline underline-offset-4"
              >
                Open in Spotify
              </a>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 sm:mt-10 max-w-md bg-white/[0.04] border border-white/10 rounded-2xl p-4">
        <p className="text-sm text-zinc-400">Logged in as</p>
        <p className="font-medium truncate">{profile?.display_name}</p>
      </div>
    </div>
  );
}
