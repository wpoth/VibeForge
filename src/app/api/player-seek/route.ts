type SpotifySeekResponse = {
    error?: {
        status?: number;
        message?: string;
    };
};

export async function POST(req: Request) {
    try {
        const {
            accessToken,
            positionMs,
            deviceId,
        }: {
            accessToken?: string;
            positionMs?: number;
            deviceId?: string;
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

        if (
            typeof positionMs !== "number" ||
            !Number.isFinite(positionMs) ||
            positionMs < 0
        ) {
            return Response.json(
                {
                    error: true,
                    message: "Missing or invalid seek position",
                },
                { status: 400 }
            );
        }

        const url = new URL("https://api.spotify.com/v1/me/player/seek");
        url.searchParams.set("position_ms", String(Math.floor(positionMs)));

        if (deviceId) {
            url.searchParams.set("device_id", deviceId);
        }

        const res: globalThis.Response = await fetch(url, {
            method: "PUT",
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

        let data: SpotifySeekResponse | { rawText: string };

        try {
            data = text ? (JSON.parse(text) as SpotifySeekResponse) : {};
        } catch {
            data = { rawText: text };
        }

        return Response.json(
            {
                error: true,
                message:
                    "error" in data && data.error?.message
                        ? data.error.message
                        : `Failed to seek playback. Spotify returned ${res.status}.`,
                details: data,
            },
            { status: res.status }
        );
    } catch (error) {
        console.error("Player seek route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error ? error.message : "Failed to seek playback",
            },
            { status: 500 }
        );
    }
}