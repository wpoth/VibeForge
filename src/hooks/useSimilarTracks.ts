import { useState } from "react";

import type { SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getErrorMessage, getTrackFromPlaylistItem } from "@/lib/ui-helpers";

export type SimilarTrack = {
    id?: string;
    uri?: string;
    name?: string;
    artists?: string[];
    album?: string;
    imageUrl?: string | null;
    spotifyUrl?: string;
    reason?: string;
    query?: string;
};

export type SimilarSourceTrack = {
    name: string;
    artists: string[];
    album?: string;
    imageUrl?: string | null;
};

type SimilarTracksResponse = {
    success?: boolean;
    error?: boolean | string;
    message?: string;
    tracks?: SimilarTrack[];
};

type UseSimilarTracksArgs = {
    accessToken: string | undefined;
};

export function useSimilarTracks({ accessToken }: UseSimilarTracksArgs) {
    const [similarOpen, setSimilarOpen] = useState(false);
    const [similarLoading, setSimilarLoading] = useState(false);
    const [similarError, setSimilarError] = useState<string | null>(null);
    const [similarTracks, setSimilarTracks] = useState<SimilarTrack[]>([]);
    const [similarSourceTrack, setSimilarSourceTrack] =
        useState<SimilarSourceTrack | null>(null);

    async function findSimilarTracks(playlistItem: SpotifyPlaylistItem) {
        if (!accessToken) {
            setSimilarError("Could not find similar songs because you are not logged in.");
            setSimilarOpen(true);
            return;
        }

        const track = getTrackFromPlaylistItem(playlistItem);

        if (!track?.name) {
            setSimilarError("Could not find similar songs because the track name is missing.");
            setSimilarOpen(true);
            return;
        }

        const artists =
            track.artists
                ?.map((artist) => artist.name)
                .filter((name): name is string => Boolean(name)) ?? [];

        if (!artists.length) {
            setSimilarError("Could not find similar songs because the artist is missing.");
            setSimilarOpen(true);
            return;
        }

        const sourceTrack: SimilarSourceTrack = {
            name: track.name,
            artists,
            album: track.album?.name,
            imageUrl: track.album?.images?.[0]?.url ?? null,
        };

        setSimilarSourceTrack(sourceTrack);
        setSimilarTracks([]);
        setSimilarError(null);
        setSimilarLoading(true);
        setSimilarOpen(true);

        try {
            const res = await fetch("/api/similar-tracks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                    trackName: sourceTrack.name,
                    artists: sourceTrack.artists,
                    album: sourceTrack.album,
                }),
            });

            const data = (await res.json()) as SimilarTracksResponse;

            if (!res.ok || data.error || !data.tracks) {
                throw new Error(
                    data.message ||
                    String(data.error) ||
                    "Could not find similar songs"
                );
            }

            setSimilarTracks(data.tracks);
        } catch (error: unknown) {
            console.error("Find similar tracks failed:", error);
            setSimilarError(getErrorMessage(error));
        } finally {
            setSimilarLoading(false);
        }
    }

    function closeSimilarTracks() {
        setSimilarOpen(false);
    }

    return {
        similarOpen,
        similarLoading,
        similarError,
        similarTracks,
        similarSourceTrack,
        findSimilarTracks,
        closeSimilarTracks,
    };
}