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
  onGenerateAiAnalysis: () => void;
};

export function PlaylistView({
  selectedPlaylist,
  tracks,
  loadingTracks,
  loadingAI,
  aiAnalysis,
  onGenerateAiAnalysis,
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

      {tracks.length > 0 && !aiAnalysis && (
        <button
          onClick={onGenerateAiAnalysis}
          disabled={loadingAI}
          className="mb-4 w-full sm:w-auto px-4 py-2 rounded-lg bg-green-500 text-black font-semibold hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-green-500/20"
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
              className="w-full sm:w-auto text-xs px-3 py-2 sm:py-1 rounded-full bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed transition"
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
        {tracks.map((playlistItem, index) => (
          <TrackRow
            key={playlistItem.item?.id ?? playlistItem.track?.id ?? index}
            playlistItem={playlistItem}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}