type SpotifyApiErrorResponse = {
    error: {
        status?: number;
        message?: string;
        reason?: string;
    };
};

type SpotifyAddItemsResponse = {
    snapshot_id: string;
};

type SpotifyAddItemsApiResponse =
    | SpotifyAddItemsResponse
    | SpotifyApiErrorResponse
    | null;

type AddTrackToPlaylistRequest = {
    accessToken?: string;
    playlistId?: string;
    trackUri?: string;
};

function isSpotifyTrackUri(uri: string) {
    return /^spotify:track:[A-Za-z0-9]+$/.test(uri);
}

function isSpotifyApiErrorResponse(
    data: SpotifyAddItemsApiResponse,
): data is SpotifyApiErrorResponse {
    return Boolean(
        data &&
        typeof data === "object" &&
        "error" in data &&
        data.error &&
        typeof data.error === "object",
    );
}

function isSpotifyAddItemsResponse(
    data: SpotifyAddItemsApiResponse,
): data is SpotifyAddItemsResponse {
    return Boolean(
        data &&
        typeof data === "object" &&
        "snapshot_id" in data &&
        typeof data.snapshot_id === "string",
    );
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

        if (!playlistId) {
            return Response.json(
                {
                    error: true,
                    message: "Missing playlist ID.",
                },
                { status: 400 },
            );
        }

        if (!trackUri) {
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
                },
                { status: 400 },
            );
        }

        if (!isSpotifyTrackUri(trackUri)) {
            return Response.json(
                {
                    error: true,
                    message: `This item cannot be added to a playlist. Expected a Spotify track URI, received: ${trackUri}`,
                },
                { status: 400 },
            );
        }

        const res = await fetch(
            `https://api.spotify.com/v1/playlists/${encodeURIComponent(
                playlistId,
            )}/tracks`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    uris: [trackUri],
                }),
            },
        );

        const data = (await res
            .json()
            .catch(() => null)) as SpotifyAddItemsApiResponse;

        if (!res.ok || isSpotifyApiErrorResponse(data)) {
            const spotifyMessage = isSpotifyApiErrorResponse(data)
                ? data.error.message ||
                data.error.reason ||
                `Spotify returned ${res.status} while adding the track.`
                : `Spotify returned ${res.status} while adding the track.`;

            return Response.json(
                {
                    error: true,
                    message:
                        res.status === 403
                            ? `Spotify denied adding this track. Spotify said: ${spotifyMessage}`
                            : spotifyMessage,
                    status: res.status,
                    details: data,
                    debug: {
                        playlistId,
                        trackUri,
                    },
                },
                { status: res.status },
            );
        }

        return Response.json({
            success: true,
            snapshotId: isSpotifyAddItemsResponse(data) ? data.snapshot_id : null,
        });
    } catch (error) {
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