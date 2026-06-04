import type {
  SpotifyImage,
  SpotifyPlaylistItem,
  SpotifyTrack,
} from "@/lib/spotify-types";

export function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unknown error";
}

export function getTrackFromPlaylistItem(
  item: SpotifyPlaylistItem
): SpotifyTrack | null {
  return item.item ?? item.track ?? null;
}

export function getBestImage(images?: SpotifyImage[]) {
  return images?.[0]?.url ?? null;
}

export function getPlaylistTrackCount(playlist: {
  items?: { total?: number };
  tracks?: { total?: number };
}) {
  return playlist.items?.total ?? playlist.tracks?.total ?? 0;
}