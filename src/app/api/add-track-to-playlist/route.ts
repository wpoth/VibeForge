import type { SpotifyAddItemsResponse } from "@/lib/spotify-types";

type AddTrackToPlaylistRequest = {
    accessToken?: string;
    playlistId?: string;
    trackUri?: string;
};

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
                    position: 0,
                }),
            },
        );

        const data = (await res.json().catch(() => null)) as
            | SpotifyAddItemsResponse
            | null;

        if (!res.ok || data?.error) {
            return Response.json(
                {
                    error: true,
                    message:
                        data?.error?.message ||
                        `Spotify returned ${res.status} while adding the track.`,
                    details: data,
                },
                { status: res.status },
            );
        }

        return Response.json({
            success: true,
            snapshotId: data?.snapshot_id,
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