type SpotifyPlayResponse = {
    error?: {
        status?: number;
        message?: string;
    };
};

export async function POST(req: Request) {
    try {
        const { accessToken, trackUri } = await req.json();

        if (!accessToken) {
            return Response.json(
                { error: true, message: "Missing access token" },
                { status: 400 }
            );
        }

        if (!trackUri || typeof trackUri !== "string") {
            return Response.json(
                { error: true, message: "Missing track URI" },
                { status: 400 }
            );
        }

        const res: globalThis.Response = await fetch(
            "https://api.spotify.com/v1/me/player/play",
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uris: [trackUri],
                }),
            }
        );

        if (res.status === 204) {
            return Response.json({
                success: true,
            });
        }

        const data = (await res.json()) as SpotifyPlayResponse;

        return Response.json(
            {
                error: true,
                message:
                    data?.error?.message ??
                    `Failed to start playback. Spotify returned ${res.status}.`,
                details: data,
            },
            { status: res.status }
        );
    } catch (error) {
        console.error("Play track route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error ? error.message : "Failed to start playback",
            },
            { status: 500 }
        );
    }
}