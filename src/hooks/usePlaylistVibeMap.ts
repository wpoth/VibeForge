import { useEffect, useState } from "react";

import type { SpotifyPlaylist, SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getErrorMessage, getTrackFromPlaylistItem } from "@/lib/ui-helpers";

export type PlaylistVibeMapData = {
    summary: string;
    moodTags: string[];
    genreTags: string[];
    bestFor: string[];
    energy: number;
    danceability: number;
    emotionalWeight: number;
    darkness: number;
    focus: number;
    cohesion: number;
    soundProfile: string;
    flow: string;
    standoutPattern: string;
    confidence: "low" | "medium" | "high";
};

type PlaylistVibeMapResponse = {
    success?: boolean;
    error?: boolean | string;
    message?: string;
    vibeMap?: PlaylistVibeMapData;
};

type UsePlaylistVibeMapArgs = {
    selectedPlaylist: SpotifyPlaylist;
    tracks: SpotifyPlaylistItem[];
};

export function usePlaylistVibeMap({
    selectedPlaylist,
    tracks,
}: UsePlaylistVibeMapArgs) {
    const [vibeMap, setVibeMap] = useState<PlaylistVibeMapData | null>(null);
    const [vibeMapLoading, setVibeMapLoading] = useState(false);
    const [vibeMapError, setVibeMapError] = useState<string | null>(null);
    const [vibeMapHidden, setVibeMapHidden] = useState(false);

    useEffect(() => {
        setVibeMap(null);
        setVibeMapError(null);
        setVibeMapHidden(false);
    }, [selectedPlaylist.id]);

    async function generateVibeMap() {
        const readableTracks = tracks
            .map((playlistItem) => {
                const track = getTrackFromPlaylistItem(playlistItem);

                if (!track?.name) return null;

                return {
                    name: track.name,
                    artists:
                        track.artists
                            ?.map((artist) => artist.name)
                            .filter((name): name is string => Boolean(name)) ?? [],
                    album: track.album?.name,
                };
            })
            .filter((track): track is NonNullable<typeof track> => Boolean(track))
            .slice(0, 80);

        if (!readableTracks.length) {
            setVibeMapError("This playlist does not have enough readable tracks.");
            return;
        }

        setVibeMapLoading(true);
        setVibeMapError(null);
        setVibeMapHidden(false);

        try {
            const res = await fetch("/api/playlist-vibe-map", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    playlistName: selectedPlaylist.name,
                    tracks: readableTracks,
                }),
            });

            const data = (await res.json()) as PlaylistVibeMapResponse;

            if (!res.ok || data.error || !data.vibeMap) {
                throw new Error(
                    data.message ||
                    String(data.error) ||
                    "Could not generate playlist vibe map"
                );
            }

            setVibeMap(data.vibeMap);
        } catch (error: unknown) {
            console.error("Generate vibe map failed:", error);
            setVibeMapError(getErrorMessage(error));
        } finally {
            setVibeMapLoading(false);
        }
    }

    function hideVibeMap() {
        setVibeMapHidden(true);
    }

    function showVibeMap() {
        setVibeMapHidden(false);
    }

    return {
        vibeMap,
        vibeMapLoading,
        vibeMapError,
        vibeMapHidden,
        generateVibeMap,
        hideVibeMap,
        showVibeMap,
    };
}