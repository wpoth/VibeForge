import { useState } from "react";

import type { SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getErrorMessage, getTrackFromPlaylistItem } from "@/lib/ui-helpers";

export type SongResearch = {
    summary: string;
    meaning: string;
    story: string;
    context: string;
    moodTags: string[];
    sonicNotes: string;
    relatedMedia: string | null;
    confidence: "low" | "medium" | "high";
};

type SongResearchResponse = {
    success?: boolean;
    error?: boolean | string;
    message?: string;
    research?: SongResearch;
};

export type ResearchTrackInfo = {
    name: string;
    artists: string[];
    album?: string;
    imageUrl?: string | null;
    spotifyUrl?: string;
};

export function useSongResearch() {
    const [researchOpen, setResearchOpen] = useState(false);
    const [researchLoading, setResearchLoading] = useState(false);
    const [researchError, setResearchError] = useState<string | null>(null);
    const [research, setResearch] = useState<SongResearch | null>(null);
    const [researchTrack, setResearchTrack] = useState<ResearchTrackInfo | null>(
        null
    );

    async function researchSong(playlistItem: SpotifyPlaylistItem) {
        const track = getTrackFromPlaylistItem(playlistItem);

        if (!track?.name) {
            setResearchError("Could not research this song because the name is missing.");
            setResearchOpen(true);
            return;
        }

        const artists =
            track.artists
                ?.map((artist) => artist.name)
                .filter((name): name is string => Boolean(name)) ?? [];

        if (!artists.length) {
            setResearchError(
                "Could not research this song because the artist is missing."
            );
            setResearchOpen(true);
            return;
        }

        const nextTrackInfo: ResearchTrackInfo = {
            name: track.name,
            artists,
            album: track.album?.name,
            imageUrl: track.album?.images?.[0]?.url ?? null,
            spotifyUrl: track.external_urls?.spotify,
        };

        setResearchTrack(nextTrackInfo);
        setResearch(null);
        setResearchError(null);
        setResearchLoading(true);
        setResearchOpen(true);

        try {
            const res = await fetch("/api/song-research", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    trackName: nextTrackInfo.name,
                    artists: nextTrackInfo.artists,
                    album: nextTrackInfo.album,
                    spotifyUrl: nextTrackInfo.spotifyUrl,
                }),
            });

            const data = (await res.json()) as SongResearchResponse;

            if (!res.ok || data.error || !data.research) {
                throw new Error(
                    data.message ||
                    String(data.error) ||
                    "Could not research this song"
                );
            }

            setResearch(data.research);
        } catch (error: unknown) {
            console.error("Song research failed:", error);
            setResearchError(getErrorMessage(error));
        } finally {
            setResearchLoading(false);
        }
    }

    function closeResearch() {
        setResearchOpen(false);
    }

    return {
        researchOpen,
        researchLoading,
        researchError,
        research,
        researchTrack,
        researchSong,
        closeResearch,
    };
}