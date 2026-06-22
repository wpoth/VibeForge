type UploadPlaylistCoverRequest = {
    accessToken?: string;
    playlistId?: string;
    imageBase64?: string;
};

function getBase64ByteSize(base64: string) {
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as UploadPlaylistCoverRequest;

        const accessToken = body.accessToken;
        const playlistId = body.playlistId;
        const imageBase64 = body.imageBase64?.replace(
            /^data:image\/jpeg;base64,/,
            "",
        );

        if (!accessToken) {
            return Response.json(
                {
                    error: true,
                    message: "Missing access token",
                },
                { status: 400 },
            );
        }

        if (!playlistId) {
            return Response.json(
                {
                    error: true,
                    message: "Missing playlist ID",
                },
                { status: 400 },
            );
        }

        if (!imageBase64) {
            return Response.json(
                {
                    error: true,
                    message: "Missing image data",
                },
                { status: 400 },
            );
        }

        const imageSize = getBase64ByteSize(imageBase64);

        if (imageSize > 256 * 1024) {
            return Response.json(
                {
                    error: true,
                    message: "Image is too large. Spotify requires max 256 KB.",
                },
                { status: 400 },
            );
        }

        const spotifyRes = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/images`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "image/jpeg",
                },
                body: imageBase64,
            },
        );

        if (spotifyRes.status === 200 || spotifyRes.status === 202) {
            return Response.json({
                success: true,
            });
        }

        const text = await spotifyRes.text();

        let details: unknown = text;

        try {
            details = text ? JSON.parse(text) : {};
        } catch {
            details = text;
        }

        return Response.json(
            {
                error: true,
                message: `Spotify failed to update the playlist cover. Status ${spotifyRes.status}.`,
                details,
            },
            { status: spotifyRes.status },
        );
    } catch (error) {
        console.error("Upload playlist cover error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to upload playlist cover",
            },
            { status: 500 },
        );
    }
}