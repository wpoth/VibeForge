type PlayerControlAction = "next" | "previous" | "pause" | "resume";

type SpotifyPlayerControlResponse = {
    error?: {
        status?: number;
        message?: string;
    };
};

const ACTION_ENDPOINTS: Record<
    PlayerControlAction,
    {
        method: "POST" | "PUT";
        endpoint: string;
    }
> = {
    next: {
        method: "POST",
        endpoint: "https://api.spotify.com/v1/me/player/next",
    },
    previous: {
        method: "POST",
        endpoint: "https://api.spotify.com/v1/me/player/previous",
    },
    pause: {
        method: "PUT",
        endpoint: "https://api.spotify.com/v1/me/player/pause",
    },
    resume: {
        method: "PUT",
        endpoint: "https://api.spotify.com/v1/me/player/play",
    },
};

export async function POST(req: Request) {
    try {
        const {
            accessToken,
            action,
            deviceId,
        }: {
            accessToken?: string;
            action?: PlayerControlAction;
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

        if (!action || !(action in ACTION_ENDPOINTS)) {
            return Response.json(
                {
                    error: true,
                    message: "Invalid player control action",
                },
                { status: 400 }
            );
        }

        const config = ACTION_ENDPOINTS[action];
        const url = new URL(config.endpoint);

        if (deviceId) {
            url.searchParams.set("device_id", deviceId);
        }

        const res: globalThis.Response = await fetch(url, {
            method: config.method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (res.status === 204 || res.status === 200) {
            return Response.json({
                success: true,
            });
        }

        const text = await res.text();

        let data: SpotifyPlayerControlResponse | { rawText: string };

        try {
            data = text ? (JSON.parse(text) as SpotifyPlayerControlResponse) : {};
        } catch {
            data = { rawText: text };
        }

        return Response.json(
            {
                error: true,
                message:
                    "error" in data && data.error?.message
                        ? data.error.message
                        : `Failed to control playback. Spotify returned ${res.status}.`,
                details: data,
            },
            { status: res.status }
        );
    } catch (error) {
        console.error("Player control route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error ? error.message : "Failed to control playback",
            },
            { status: 500 }
        );
    }
}