import { CoverImage } from "@/components/common/CoverImage";
import type { SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getTrackFromPlaylistItem } from "@/lib/ui-helpers";

type TrackRowProps = {
  playlistItem: SpotifyPlaylistItem;
  index: number;
};

export function TrackRow({ playlistItem, index }: TrackRowProps) {
  const track = getTrackFromPlaylistItem(playlistItem);
  if (!track) return null;

  return (
    <div
      key={track.id ?? index}
      className="p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition flex items-center gap-3"
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
    </div>
  );
}