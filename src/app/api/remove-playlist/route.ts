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

        const url = new URL("https://api.spotify.com/v1/me/library");
        url.searchParams.set("uris", playlistUri);

        const res: globalThis.Response = await fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (res.status === 204 || res.status === 200) {
            return Response.json({
                success: true,
                removedPlaylistId: playlistId,
            });
        }

        const data = (await res.json()) as SpotifyRemoveLibraryResponse;

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