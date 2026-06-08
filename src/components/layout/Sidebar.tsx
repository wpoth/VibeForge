import { PlaylistCardSkeleton } from "@/components/common/Skeletons";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import type { SpotifyPlaylist } from "@/lib/spotify-types";

type SidebarProps = {
  playlists: SpotifyPlaylist[];
  playlistsLoaded: boolean;
  hiddenPlaylists: number;
  selectedPlaylist: SpotifyPlaylist | null;
  onPlaylistClick: (playlist: SpotifyPlaylist) => void;
  onPlaylistRemove: (playlist: SpotifyPlaylist) => void;
};

export function Sidebar({
  playlists,
  playlistsLoaded,
  hiddenPlaylists,
  selectedPlaylist,
  onPlaylistClick,
  onPlaylistRemove,
}: SidebarProps) {
  return (
    <aside className="custom-sidebar-scrollbar relative z-20 mt-14 w-full overflow-x-hidden border-b border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl lg:fixed lg:left-0 lg:top-14 lg:mt-0 lg:h-[calc(100vh-56px)] lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="mb-4 lg:mb-5">
        <h2 className="text-lg font-semibold">Playlists</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Owned and collaborative playlists
        </p>
      </div>

      {!playlistsLoaded && (
        <div className="flex gap-3 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-x-visible lg:pb-0">
          {Array.from({ length: 8 }).map((_, index) => (
            <PlaylistCardSkeleton key={index} />
          ))}
        </div>
      )}

      {playlistsLoaded && playlists.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm font-medium text-white">No playlists found</p>
          <p className="mt-1 text-xs text-zinc-500">
            Create or follow a playlist in Spotify first.
          </p>
        </div>
      )}

      {playlistsLoaded && hiddenPlaylists > 0 && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-zinc-400">
            {hiddenPlaylists} playlists are hidden because Spotify does not
            allow reading tracks from playlists you do not own or collaborate
            on.
          </p>
        </div>
      )}

      {playlistsLoaded && playlists.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-x-visible lg:pb-0">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              isSelected={selectedPlaylist?.id === playlist.id}
              onClick={() => onPlaylistClick(playlist)}
              onRemove={() => onPlaylistRemove(playlist)}
            />
          ))}
        </div>
      )}
    </aside>
  );
}