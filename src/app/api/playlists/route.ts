import {
  LIKED_SONGS_PLAYLIST_ID,
  type SpotifyPlaylist,
} from "@/lib/spotify-types";
import { getSavedTrackCount } from "@/lib/spotify";

type SpotifyUserResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

type SpotifyPlaylistFromApi = {
  id: string;
  name: string;
  collaborative?: boolean;
  public?: boolean | null;
  owner?: {
    id?: string;
    display_name?: string;
  };
  images?: SpotifyImage[];
  external_urls?: {
    spotify?: string;
  };
  items?: {
    total?: number;
  };
  tracks?: {
    total?: number;
  };
};

type SpotifyPlaylistsResponse = {
  items?: SpotifyPlaylistFromApi[];
  next?: string | null;
  error?: {
    message?: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accessToken = body?.accessToken;

    if (!accessToken) {
      return Response.json(
        {
          error: true,
          message: "Missing access token",
        },
        { status: 400 },
      );
    }

    const meRes: globalThis.Response = await fetch(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const meData = (await meRes.json()) as SpotifyUserResponse;

    if (!meRes.ok || !meData.id) {
      return Response.json(
        {
          error: true,
          message: meData?.error?.message ?? "Failed to fetch Spotify user",
          details: meData,
        },
        { status: meRes.status },
      );
    }

    const spotifyId = meData.id;
    const allPlaylists: SpotifyPlaylistFromApi[] = [];

    let url: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";

    while (url) {
      const res: globalThis.Response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await res.json()) as SpotifyPlaylistsResponse;

      if (!res.ok) {
        return Response.json(
          {
            error: true,
            message: data?.error?.message ?? "Failed to fetch playlists",
            details: data,
          },
          { status: res.status },
        );
      }

      allPlaylists.push(...(data.items ?? []));
      url = data.next ?? null;
    }

    const filtered = allPlaylists.filter((playlist) => {
      const isOwner = playlist.owner?.id === spotifyId;
      const isCollaborative = playlist.collaborative === true;

      return isOwner || isCollaborative;
    });

    let likedSongsTotal = 0;

    try {
      likedSongsTotal = await getSavedTrackCount(accessToken);
    } catch (error) {
      console.warn("Could not load liked songs count:", error);
    }

    const likedSongsPlaylist: SpotifyPlaylist = {
      id: LIKED_SONGS_PLAYLIST_ID,
      name: "Liked Songs",
      images: [],
      external_urls: {
        spotify: "https://open.spotify.com/collection/tracks",
      },
      tracks: {
        total: likedSongsTotal,
      },
      isLikedSongs: true,
    };

    return Response.json({
      items: [likedSongsPlaylist, ...filtered],
      total: filtered.length + 1,
      hidden: allPlaylists.length - filtered.length,
    });
  } catch (error) {
    console.error("Playlist route error:", error);

    return Response.json(
      {
        error: true,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}