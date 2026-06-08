type SpotifyCurrentlyPlayingResponse = {
  is_playing?: boolean;
  progress_ms?: number | null;
  item?: {
    id?: string;
    uri?: string;
    name?: string;
    duration_ms?: number;
    external_urls?: {
      spotify?: string;
    };
    artists?: {
      name?: string;
    }[];
    album?: {
      name?: string;
      images?: {
        url: string;
        height?: number | null;
        width?: number | null;
      }[];
    };
  } | null;
  error?: {
    status?: number;
    message?: string;
  };
};

export async function POST(req: Request) {
  try {
    const {
      accessToken,
    }: {
      accessToken?: string;
    } = await req.json();

    if (!accessToken) {
      return Response.json(
        {
          error: true,
          message: "Missing access token",
        },
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
        success: true,
        currentlyPlaying: null,
        isPlaying: false,
      });
    }

    const text = await res.text();

    if (!text) {
      return Response.json({
        success: true,
        currentlyPlaying: null,
        isPlaying: false,
      });
    }

    let data: SpotifyCurrentlyPlayingResponse | { rawText: string };

    try {
      data = JSON.parse(text) as SpotifyCurrentlyPlayingResponse;
    } catch {
      data = { rawText: text };
    }

    if (!res.ok) {
      return Response.json(
        {
          error: true,
          message:
            "error" in data && data.error?.message
              ? data.error.message
              : `Failed to fetch currently playing track. Spotify returned ${res.status}.`,
          details: data,
        },
        { status: res.status }
      );
    }

    if ("rawText" in data || !data.item) {
      return Response.json({
        success: true,
        currentlyPlaying: null,
        isPlaying: false,
      });
    }

    const track = data.item;

    return Response.json({
      success: true,
      isPlaying: Boolean(data.is_playing),
      currentlyPlaying: {
        id: track.id,
        uri: track.uri,
        title: track.name,
        artists:
          track.artists
            ?.map((artist) => artist.name)
            .filter((name): name is string => Boolean(name)) ?? [],
        album: track.album?.name,
        imageUrl: track.album?.images?.[0]?.url ?? null,
        progressMs: data.progress_ms ?? 0,
        durationMs: track.duration_ms ?? 0,
        spotifyUrl: track.external_urls?.spotify,
      },
    });
  } catch (error) {
    console.error("Currently playing route error:", error);

    return Response.json(
      {
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch currently playing track",
      },
      { status: 500 }
    );
  }
}