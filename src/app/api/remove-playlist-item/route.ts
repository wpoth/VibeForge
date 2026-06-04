type SpotifyRemovePlaylistItemsResponse = {
  snapshot_id?: string;
  error?: {
    status?: number;
    message?: string;
  };
};

export async function POST(req: Request) {
  try {
    const { accessToken, playlistId, itemUri, itemUris } = await req.json();

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

    const uris: string[] = Array.isArray(itemUris)
      ? itemUris
      : itemUri
        ? [itemUri]
        : [];

    const validUris = uris.filter(
      (uri) => typeof uri === "string" && uri.startsWith("spotify:")
    );

    if (!validUris.length) {
      return Response.json(
        { error: true, message: "Missing item URI(s)" },
        { status: 400 }
      );
    }

    const res: globalThis.Response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/items`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: validUris.map((uri) => ({ uri })),
        }),
      }
    );

    const data = (await res.json()) as SpotifyRemovePlaylistItemsResponse;

    if (!res.ok) {
      return Response.json(
        {
          error: true,
          message:
            data?.error?.message ??
            `Failed to remove item(s). Spotify returned ${res.status}.`,
          details: data,
        },
        { status: res.status }
      );
    }

    return Response.json({
      success: true,
      removedItemUris: validUris,
      removedCount: validUris.length,
      snapshotId: data.snapshot_id,
    });
  } catch (error) {
    console.error("Remove playlist item route error:", error);

    return Response.json(
      {
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove playlist item(s)",
      },
      { status: 500 }
    );
  }
}