type SpotifyAddItemsResponse = {
    snapshot_id?: string;
    error?: {
        status?: number;
        message?: string;
        reason?: string;
    };
};

type AddTrackToPlaylistRequest = {
    accessToken?: string;
    playlistId?: string;
    trackUri?: string;
};

function isSpotifyTrackUri(uri: string) {
    return /^spotify:track:[A-Za-z0-9]+$/.test(uri);
}

export async function POST(req: Request) {
    try {
        const { accessToken, playlistId, trackUri } =
            (await req.json()) as AddTrackToPlaylistRequest;

        if (!accessToken) {
            return Response.json(
                {
                    error: true,
                    message: "Missing access token.",
                },
                { status: 400 },
            );
        }

        if (!playlistId || typeof playlistId !== "string") {
            return Response.json(
                {
                    error: true,
                    message: "Missing playlist ID.",
                },
                { status: 400 },
            );
        }

        if (!trackUri || typeof trackUri !== "string") {
            return Response.json(
                {
                    error: true,
                    message: "Missing track URI.",
                },
                { status: 400 },
            );
        }

        if (trackUri.startsWith("spotify:local:")) {
            return Response.json(
                {
                    error: true,
                    message:
                        "This is a local Spotify file. Local files cannot be copied to another playlist through the Spotify Web API.",
                    debug: {
                        playlistId,
                        trackUri,
                    },
                },
                { status: 400 },
            );
        }

        if (!isSpotifyTrackUri(trackUri)) {
            return Response.json(
                {
                    error: true,
                    message: `Only normal Spotify tracks can be added to playlists. Received: ${trackUri}`,
                    debug: {
                        playlistId,
                        trackUri,
                    },
                },
                { status: 400 },
            );
        }

        const res: globalThis.Response = await fetch(
            `https://api.spotify.com/v1/playlists/${encodeURIComponent(
                playlistId,
            )}/items`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uris: [trackUri],
                }),
                cache: "no-store",
            },
        );

        const data = (await res.json().catch(() => null)) as
            | SpotifyAddItemsResponse
            | null;

        console.log("Context menu add-to-playlist response:", {
            status: res.status,
            ok: res.ok,
            playlistId,
            trackUri,
            snapshotId: data?.snapshot_id,
            error: data?.error,
            fullResponse: data,
        });

        if (!res.ok) {
            return Response.json(
                {
                    error: true,
                    message:
                        data?.error?.message ??
                        data?.error?.reason ??
                        `Failed to add song to playlist. Spotify returned ${res.status}.`,
                    details: data,
                    debug: {
                        playlistId,
                        trackUri,
                        endpoint: "POST /playlists/{playlist_id}/items",
                    },
                },
                { status: res.status },
            );
        }

        return Response.json({
            success: true,
            snapshotId: data?.snapshot_id ?? null,
            addedTrackUri: trackUri,
            playlistId,
        });
    } catch (error) {
        console.error("Add track to playlist route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to add track to playlist.",
            },
            { status: 500 },
        );
    }
}