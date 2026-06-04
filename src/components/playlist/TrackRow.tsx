import { CoverImage } from "@/components/common/CoverImage";
import type { SpotifyPlaylistItem } from "@/lib/spotify-types";
import {
  getRelativeAddedTime,
  getTrackFromPlaylistItem,
  wasRecentlyAdded,
} from "@/lib/ui-helpers";

type TrackRowProps = {
  playlistItem: SpotifyPlaylistItem;
  index: number;
  selectionMode?: boolean;
  selected?: boolean;
  playingTrackUri?: string | null;
  playbackLoading?: boolean;
  onToggleSelect?: (playlistItem: SpotifyPlaylistItem) => void;
  onRemove?: (playlistItem: SpotifyPlaylistItem) => void;
  onPlay?: (playlistItem: SpotifyPlaylistItem) => void;
};

export function TrackRow({
  playlistItem,
  index,
  selectionMode = false,
  selected = false,
  playingTrackUri = null,
  playbackLoading = false,
  onToggleSelect,
  onRemove,
  onPlay,
}: TrackRowProps) {
  const track = getTrackFromPlaylistItem(playlistItem);
  if (!track) return null;

  const isCurrentTrack = Boolean(track.uri && track.uri === playingTrackUri);
  const addedLabel = getRelativeAddedTime(playlistItem.added_at);
  const recentlyAdded = wasRecentlyAdded(playlistItem.added_at);

  function handleRemoveClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onRemove?.(playlistItem);
  }

  function handlePlayClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onPlay?.(playlistItem);
  }
  function handleSelectClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onToggleSelect?.(playlistItem);
  }

  function handleRowClick() {
    if (selectionMode) {
      onToggleSelect?.(playlistItem);
    }
  }

  return (
    <div
      key={track.id ?? index}
      onClick={handleRowClick}
      className={`group p-3 rounded-xl border transition flex items-center gap-3 ${
        selected
          ? "bg-green-500/10 border-green-400/40"
          : "bg-white/[0.04] border-white/10 hover:bg-white/[0.07]"
      } ${selectionMode ? "cursor-pointer" : ""}`}
    >
      {selectionMode && (
        <button
          type="button"
          onClick={handleSelectClick}
          className={`h-5 w-5 rounded-md border cursor-pointer flex items-center justify-center shrink-0 transition ${
            selected
              ? "bg-green-500 border-green-400 text-black"
              : "bg-white/[0.04] border-white/20 text-transparent hover:border-green-400/50"
          }`}
          aria-label={
            selected ? `Deselect ${track.name}` : `Select ${track.name}`
          }
        >
          ✓
        </button>
      )}

      <div className="relative shrink-0 group/cover">
        <CoverImage
          images={track.album?.images}
          alt={`${track.name} cover`}
          size="sm"
        />

        {!selectionMode && onPlay && (
          <button
            type="button"
            onClick={handlePlayClick}
            disabled={playbackLoading}
            className={`absolute inset-0 flex items-center justify-center rounded-lg border transition ${
              isCurrentTrack
                ? "bg-green-500/80 text-black border-green-300 opacity-100"
                : "bg-black/55 text-white border-white/10 opacity-0 group-hover/cover:opacity-100 hover:bg-black/70"
            } disabled:cursor-not-allowed disabled:opacity-50`}
            title="Play song"
            aria-label={`Play ${track.name}`}
          >
            <span className="translate-x-[1px] text-sm">▶</span>
          </button>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{track.name}</p>

          {recentlyAdded && (
            <span className="shrink-0 rounded-full border border-green-400/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-300">
              New
            </span>
          )}
        </div>

        <p className="text-sm text-zinc-400 truncate">
          {track.artists
            ?.map((artist) => artist.name)
            .filter(Boolean)
            .join(", ")}
        </p>

        {addedLabel && (
          <p className="mt-1 text-xs text-zinc-500">{addedLabel}</p>
        )}
      </div>

      {!selectionMode && onRemove && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className="h-8 w-8 rounded-lg bg-red-500/10 cursor-pointer text-red-300 border border-red-400/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500/20 transition shrink-0"
          title="Remove song"
          aria-label={`Remove ${track.name}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
