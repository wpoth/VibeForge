type SpotifyImage = {
  url: string;
  height?: number | null;
  width?: number | null;
};

type SpotifyCurrentlyPlayingResponse = {
  is_playing?: boolean;
  item?: {
    id?: string;
    name?: string;
    uri?: string;
    album?: {
      name?: string;
      images?: SpotifyImage[];
    };
    artists?: {
      name?: string;
    }[];
  } | null;
  error?: {
    status?: number;
    message?: string;
  };
};

export async function POST(req: Request) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return Response.json(
        { error: true, message: "Missing access token" },
        { status: 400 }
      );
    }

    const res: globalThis.Response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.status === 204) {
      return Response.json({
        isPlaying: false,
        track: null,
      });
    }

    const data = (await res.json()) as SpotifyCurrentlyPlayingResponse;

    if (!res.ok) {
      return Response.json(
        {
          error: true,
          message:
            data?.error?.message ??
            `Failed to load currently playing track. Spotify returned ${res.status}.`,
          details: data,
        },
        { status: res.status }
      );
    }

    const imageUrl = data.item?.album?.images?.[0]?.url ?? null;

    return Response.json({
      isPlaying: Boolean(data.is_playing),
      track: data.item
        ? {
            id: data.item.id,
            uri: data.item.uri,
            title: data.item.name,
            album: data.item.album?.name,
            imageUrl,
            artists:
              data.item.artists?.map((artist) => artist.name).filter(Boolean) ??
              [],
          }
        : null,
    });
  } catch (error) {
    console.error("Currently playing route error:", error);

    return Response.json(
      {
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load currently playing track",
      },
      { status: 500 }
    );
  }
}