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

type SpotifyPlaylist = {
  id: string;
  name: string;
  collaborative?: boolean;
  public?: boolean | null;
  owner?: {
    id?: string;
    display_name?: string;
  };
  images?: SpotifyImage[];
  items?: {
    total?: number;
  };
  tracks?: {
    total?: number;
  };
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
    const body = await req.json();
    const accessToken = body?.accessToken;

    if (!accessToken) {
      return Response.json(
        {
          error: true,
          message: "Missing access token",
        },
        { status: 400 }
      );
    }

    const meRes: globalThis.Response = await fetch(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const meData = (await meRes.json()) as SpotifyUserResponse;

    if (!meRes.ok || !meData.id) {
      return Response.json(
        {
          error: true,
          message: meData?.error?.message ?? "Failed to fetch Spotify user",
          details: meData,
        },
        { status: meRes.status }
      );
    }

    const spotifyId = meData.id;
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
            error: true,
            message: data?.error?.message ?? "Failed to fetch playlists",
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
      {
        error: true,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}