import { CoverImage } from "@/components/common/CoverImage";
import type { SpotifyPlaylist } from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";
import { motion } from "motion/react";

type PlaylistCardProps = {
  playlist: SpotifyPlaylist;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
  onPlay: () => void;
};

export function PlaylistCard({
  playlist,
  isSelected,
  onClick,
  onRemove,
  onPlay,
}: PlaylistCardProps) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`group min-w-56 max-w-56 rounded-xl border p-3 text-left transition lg:min-w-0 lg:max-w-none ${isSelected
          ? "border-green-400/40 bg-green-500/10"
          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
        }`}
    >
      <div className="flex items-center gap-3">
        <div className="group/cover relative shrink-0">
          <CoverImage
            images={playlist.images}
            alt={`${playlist.name} cover`}
            size="sm"
          />

          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={(event) => {
              event.stopPropagation();
              onPlay();
            }}
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/55 opacity-0 transition group-hover/cover:opacity-100"
            aria-label={`Play ${playlist.name}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 pl-0.5 text-xs text-black shadow-lg shadow-green-500/30">
              ▶
            </span>
          </motion.button>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {playlist.name}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {getPlaylistTrackCount(playlist)} tracks
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="shrink-0 rounded-lg px-2 py-1 text-xs text-zinc-500 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
          aria-label={`Remove ${playlist.name}`}
        >
          Remove
        </motion.button>
      </div>
    </motion.button>
  );
}