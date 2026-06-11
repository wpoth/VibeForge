import { PlaylistCardSkeleton } from "@/components/common/Skeletons";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import type { SpotifyPlaylist } from "@/lib/spotify-types";
import { AnimatePresence, motion } from "motion/react";

type SidebarProps = {
  playlists: SpotifyPlaylist[];
  playlistsLoaded: boolean;
  hiddenPlaylists: number;
  selectedPlaylist: SpotifyPlaylist | null;
  onPlaylistClick: (playlist: SpotifyPlaylist) => void;
  onPlaylistRemove: (playlist: SpotifyPlaylist) => void;
  onPlaylistPlay: (playlist: SpotifyPlaylist) => void;
};

export function Sidebar({
  playlists,
  playlistsLoaded,
  hiddenPlaylists,
  selectedPlaylist,
  onPlaylistClick,
  onPlaylistRemove,
  onPlaylistPlay,
}: SidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24 }}
      className="custom-sidebar-scrollbar relative z-20 mt-[104px] w-full overflow-x-hidden border-b border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:mt-14 lg:fixed lg:left-0 lg:top-14 lg:mt-0 lg:h-[calc(100vh-56px)] lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05 }}
        className="mb-4 lg:mb-5"
      >
        <h2 className="text-lg font-semibold">Playlists</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Owned and collaborative playlists
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!playlistsLoaded && (
          <motion.div
            key="playlist-skeletons"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-x-visible lg:pb-0"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <PlaylistCardSkeleton key={index} />
            ))}
          </motion.div>
        )}

        {playlistsLoaded && playlists.length === 0 && (
          <motion.div
            key="no-playlists"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <p className="text-sm font-medium text-white">No playlists found</p>
            <p className="mt-1 text-xs text-zinc-500">
              Create or follow a playlist in Spotify first.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playlistsLoaded && hiddenPlaylists > 0 && (
          <motion.div
            key="hidden-playlists-warning"
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3"
          >
            <p className="text-xs text-zinc-400">
              {hiddenPlaylists} playlists are hidden because Spotify does not
              allow reading tracks from playlists you do not own or collaborate
              on.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playlistsLoaded && playlists.length > 0 && (
          <motion.div
            key="playlist-list"
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="flex gap-3 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-x-visible lg:pb-0"
          >
            <AnimatePresence initial={false}>
              {playlists.map((playlist, index) => (
                <motion.div
                  key={playlist.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10, height: 0 }}
                  transition={{
                    opacity: { duration: 0.16 },
                    x: { duration: 0.18, delay: Math.min(index * 0.015, 0.12) },
                    layout: { duration: 0.2 },
                  }}
                >
                  <PlaylistCard
                    playlist={playlist}
                    isSelected={selectedPlaylist?.id === playlist.id}
                    onClick={() => onPlaylistClick(playlist)}
                    onRemove={() => onPlaylistRemove(playlist)}
                    onPlay={() => onPlaylistPlay(playlist)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}