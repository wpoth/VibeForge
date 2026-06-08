type SpotifyQueueResponse = {
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
                { status: 400 }
            );
        }

        if (
            !trackUri ||
            typeof trackUri !== "string" ||
            !trackUri.startsWith("spotify:track:")
        ) {
            return Response.json(
                { error: true, message: "Missing or invalid track URI" },
                { status: 400 }
            );
        }

        const url = new URL("https://api.spotify.com/v1/me/player/queue");
        url.searchParams.set("uri", trackUri);

        if (deviceId) {
            url.searchParams.set("device_id", deviceId);
        }

        const res: globalThis.Response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (res.status === 204 || res.status === 200) {
            return Response.json({
                success: true,
            });
        }

        const text = await res.text();

        let data: SpotifyQueueResponse | { rawText: string };

        try {
            data = text ? (JSON.parse(text) as SpotifyQueueResponse) : {};
        } catch {
            data = { rawText: text };
        }

        return Response.json(
            {
                error: true,
                message:
                    "error" in data && data.error?.message
                        ? data.error.message
                        : `Failed to add song to queue. Spotify returned ${res.status}.`,
                details: data,
            },
            { status: res.status }
        );
    } catch (error) {
        console.error("Add to queue route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to add song to queue",
            },
            { status: 500 }
        );
    }
}