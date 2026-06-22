import { useState, type Dispatch, type SetStateAction } from "react";

import type { PreparedSpotifyCoverImage } from "@/lib/spotify-cover-image";
import type { SpotifyPlaylist } from "@/lib/spotify-types";
import { isLikedSongsPlaylist } from "@/lib/spotify-types";
import { getErrorMessage } from "@/lib/ui-helpers";

type UsePlaylistCoverUploadArgs = {
    accessToken: string | undefined;
    selectedPlaylist: SpotifyPlaylist | null;
    setSelectedPlaylist: Dispatch<SetStateAction<SpotifyPlaylist | null>>;
    setPlaylists: Dispatch<SetStateAction<SpotifyPlaylist[]>>;
    loadPlaylists: () => Promise<void>;
};

type UploadPlaylistCoverArgs = {
    playlist: SpotifyPlaylist;
    preparedImage: PreparedSpotifyCoverImage;
};

type UsePlaylistCoverUploadResult = {
    playlistCoverUploadingId: string | null;
    playlistCoverUploadError: string | null;
    uploadPlaylistCover: (args: UploadPlaylistCoverArgs) => Promise<void>;
};

export function usePlaylistCoverUpload({
    accessToken,
    selectedPlaylist,
    setSelectedPlaylist,
    setPlaylists,
    loadPlaylists,
}: UsePlaylistCoverUploadArgs): UsePlaylistCoverUploadResult {
    const [playlistCoverUploadingId, setPlaylistCoverUploadingId] = useState<
        string | null
    >(null);

    const [playlistCoverUploadError, setPlaylistCoverUploadError] = useState<
        string | null
    >(null);

    async function uploadPlaylistCover({
        playlist,
        preparedImage,
    }: UploadPlaylistCoverArgs) {
        if (!accessToken) {
            throw new Error("Missing access token.");
        }

        if (isLikedSongsPlaylist(playlist)) {
            throw new Error("Liked Songs does not support custom cover images.");
        }

        setPlaylistCoverUploadingId(playlist.id);
        setPlaylistCoverUploadError(null);

        try {
            const res = await fetch("/api/upload-playlist-cover", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                    playlistId: playlist.id,
                    imageBase64: preparedImage.imageBase64,
                }),
            });

            const data = await res.json();

            if (!res.ok || data?.error) {
                throw new Error(
                    data?.message ||
                    String(data?.error) ||
                    "Failed to upload playlist cover",
                );
            }

            const optimisticImages = [
                {
                    url: preparedImage.previewUrl,
                    height: 640,
                    width: 640,
                },
            ];

            setPlaylists((currentPlaylists) =>
                currentPlaylists.map((item) =>
                    item.id === playlist.id
                        ? {
                            ...item,
                            images: optimisticImages,
                        }
                        : item,
                ),
            );

            if (selectedPlaylist?.id === playlist.id) {
                setSelectedPlaylist((currentPlaylist) =>
                    currentPlaylist
                        ? {
                            ...currentPlaylist,
                            images: optimisticImages,
                        }
                        : currentPlaylist,
                );
            }

            await loadPlaylists();

            setPlaylists((currentPlaylists) =>
                currentPlaylists.map((item) =>
                    item.id === playlist.id
                        ? {
                            ...item,
                            images: optimisticImages,
                        }
                        : item,
                ),
            );
        } catch (error: unknown) {
            const message = getErrorMessage(error);
            setPlaylistCoverUploadError(message);
            throw error;
        } finally {
            setPlaylistCoverUploadingId(null);
        }
    }

    return {
        playlistCoverUploadingId,
        playlistCoverUploadError,
        uploadPlaylistCover,
    };
}