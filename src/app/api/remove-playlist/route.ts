type SpotifyRemoveLibraryResponse = {
  error?: {
    status?: number;
    message?: string;
  };
};

export async function POST(req: Request) {
  try {
    const { accessToken, playlistId } = await req.json();

    if (!accessToken) {
      return Response.json(
        { error: true, message: "Missing access token" },
        { status: 400 }
      );
    }

    if (!playlistId || typeof playlistId !== "string") {
      return Response.json(
        { error: true, message: "Missing playlist ID" },
        { status: 400 }
      );
    }

    const playlistUri = `spotify:playlist:${playlistId}`;

    const res: globalThis.Response = await fetch(
      "https://api.spotify.com/v1/me/library",
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [playlistUri],
        }),
      }
    );

    if (res.status === 204) {
      return Response.json({
        success: true,
        removedPlaylistId: playlistId,
      });
    }

    const data = (await res.json()) as SpotifyRemoveLibraryResponse;

    if (!res.ok) {
      return Response.json(
        {
          error: true,
          message:
            data?.error?.message ??
            `Failed to remove playlist. Spotify returned ${res.status}.`,
          details: data,
        },
        { status: res.status }
      );
    }

    return Response.json({
      success: true,
      removedPlaylistId: playlistId,
    });
  } catch (error) {
    console.error("Remove playlist route error:", error);

    return Response.json(
      {
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove playlist",
      },
      { status: 500 }
    );
  }
}