import { LIKED_SONGS_PLAYLIST_ID } from "@/lib/spotify-types";

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
            playlistId,
            deviceId,
        }: {
            accessToken?: string;
            trackUri?: string;
            playlistId?: string;
            deviceId?: string;
        } = await req.json();

        if (!accessToken) {
            return Response.json(
                { error: true, message: "Missing access token" },
                { status: 400 },
            );
        }

        if (!playlistId || typeof playlistId !== "string") {
            return Response.json(
                { error: true, message: "Missing playlist ID" },
                { status: 400 },
            );
        }

        if (
            trackUri &&
            (typeof trackUri !== "string" || !trackUri.startsWith("spotify:track:"))
        ) {
            return Response.json(
                { error: true, message: "Invalid track URI" },
                { status: 400 },
            );
        }

        if (playlistId === LIKED_SONGS_PLAYLIST_ID && !trackUri) {
            return Response.json(
                {
                    error: true,
                    message:
                        "Spotify does not expose Liked Songs as a playable playlist context. Open Liked Songs and start a specific song instead.",
                },
                { status: 400 },
            );
        }

        const url = new URL("https://api.spotify.com/v1/me/player/play");

        if (deviceId) {
            url.searchParams.set("device_id", deviceId);
        }

        const body =
            playlistId === LIKED_SONGS_PLAYLIST_ID
                ? {
                    uris: trackUri ? [trackUri] : [],
                    position_ms: 0,
                }
                : trackUri
                    ? {
                        context_uri: `spotify:playlist:${playlistId}`,
                        offset: {
                            uri: trackUri,
                        },
                        position_ms: 0,
                    }
                    : {
                        context_uri: `spotify:playlist:${playlistId}`,
                        position_ms: 0,
                    };

        const res: globalThis.Response = await fetch(url, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
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
        console.error("Play route error:", error);

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