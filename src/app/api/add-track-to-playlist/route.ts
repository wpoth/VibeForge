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

type SpotifyMeResponse = {
    id: string;
    display_name?: string;
};

type SpotifyPlaylistDebugResponse = {
    id: string;
    name: string;
    public: boolean | null;
    collaborative: boolean;
    owner: {
        id: string;
        display_name?: string;
    };
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

async function readSpotifyJson<T>(res: Response) {
    return (await res.json().catch(() => null)) as T | SpotifyApiErrorResponse | null;
}

function getSpotifyErrorMessage(data: unknown, fallback: string) {
    if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        data.error &&
        typeof data.error === "object" &&
        "message" in data.error &&
        typeof data.error.message === "string"
    ) {
        return data.error.message;
    }

    return fallback;
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
                    message: `This item cannot be added to a playlist. Expected a Spotify track URI, received: ${trackUri}`,
                    debug: {
                        playlistId,
                        trackUri,
                    },
                },
                { status: 400 },
            );
        }

        const meRes = await fetch("https://api.spotify.com/v1/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
        });

        const meData = await readSpotifyJson<SpotifyMeResponse>(meRes);

        if (!meRes.ok || !meData || "error" in meData) {
            return Response.json(
                {
                    error: true,
                    message: getSpotifyErrorMessage(
                        meData,
                        "Could not verify the current Spotify user.",
                    ),
                    details: meData,
                },
                { status: meRes.status },
            );
        }

        const playlistRes = await fetch(
            `https://api.spotify.com/v1/playlists/${encodeURIComponent(
                playlistId,
            )}?fields=id,name,public,collaborative,owner(id,display_name)`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                cache: "no-store",
            },
        );

        const playlistData =
            await readSpotifyJson<SpotifyPlaylistDebugResponse>(playlistRes);

        if (!playlistRes.ok || !playlistData || "error" in playlistData) {
            return Response.json(
                {
                    error: true,
                    message: getSpotifyErrorMessage(
                        playlistData,
                        "Could not read the target playlist.",
                    ),
                    details: playlistData,
                    debug: {
                        playlistId,
                        trackUri,
                        currentUser: meData,
                    },
                },
                { status: playlistRes.status },
            );
        }

        const ownedByCurrentUser = playlistData.owner.id === meData.id;
        const probablyWritable = ownedByCurrentUser || playlistData.collaborative;

        if (!probablyWritable) {
            return Response.json(
                {
                    error: true,
                    message:
                        "Spotify says this playlist is not owned by the current user and is not collaborative, so VibeForge cannot add songs to it.",
                    debug: {
                        playlistId,
                        trackUri,
                        currentUser: meData,
                        targetPlaylist: playlistData,
                    },
                },
                { status: 403 },
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
                cache: "no-store",
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

            const requiredScope =
                playlistData.public === true
                    ? "playlist-modify-public"
                    : "playlist-modify-private";

            return Response.json(
                {
                    error: true,
                    message:
                        res.status === 403
                            ? `Spotify denied adding this track. The target playlist is ${playlistData.public ? "public" : "private"
                            }, so the token must include ${requiredScope}. Spotify said: ${spotifyMessage}`
                            : spotifyMessage,
                    status: res.status,
                    details: data,
                    debug: {
                        requiredScope,
                        playlistId,
                        trackUri,
                        currentUser: meData,
                        targetPlaylist: playlistData,
                    },
                },
                { status: res.status },
            );
        }

        return Response.json({
            success: true,
            snapshotId: isSpotifyAddItemsResponse(data) ? data.snapshot_id : null,
            debug: {
                playlistId,
                trackUri,
                currentUser: meData,
                targetPlaylist: playlistData,
            },
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