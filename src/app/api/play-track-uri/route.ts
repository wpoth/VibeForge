type SpotifyPlayResponse = {
    error?: {
        status?: number;
        message?: string;
    };
};

export async function POST(req: Request) {
    try {
        const {
            accessToken,
            trackUri,
            deviceId,
        }: {
            accessToken?: string;
            trackUri?: string;
            deviceId?: string;
        } = await req.json();

        if (!accessToken) {
            return Response.json(
                { error: true, message: "Missing access token" },
                { status: 400 },
            );
        }

        if (
            !trackUri ||
            typeof trackUri !== "string" ||
            !trackUri.startsWith("spotify:track:")
        ) {
            return Response.json(
                { error: true, message: "Missing or invalid track URI" },
                { status: 400 },
            );
        }

        const url = new URL("https://api.spotify.com/v1/me/player/play");

        if (deviceId) {
            url.searchParams.set("device_id", deviceId);
        }

        const res = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                uris: [trackUri],
                position_ms: 0,
            }),
        });

        if (res.status === 204) {
            return Response.json({
                success: true,
            });
        }

        const text = await res.text();

        let data: SpotifyPlayResponse | { rawText: string };

        try {
            data = text ? (JSON.parse(text) as SpotifyPlayResponse) : {};
        } catch {
            data = { rawText: text };
        }

        return Response.json(
            {
                error: true,
                message:
                    "error" in data && data.error?.message
                        ? data.error.message
                        : `Failed to start playback. Spotify returned ${res.status}.`,
                details: data,
            },
            { status: res.status },
        );
    } catch (error) {
        console.error("Play track URI route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error ? error.message : "Failed to start playback",
            },
            { status: 500 },
        );
    }
}