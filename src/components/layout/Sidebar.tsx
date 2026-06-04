import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import type { SpotifyPlaylist } from "@/lib/spotify-types";

type SidebarProps = {
  playlists: SpotifyPlaylist[];
  playlistsLoaded: boolean;
  hiddenPlaylists: number;
  selectedPlaylist: SpotifyPlaylist | null;
  onPlaylistClick: (playlist: SpotifyPlaylist) => void;
};

export function Sidebar({
  playlists,
  playlistsLoaded,
  hiddenPlaylists,
  selectedPlaylist,
  onPlaylistClick,
}: SidebarProps) {
  return (
    <aside className="custom-sidebar-scrollbar relative z-20 mt-14 w-full border-b border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 overflow-x-hidden lg:fixed lg:left-0 lg:top-14 lg:mt-0 lg:h-[calc(100vh-56px)] lg:w-80 lg:border-b-0 lg:border-r lg:overflow-y-auto">
      <div className="mb-4 lg:mb-5">
        <h2 className="text-lg font-semibold">Playlists</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Owned and collaborative playlists
        </p>
      </div>

      {!playlistsLoaded && (
        <p className="text-sm text-zinc-500">Loading playlists...</p>
      )}

      {playlistsLoaded && playlists.length === 0 && (
        <p className="text-sm text-zinc-500">No playlists found.</p>
      )}

      {playlistsLoaded && hiddenPlaylists > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/10">
          <p className="text-xs text-zinc-400">
            {hiddenPlaylists} playlists are hidden because Spotify does not
            allow reading tracks from playlists you do not own or collaborate
            on.
          </p>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2 lg:block lg:overflow-x-visible lg:pb-0">
        {playlists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            isSelected={selectedPlaylist?.id === playlist.id}
            onClick={() => onPlaylistClick(playlist)}
          />
        ))}
      </div>
    </aside>
  );
}