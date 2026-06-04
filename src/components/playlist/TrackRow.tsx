import { CoverImage } from "@/components/common/CoverImage";
import type { SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getTrackFromPlaylistItem } from "@/lib/ui-helpers";

type TrackRowProps = {
  playlistItem: SpotifyPlaylistItem;
  index: number;
  onRemove?: (playlistItem: SpotifyPlaylistItem) => void;
};

export function TrackRow({ playlistItem, index, onRemove }: TrackRowProps) {
  const track = getTrackFromPlaylistItem(playlistItem);
  if (!track) return null;

  function handleRemoveClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onRemove?.(playlistItem);
  }

  return (
    <div
      key={track.id ?? index}
      className="group p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition flex items-center gap-3"
    >
      <CoverImage
        images={track.album?.images}
        alt={`${track.name} cover`}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{track.name}</p>
        <p className="text-sm text-zinc-400 truncate">
          {track.artists
            ?.map((artist) => artist.name)
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className="h-8 w-8 rounded-lg bg-red-500/10 text-red-300 border border-red-400/20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-500/20 transition shrink-0"
          title="Remove song"
          aria-label={`Remove ${track.name}`}
        >
          ×
        </button>
      )}
    </div>
  );
}