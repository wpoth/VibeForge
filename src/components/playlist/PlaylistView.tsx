import { CoverImage } from "@/components/common/CoverImage";
import {
  ManagePanelSkeleton,
  PlaylistHeaderSkeleton,
  TrackRowSkeleton,
} from "@/components/common/Skeletons";
import { TrackRow } from "@/components/playlist/TrackRow";
import type { SpotifyPlaylist, SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";

type PlaylistViewProps = {
  selectedPlaylist: SpotifyPlaylist;
  tracks: SpotifyPlaylistItem[];
  loadingTracks: boolean;
  loadingAI: boolean;
  aiAnalysis: string | null;
  playingTrackUri: string | null;
  playbackLoading: boolean;
  selectionMode: boolean;
  selectedTrackUris: string[];

  onPlayTrack: (playlistItem: SpotifyPlaylistItem) => void;
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
  playingTrackUri,
  playbackLoading,
  onToggleSelectionMode,
  onClearSelection,
  onSelectAllTracks,
  onGenerateAiAnalysis,
  onRemoveTrack,
  onToggleTrackSelection,
  onRequestRemoveSelectedTracks,
  onPlayTrack,
}: PlaylistViewProps) {
  if (loadingTracks) {
    return (
      <div className="w-full max-w-6xl">
        <PlaylistHeaderSkeleton />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <TrackRowSkeleton key={index} />
            ))}
          </div>

          <ManagePanelSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:mb-10 sm:flex-row sm:items-end sm:gap-6 sm:p-6">
        <CoverImage
          images={selectedPlaylist.images}
          alt={`${selectedPlaylist.name} cover`}
          size="lg"
        />

        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm font-medium text-green-400">Playlist</p>

          <h2 className="break-words text-3xl font-bold tracking-tight sm:truncate sm:text-4xl">
            {selectedPlaylist.name}
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            {getPlaylistTrackCount(selectedPlaylist)} tracks
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {tracks.length > 0 && !aiAnalysis && !selectionMode && (
            <button
              type="button"
              onClick={onGenerateAiAnalysis}
              disabled={loadingAI}
              className="mb-4 w-full rounded-lg bg-green-500 px-4 py-2 font-semibold text-black shadow-lg shadow-green-500/20 transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Generate AI analysis
            </button>
          )}

          {loadingAI && (
            <div className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="h-4 w-32 animate-pulse rounded bg-white/[0.08]" />
              <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.06]" />
            </div>
          )}

          {aiAnalysis && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl">
              <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold">AI Analysis</h3>

                <button
                  type="button"
                  onClick={onGenerateAiAnalysis}
                  disabled={loadingAI}
                  className="w-full rounded-full bg-white/[0.06] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-1"
                >
                  Regenerate
                </button>
              </div>

              <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-zinc-300">
                {aiAnalysis}
              </pre>
            </div>
          )}

          {tracks.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
              <p className="text-lg font-semibold text-white">
                No tracks found
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                This playlist does not have any readable tracks yet.
              </p>
            </div>
          )}

          <div className="space-y-2">
            {tracks.map((playlistItem, index) => {
              const uri =
                playlistItem.item?.uri ?? playlistItem.track?.uri ?? "";
              const selected = uri ? selectedTrackUris.includes(uri) : false;

              return (
                <TrackRow
                  key={playlistItem.item?.id ?? playlistItem.track?.id ?? index}
                  playlistItem={playlistItem}
                  index={index}
                  selectionMode={selectionMode}
                  selected={selected}
                  playingTrackUri={playingTrackUri}
                  playbackLoading={playbackLoading}
                  onToggleSelect={onToggleTrackSelection}
                  onRemove={onRemoveTrack}
                  onPlay={onPlayTrack}
                />
              );
            })}
          </div>
        </div>

        {tracks.length > 0 && (
          <aside className="order-first xl:order-none xl:sticky xl:top-20 xl:self-start">
            <div className="rounded-2xl border border-white/10 bg-[#12141f]/90 p-4 shadow-xl backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm font-semibold text-white">
                  {selectionMode
                    ? `${selectedTrackUris.length} selected`
                    : "Manage tracks"}
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Select multiple songs and remove them in one action.
                </p>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={onToggleSelectionMode}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${selectionMode
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
                      className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.1]"
                    >
                      Select all
                    </button>

                    <button
                      type="button"
                      onClick={onClearSelection}
                      disabled={selectedTrackUris.length === 0}
                      className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Clear selection
                    </button>

                    <button
                      type="button"
                      onClick={onRequestRemoveSelectedTracks}
                      disabled={selectedTrackUris.length === 0}
                      className="rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove selected
                    </button>
                  </>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
