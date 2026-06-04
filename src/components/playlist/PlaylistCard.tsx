import { CoverImage } from "@/components/common/CoverImage";
import type { SpotifyPlaylist } from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";

type PlaylistCardProps = {
  playlist: SpotifyPlaylist;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
};

export function PlaylistCard({
  playlist,
  isSelected,
  onClick,
  onRemove,
}: PlaylistCardProps) {
  function handleRemoveClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onRemove();
  }

  return (
    <div
      onClick={onClick}
      className={`group relative min-w-56 max-w-56 p-3 rounded-xl cursor-pointer transition flex gap-3 border lg:min-w-0 lg:max-w-none lg:mb-2 ${
        isSelected
          ? "bg-green-500/10 border-green-400/40 shadow-lg shadow-green-500/10"
          : "bg-white/[0.04] border-white/5 hover:bg-white/[0.08] hover:border-white/10"
      }`}
    >
      <CoverImage images={playlist.images} alt={`${playlist.name} cover`} />

      <div className="min-w-0 flex-1 flex flex-col justify-center pr-8">
        <p className="text-sm font-medium truncate">{playlist.name}</p>

        <p className="text-xs text-zinc-500">
          {getPlaylistTrackCount(playlist)} tracks
        </p>
      </div>

      <button
        type="button"
        onClick={handleRemoveClick}
        className="absolute right-2 cursor-pointer top-2 h-7 w-7 rounded-lg bg-red-500/10 text-red-300 border border-red-400/20 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-500/20 transition"
        title="Remove playlist"
        aria-label={`Remove ${playlist.name}`}
      >
        ×
      </button>
    </div>
  );
}