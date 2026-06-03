export type TrackDTO = {
  id: string;
  name: string;
  artists: string[];
  album?: string;
};

export type PlaylistDTO = {
  id: string;
  name: string;
  description: string;
  image?: string | null;
  trackCount?: number;
  tracks?: TrackDTO[];
};

/**
 * Core Spotify request helper
 * - Handles auth
 * - Handles errors consistently
 * - Prevents silent crashes
 */
async function spotifyRequest(endpoint: string, accessToken: string) {
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let data: any;

  try {
    data = await res.json();
  } catch {
    throw new Error(`Spotify returned invalid JSON at ${endpoint}`);
  }

  if (!res.ok) {
    throw new Error(
      `Spotify error ${res.status}: ${
        data?.error?.message || JSON.stringify(data)
      }`
    );
  }

  return data;
}

/**
 * GET /me
 */
export async function getSpotifyProfile(accessToken: string) {
  return spotifyRequest("/me", accessToken);
}

/**
 * GET /me/playlists (normalized DTO)
 */
export async function getUserPlaylists(accessToken: string) {
  const data = await spotifyRequest("/me/playlists", accessToken);

  const playlists: PlaylistDTO[] = (data.items ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    image: p.images?.[0]?.url ?? null,
    trackCount: p.tracks?.total ?? 0,
  }));

  return { playlists };
}

/**
 * GET /playlists/{id}/tracks
 * Fully normalized into TrackDTO[]
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string
): Promise<TrackDTO[]> {
  let tracks: TrackDTO[] = [];

  let url: string | null =
    `/playlists/${playlistId}/tracks?limit=100&market=NL`;

  while (url) {
    const data = await spotifyRequest(url, accessToken);

    if (!Array.isArray(data?.items)) {
      throw new Error("Invalid Spotify response: missing items array");
    }

    const mapped: TrackDTO[] = data.items
      .map((item: any) => item.track)
      .filter(Boolean)
      .map((track: any) => ({
        id: track.id,
        name: track.name,
        artists: track.artists?.map((a: any) => a.name) ?? [],
        album: track.album?.name ?? undefined,
      }));

    tracks.push(...mapped);

    // Spotify pagination safety
    if (data.next) {
      url = data.next.replace("https://api.spotify.com/v1", "");
    } else {
      url = null;
    }
  }

  return tracks;
}

/**
 * Generic Spotify fetch (only use if needed internally)
 */
export async function spotifyFetch(endpoint: string, accessToken: string) {
  return spotifyRequest(endpoint, accessToken);
}