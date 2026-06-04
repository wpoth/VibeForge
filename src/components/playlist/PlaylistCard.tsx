import { CoverImage } from "@/components/common/CoverImage";
import type { SpotifyPlaylist } from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";

type PlaylistCardProps = {
  playlist: SpotifyPlaylist;
  isSelected: boolean;
  onClick: () => void;
};

export function PlaylistCard({
  playlist,
  isSelected,
  onClick,
}: PlaylistCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-xl mb-2 cursor-pointer transition flex gap-3 border ${
        isSelected
          ? "bg-green-500/10 border-green-400/40 shadow-lg shadow-green-500/10"
          : "bg-white/[0.04] border-white/5 hover:bg-white/[0.08] hover:border-white/10"
      }`}
    >
      <CoverImage images={playlist.images} alt={`${playlist.name} cover`} />

      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-sm font-medium truncate">{playlist.name}</p>

        <p className="text-xs text-zinc-500">
          {getPlaylistTrackCount(playlist)} tracks
        </p>
      </div>
    </div>
  );
}