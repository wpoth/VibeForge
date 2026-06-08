type SpotifyQueueTrack = {
    id?: string;
    uri?: string;
    name?: string;
    type?: string;
    duration_ms?: number;
    explicit?: boolean;
    external_urls?: {
        spotify?: string;
    };
    artists?: {
        name?: string;
    }[];
    album?: {
        name?: string;
        images?: {
            url: string;
            height?: number | null;
            width?: number | null;
        }[];
    };
};

type SpotifyQueueEpisode = {
    id?: string;
    uri?: string;
    name?: string;
    type?: string;
    duration_ms?: number;
    explicit?: boolean;
    external_urls?: {
        spotify?: string;
    };
    images?: {
        url: string;
        height?: number | null;
        width?: number | null;
    }[];
    show?: {
        name?: string;
    };
};

type SpotifyQueueItem = SpotifyQueueTrack | SpotifyQueueEpisode;

type SpotifyQueueResponse = {
    currently_playing?: SpotifyQueueItem | null;
    queue?: SpotifyQueueItem[];
    error?: {
        status?: number;
        message?: string;
    };
};

function isTrack(item: SpotifyQueueItem | null | undefined): item is SpotifyQueueTrack {
    return item?.type === "track";
}

function mapQueueItem(item: SpotifyQueueItem | null | undefined) {
    if (!item) return null;

    if (isTrack(item)) {
        return {
            id: item.id,
            uri: item.uri,
            type: item.type,
            name: item.name,
            artists:
                item.artists
                    ?.map((artist) => artist.name)
                    .filter((name): name is string => Boolean(name)) ?? [],
            album: item.album?.name,
            imageUrl: item.album?.images?.[0]?.url ?? null,
            durationMs: item.duration_ms ?? 0,
            spotifyUrl: item.external_urls?.spotify,
            explicit: Boolean(item.explicit),
        };
    }

    return {
        id: item.id,
        uri: item.uri,
        type: item.type,
        name: item.name,
        artists: item.show?.name ? [item.show.name] : [],
        album: item.show?.name,
        imageUrl: item.images?.[0]?.url ?? null,
        durationMs: item.duration_ms ?? 0,
        spotifyUrl: item.external_urls?.spotify,
        explicit: Boolean(item.explicit),
    };
}

export async function POST(req: Request) {
    try {
        const {
            accessToken,
        }: {
            accessToken?: string;
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

        const res: globalThis.Response = await fetch(
            "https://api.spotify.com/v1/me/player/queue",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const text = await res.text();

        let data: SpotifyQueueResponse | { rawText: string };

        try {
            data = text ? (JSON.parse(text) as SpotifyQueueResponse) : {};
        } catch {
            data = { rawText: text };
        }

        if (!res.ok) {
            return Response.json(
                {
                    error: true,
                    message:
                        "error" in data && data.error?.message
                            ? data.error.message
                            : `Failed to fetch Spotify queue. Spotify returned ${res.status}.`,
                    details: data,
                },
                { status: res.status }
            );
        }

        if ("rawText" in data) {
            return Response.json(
                {
                    error: true,
                    message: "Spotify returned an invalid queue response.",
                    rawContent: data.rawText,
                },
                { status: 500 }
            );
        }

        return Response.json({
            success: true,
            currentlyPlaying: mapQueueItem(data.currently_playing ?? null),
            queue:
                data.queue
                    ?.map((item) => mapQueueItem(item))
                    .filter((item): item is NonNullable<typeof item> => Boolean(item)) ??
                [],
        });
    } catch (error) {
        console.error("Player queue route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error ? error.message : "Failed to fetch queue",
            },
            { status: 500 }
        );
    }
}