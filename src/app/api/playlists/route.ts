type SpotifyPlaylist = {
  id: string;
  name: string;
  collaborative?: boolean;
  public?: boolean | null;
  owner?: {
    id?: string;
    display_name?: string;
  };
  items?: {
    total?: number;
  };
  tracks?: {
    total?: number;
  };
  images?: {
    url: string;
    height?: number | null;
    width?: number | null;
  }[];
};

type SpotifyPlaylistsResponse = {
  items?: SpotifyPlaylist[];
  next?: string | null;
  error?: {
    message?: string;
  };
};

export async function POST(req: Request) {
  try {
    const { accessToken, spotifyId } = await req.json();

    if (!accessToken) {
      return Response.json(
        { error: "Missing access token" },
        { status: 401 }
      );
    }

    if (!spotifyId) {
      return Response.json(
        { error: "Missing Spotify user ID" },
        { status: 400 }
      );
    }

    const allPlaylists: SpotifyPlaylist[] = [];

    let url: string | null =
      "https://api.spotify.com/v1/me/playlists?limit=50";

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
            error: data?.error?.message ?? "Failed to fetch playlists",
            details: data,
          },
          { status: res.status }
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

    return Response.json({
      items: filtered,
      total: filtered.length,
      hidden: allPlaylists.length - filtered.length,
    });
  } catch (error) {
    console.error("Playlist route error:", error);

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}