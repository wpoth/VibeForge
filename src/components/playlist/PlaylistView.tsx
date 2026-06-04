import { CoverImage } from "@/components/common/CoverImage";
import { TrackRow } from "@/components/playlist/TrackRow";
import type {
  SpotifyPlaylist,
  SpotifyPlaylistItem,
} from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";

type PlaylistViewProps = {
  selectedPlaylist: SpotifyPlaylist;
  tracks: SpotifyPlaylistItem[];
  loadingTracks: boolean;
  loadingAI: boolean;
  aiAnalysis: string | null;

  selectionMode: boolean;
  selectedTrackUris: string[];

  onToggleSelectionMode: () => void;
  onClearSelection: () => void;
  onSelectAllTracks: () => void;
  onGenerateAiAnalysis: () => void;
  onRemoveTrack: (playlistItem: SpotifyPlaylistItem) => void;
  onToggleTrackSelection: (playlistItem: SpotifyPlaylistItem) => void;
  onRequestRemoveSelectedTracks: () => void;
};

export function PlaylistView({
  selectedPlaylist,
  tracks,
  loadingTracks,
  loadingAI,
  aiAnalysis,
  selectionMode,
  selectedTrackUris,
  onToggleSelectionMode,
  onClearSelection,
  onSelectAllTracks,
  onGenerateAiAnalysis,
  onRemoveTrack,
  onToggleTrackSelection,
  onRequestRemoveSelectedTracks,
}: PlaylistViewProps) {
  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6 mb-8 sm:mb-10 p-4 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 shadow-2xl">
        <CoverImage
          images={selectedPlaylist.images}
          alt={`${selectedPlaylist.name} cover`}
          size="lg"
        />

        <div className="min-w-0">
          <p className="text-sm text-green-400 font-medium mb-2">Playlist</p>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight break-words sm:truncate">
            {selectedPlaylist.name}
          </h2>

          <p className="text-sm text-zinc-500 mt-2">
            {getPlaylistTrackCount(selectedPlaylist)} tracks
          </p>
        </div>
      </div>

      {loadingTracks && (
        <div className="mb-4 text-sm text-zinc-400">Loading tracks...</div>
      )}

      {tracks.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              {selectionMode
                ? `${selectedTrackUris.length} selected`
                : "Manage tracks"}
            </p>
            <p className="text-xs text-zinc-500">
              Select multiple songs and remove them in one action.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onToggleSelectionMode}
              className={`rounded-lg cursor-pointer px-3 py-2 text-sm font-medium transition ${
                selectionMode
                  ? "bg-white/[0.08] text-zinc-300 hover:bg-white/[0.12]"
                  : "bg-green-500 text-black hover:bg-green-400"
              }`}
            >
              {selectionMode ? "Exit select" : "Select songs"}
            </button>

            {selectionMode && (
              <>
                <button
                  type="button"
                  onClick={onSelectAllTracks}
                  className="rounded-lg cursor-pointer bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.1]"
                >
                  Select all
                </button>

                <button
                  type="button"
                  onClick={onClearSelection}
                  disabled={selectedTrackUris.length === 0}
                  className="rounded-lg cursor-pointer bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={onRequestRemoveSelectedTracks}
                  disabled={selectedTrackUris.length === 0}
                  className="rounded-lg cursor-pointer bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove selected
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {tracks.length > 0 && !aiAnalysis && !selectionMode && (
        <button
          type="button"
          onClick={onGenerateAiAnalysis}
          disabled={loadingAI}
          className="mb-4 w-full sm:w-auto px-4 py-2 rounded-lg cursor-pointer bg-green-500 text-black font-semibold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-green-500/20"
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <h3 className="font-semibold">AI Analysis</h3>

            <button
              onClick={onGenerateAiAnalysis}
              disabled={loadingAI}
              className="w-full sm:w-auto cursor-pointer text-xs px-3 py-2 sm:py-1 rounded-full bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Regenerate
            </button>
          </div>

          <pre className="text-sm text-zinc-300 whitespace-pre-wrap overflow-x-auto">
            {aiAnalysis}
          </pre>
        </div>
      )}

      {!loadingTracks && tracks.length === 0 && (
        <p className="text-sm text-zinc-500">
          No tracks found for this playlist.
        </p>
      )}

      <div className="space-y-2">
        {tracks.map((playlistItem, index) => {
          const uri = playlistItem.item?.uri ?? playlistItem.track?.uri ?? "";
          const selected = uri ? selectedTrackUris.includes(uri) : false;

          return (
            <TrackRow
              key={playlistItem.item?.id ?? playlistItem.track?.id ?? index}
              playlistItem={playlistItem}
              index={index}
              selectionMode={selectionMode}
              selected={selected}
              onToggleSelect={onToggleTrackSelection}
              onRemove={onRemoveTrack}
            />
          );
        })}
      </div>
    </div>
  );
}