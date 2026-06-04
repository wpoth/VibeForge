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
    <div className="custom-sidebar-scrollbar fixed left-0 top-14 h-[calc(100vh-56px)] w-80 bg-white/[0.03] backdrop-blur-xl border-r border-white/10 p-4 overflow-y-auto z-20">
      <div className="mb-5">
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

      {playlists.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          isSelected={selectedPlaylist?.id === playlist.id}
          onClick={() => onPlaylistClick(playlist)}
        />
      ))}
    </div>
  );
}