type SpotifyTimeRange = "short_term" | "medium_term" | "long_term";

type SpotifyImage = {
    url: string;
    height?: number | null;
    width?: number | null;
};

type SpotifyArtist = {
    id: string;
    name: string;
    images?: SpotifyImage[];
    external_urls?: {
        spotify?: string;
    };
};

type SpotifyAlbum = {
    id: string;
    name: string;
    images?: SpotifyImage[];
    external_urls?: {
        spotify?: string;
    };
};

type SpotifyTrack = {
    id: string;
    name: string;
    duration_ms: number;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
    external_urls?: {
        spotify?: string;
    };
};

type SpotifyTopArtistsResponse = {
    items?: SpotifyArtist[];
    error?: {
        message?: string;
    };
};

type SpotifyTopTracksResponse = {
    items?: SpotifyTrack[];
    error?: {
        message?: string;
    };
};

type SpotifyRecentlyPlayedItem = {
    track: SpotifyTrack;
    played_at: string;
};

type SpotifyRecentlyPlayedResponse = {
    items?: SpotifyRecentlyPlayedItem[];
    error?: {
        message?: string;
    };
};

type SpotifyArtistsResponse = {
    artists?: SpotifyArtist[];
    error?: {
        message?: string;
    };
};

type CounterItem = {
    id: string;
    name: string;
    imageUrl: string | null;
    spotifyUrl: string | null;
    count: number;
    minutes: number;
};

type MinutesByDay = {
    date: string;
    label: string;
    minutes: number;
    tracks: number;
};

type StatsRequest = {
    accessToken?: string;
    timeRange?: SpotifyTimeRange;
};

const VALID_TIME_RANGES: SpotifyTimeRange[] = [
    "short_term",
    "medium_term",
    "long_term",
];

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Unknown error";
}

function getImageUrl(images?: SpotifyImage[]) {
    return images?.[0]?.url ?? null;
}

function getSpotifyUrl(
    item?: {
        external_urls?: {
            spotify?: string;
        };
    } | null,
) {
    return item?.external_urls?.spotify ?? null;
}

function formatDateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date) {
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
}

function addToCounter(
    map: Map<string, CounterItem>,
    item: {
        id: string;
        name: string;
        imageUrl: string | null;
        spotifyUrl: string | null;
    },
    minutes: number,
) {
    const existing = map.get(item.id);

    if (existing) {
        existing.count += 1;
        existing.minutes += minutes;
        return;
    }

    map.set(item.id, {
        ...item,
        count: 1,
        minutes,
    });
}

function getSortedCounterItems(map: Map<string, CounterItem>) {
    return Array.from(map.values()).sort((a, b) => {
        if (b.minutes !== a.minutes) return b.minutes - a.minutes;
        return b.count - a.count;
    });
}

function buildRecentStats(items: SpotifyRecentlyPlayedItem[]) {
    const artistMap = new Map<string, CounterItem>();
    const albumMap = new Map<string, CounterItem>();
    const trackMap = new Map<string, CounterItem>();
    const dayMap = new Map<string, MinutesByDay>();

    let totalMinutes = 0;

    for (const item of items) {
        const track = item.track;

        if (!track?.id) continue;

        const minutes = Math.max(0, track.duration_ms || 0) / 60000;
        totalMinutes += minutes;

        const playedAt = new Date(item.played_at);
        const dayKey = formatDateKey(playedAt);

        const existingDay = dayMap.get(dayKey);

        if (existingDay) {
            existingDay.minutes += minutes;
            existingDay.tracks += 1;
        } else {
            dayMap.set(dayKey, {
                date: dayKey,
                label: formatDayLabel(playedAt),
                minutes,
                tracks: 1,
            });
        }

        addToCounter(
            trackMap,
            {
                id: track.id,
                name: track.name,
                imageUrl: getImageUrl(track.album?.images),
                spotifyUrl: getSpotifyUrl(track),
            },
            minutes,
        );

        if (track.album?.id) {
            addToCounter(
                albumMap,
                {
                    id: track.album.id,
                    name: track.album.name,
                    imageUrl: getImageUrl(track.album.images),
                    spotifyUrl: getSpotifyUrl(track.album),
                },
                minutes,
            );
        }

        for (const artist of track.artists ?? []) {
            if (!artist?.id) continue;

            addToCounter(
                artistMap,
                {
                    id: artist.id,
                    name: artist.name,
                    imageUrl: getImageUrl(artist.images),
                    spotifyUrl: getSpotifyUrl(artist),
                },
                minutes,
            );
        }
    }

    return {
        itemsAnalyzed: items.length,
        totalMinutes,
        minutesByDay: Array.from(dayMap.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((day) => ({
                ...day,
                minutes: Math.round(day.minutes),
            })),
        topArtists: getSortedCounterItems(artistMap).slice(0, 10),
        topAlbums: getSortedCounterItems(albumMap).slice(0, 10),
        topTracks: getSortedCounterItems(trackMap).slice(0, 10),
    };
}

async function fetchSpotify<T>({
    accessToken,
    url,
}: {
    accessToken: string;
    url: string;
}) {
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
    });

    const data = (await res.json()) as T & {
        error?: {
            message?: string;
        };
    };

    if (!res.ok || data?.error) {
        throw new Error(
            data?.error?.message || `Spotify request failed with status ${res.status}`,
        );
    }

    return data;
}

async function enrichRecentArtistImages({
    accessToken,
    artists,
    fallbackArtists,
}: {
    accessToken: string;
    artists: CounterItem[];
    fallbackArtists: {
        id: string;
        imageUrl: string | null;
        spotifyUrl: string | null;
    }[];
}) {
    const fallbackById = new Map(
        fallbackArtists.map((artist) => [artist.id, artist]),
    );

    const artistsWithTopArtistFallback = artists.map((artist) => {
        const fallback = fallbackById.get(artist.id);

        return {
            ...artist,
            imageUrl: fallback?.imageUrl ?? artist.imageUrl,
            spotifyUrl: fallback?.spotifyUrl ?? artist.spotifyUrl,
        };
    });

    const artistIds = artistsWithTopArtistFallback
        .filter((artist) => !artist.imageUrl)
        .map((artist) => artist.id)
        .filter(Boolean)
        .slice(0, 50);

    if (artistIds.length === 0) {
        return artistsWithTopArtistFallback;
    }

    try {
        const artistsUrl = new URL("https://api.spotify.com/v1/artists");
        artistsUrl.searchParams.set("ids", artistIds.join(","));

        const artistsData = await fetchSpotify<SpotifyArtistsResponse>({
            accessToken,
            url: artistsUrl.toString(),
        });

        const artistDetailsById = new Map(
            (artistsData.artists ?? []).map((artist) => [artist.id, artist]),
        );

        return artistsWithTopArtistFallback.map((artist) => {
            const details = artistDetailsById.get(artist.id);

            return {
                ...artist,
                imageUrl: getImageUrl(details?.images) ?? artist.imageUrl,
                spotifyUrl: getSpotifyUrl(details) ?? artist.spotifyUrl,
            };
        });
    } catch (error) {
        console.warn("Could not enrich recent artist images:", error);

        return artistsWithTopArtistFallback;
    }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as StatsRequest;

        const accessToken = body.accessToken;
        const timeRange = VALID_TIME_RANGES.includes(
            body.timeRange ?? "short_term",
        )
            ? body.timeRange ?? "short_term"
            : "short_term";

        if (!accessToken) {
            return Response.json(
                {
                    error: true,
                    message: "Missing access token.",
                },
                {
                    status: 400,
                },
            );
        }

        const topArtistsUrl = new URL("https://api.spotify.com/v1/me/top/artists");
        topArtistsUrl.searchParams.set("time_range", timeRange);
        topArtistsUrl.searchParams.set("limit", "10");

        const topTracksUrl = new URL("https://api.spotify.com/v1/me/top/tracks");
        topTracksUrl.searchParams.set("time_range", timeRange);
        topTracksUrl.searchParams.set("limit", "10");

        const recentlyPlayedUrl = new URL(
            "https://api.spotify.com/v1/me/player/recently-played",
        );
        recentlyPlayedUrl.searchParams.set("limit", "50");

        const [topArtistsData, topTracksData, recentlyPlayedData] =
            await Promise.all([
                fetchSpotify<SpotifyTopArtistsResponse>({
                    accessToken,
                    url: topArtistsUrl.toString(),
                }),
                fetchSpotify<SpotifyTopTracksResponse>({
                    accessToken,
                    url: topTracksUrl.toString(),
                }),
                fetchSpotify<SpotifyRecentlyPlayedResponse>({
                    accessToken,
                    url: recentlyPlayedUrl.toString(),
                }),
            ]);

        const topArtists =
            topArtistsData.items?.map((artist, index) => ({
                rank: index + 1,
                id: artist.id,
                name: artist.name,
                imageUrl: getImageUrl(artist.images),
                spotifyUrl: getSpotifyUrl(artist),
            })) ?? [];

        const topTracks =
            topTracksData.items?.map((track, index) => ({
                rank: index + 1,
                id: track.id,
                name: track.name,
                artistName:
                    track.artists?.map((artist) => artist.name).join(", ") ??
                    "Unknown artist",
                albumName: track.album?.name ?? "Unknown album",
                imageUrl: getImageUrl(track.album?.images),
                spotifyUrl: getSpotifyUrl(track),
            })) ?? [];

        const recent = buildRecentStats(recentlyPlayedData.items ?? []);

        const enrichedRecentTopArtists = await enrichRecentArtistImages({
            accessToken,
            artists: recent.topArtists,
            fallbackArtists: topArtists,
        });

        return Response.json({
            success: true,
            timeRange,
            topArtists,
            topTracks,
            recent: {
                ...recent,
                topArtists: enrichedRecentTopArtists,
            },
        });
    } catch (error: unknown) {
        return Response.json(
            {
                error: true,
                message: getErrorMessage(error),
            },
            {
                status: 500,
            },
        );
    }
}