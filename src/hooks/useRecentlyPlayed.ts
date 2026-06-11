import { useCallback, useEffect, useMemo, useState } from "react";

import { getErrorMessage } from "@/lib/ui-helpers";

export type RecentlyPlayedTrack = {
    id?: string;
    uri?: string;
    title: string;
    artists: string[];
    album: string;
    imageUrl?: string | null;
    durationMs?: number;
    playedAt?: string;
    spotifyUrl?: string;
    contextType?: string;
    contextUri?: string;
    contextUrl?: string;
};

type RecentlyPlayedResponse = {
    success?: boolean;
    error?: boolean | string;
    message?: string;
    items?: RecentlyPlayedTrack[];
};

export type RecentlyPlayedStats = {
    total: number;
    playedToday: number;
    uniqueTracks: number;
    uniqueArtists: number;
    topArtist: {
        name: string;
        count: number;
    } | null;
    topTrack: {
        title: string;
        artists: string[];
        count: number;
    } | null;
};

function isSameLocalDay(dateA: Date, dateB: Date) {
    return (
        dateA.getFullYear() === dateB.getFullYear() &&
        dateA.getMonth() === dateB.getMonth() &&
        dateA.getDate() === dateB.getDate()
    );
}

function buildRecentlyPlayedStats(
    items: RecentlyPlayedTrack[],
): RecentlyPlayedStats {
    const now = new Date();
    const artistCounts = new Map<string, number>();
    const trackCounts = new Map<
        string,
        {
            title: string;
            artists: string[];
            count: number;
        }
    >();
    const uniqueTrackIds = new Set<string>();
    const uniqueArtists = new Set<string>();

    let playedToday = 0;

    for (const item of items) {
        if (item.playedAt && isSameLocalDay(new Date(item.playedAt), now)) {
            playedToday += 1;
        }

        if (item.id) {
            uniqueTrackIds.add(item.id);
        }

        for (const artist of item.artists) {
            uniqueArtists.add(artist);
            artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + 1);
        }

        const trackKey = item.id || `${item.title}-${item.artists.join(",")}`;
        const currentTrackCount = trackCounts.get(trackKey);

        if (currentTrackCount) {
            currentTrackCount.count += 1;
        } else {
            trackCounts.set(trackKey, {
                title: item.title,
                artists: item.artists,
                count: 1,
            });
        }
    }

    const topArtistEntry = [...artistCounts.entries()].sort(
        (a, b) => b[1] - a[1],
    )[0];
    const topTrackEntry = [...trackCounts.values()].sort(
        (a, b) => b.count - a.count,
    )[0];

    return {
        total: items.length,
        playedToday,
        uniqueTracks: uniqueTrackIds.size,
        uniqueArtists: uniqueArtists.size,
        topArtist: topArtistEntry
            ? {
                name: topArtistEntry[0],
                count: topArtistEntry[1],
            }
            : null,
        topTrack: topTrackEntry ?? null,
    };
}

export function useRecentlyPlayed(accessToken: string | undefined) {
    const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>(
        [],
    );
    const [recentlyPlayedLoaded, setRecentlyPlayedLoaded] = useState(false);
    const [recentlyPlayedLoading, setRecentlyPlayedLoading] = useState(false);
    const [recentlyPlayedError, setRecentlyPlayedError] = useState<string | null>(
        null,
    );

    const loadRecentlyPlayed = useCallback(async () => {
        if (!accessToken) {
            setRecentlyPlayed([]);
            setRecentlyPlayedLoaded(false);
            setRecentlyPlayedError(null);
            return;
        }

        setRecentlyPlayedLoading(true);

        try {
            const res = await fetch("/api/recently-played", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                    limit: 50,
                }),
            });

            const data = (await res.json()) as RecentlyPlayedResponse;

            if (!res.ok || data.error) {
                throw new Error(
                    data.message ||
                    String(data.error) ||
                    "Failed to load recently played tracks",
                );
            }

            setRecentlyPlayed(data.items ?? []);
            setRecentlyPlayedLoaded(true);
            setRecentlyPlayedError(null);
        } catch (error: unknown) {
            console.error("Recently played failed:", error);
            setRecentlyPlayedError(getErrorMessage(error));
        } finally {
            setRecentlyPlayedLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        void loadRecentlyPlayed();
    }, [loadRecentlyPlayed]);

    const recentlyPlayedStats = useMemo(
        () => buildRecentlyPlayedStats(recentlyPlayed),
        [recentlyPlayed],
    );

    return {
        recentlyPlayed,
        recentlyPlayedStats,
        recentlyPlayedLoaded,
        recentlyPlayedLoading,
        recentlyPlayedError,
        loadRecentlyPlayed,
    };
}