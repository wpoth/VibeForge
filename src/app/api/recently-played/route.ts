type SpotifyRecentlyPlayedArtist = {
    id?: string;
    name?: string;
    uri?: string;
};

type SpotifyRecentlyPlayedImage = {
    url: string;
    height?: number | null;
    width?: number | null;
};

type SpotifyRecentlyPlayedTrack = {
    id?: string;
    uri?: string;
    name?: string;
    type?: string;
    duration_ms?: number;
    external_urls?: {
        spotify?: string;
    };
    artists?: SpotifyRecentlyPlayedArtist[];
    album?: {
        name?: string;
        images?: SpotifyRecentlyPlayedImage[];
    };
};

type SpotifyRecentlyPlayedItem = {
    track?: SpotifyRecentlyPlayedTrack | null;
    played_at?: string;
    context?: {
        type?: string;
        uri?: string;
        external_urls?: {
            spotify?: string;
        };
    } | null;
};

type SpotifyRecentlyPlayedResponse = {
    items?: SpotifyRecentlyPlayedItem[];
    error?: {
        status?: number;
        message?: string;
    };
};

function getBestImage(images?: SpotifyRecentlyPlayedImage[]) {
    return images?.[0]?.url ?? null;
}

export async function POST(req: Request) {
    try {
        const {
            accessToken,
            limit = 50,
        }: {
            accessToken?: string;
            limit?: number;
        } = await req.json();

        if (!accessToken) {
            return Response.json(
                { error: true, message: "Missing access token" },
                { status: 400 },
            );
        }

        const safeLimit = Math.min(50, Math.max(1, Number(limit) || 50));

        const url = new URL("https://api.spotify.com/v1/me/player/recently-played");
        url.searchParams.set("limit", String(safeLimit));

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
        });

        const data = (await res.json()) as SpotifyRecentlyPlayedResponse;

        if (!res.ok || data.error) {
            return Response.json(
                {
                    error: true,
                    message:
                        data.error?.message ||
                        `Failed to load recently played tracks. Spotify returned ${res.status}.`,
                    details: data,
                },
                { status: res.status },
            );
        }

        const items = (data.items ?? [])
            .filter((item) => item.track?.type !== "episode")
            .map((item) => {
                const track = item.track;

                return {
                    id: track?.id,
                    uri: track?.uri,
                    title: track?.name ?? "Unknown track",
                    artists:
                        track?.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
                    album: track?.album?.name ?? "Unknown album",
                    imageUrl: getBestImage(track?.album?.images),
                    durationMs: track?.duration_ms ?? 0,
                    playedAt: item.played_at,
                    spotifyUrl: track?.external_urls?.spotify,
                    contextType: item.context?.type,
                    contextUri: item.context?.uri,
                    contextUrl: item.context?.external_urls?.spotify,
                };
            });

        return Response.json({
            success: true,
            items,
        });
    } catch (error) {
        console.error("Recently played route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to load recently played tracks",
            },
            { status: 500 },
        );
    }
}