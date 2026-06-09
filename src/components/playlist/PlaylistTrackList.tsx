"use client";

import { AnimatePresence, motion } from "motion/react";

import { TrackRow } from "@/components/playlist/TrackRow";
import type { SpotifyPlaylistItem } from "@/lib/spotify-types";

type PlaylistTrackListProps = {
    tracks: SpotifyPlaylistItem[];
    selectionMode: boolean;
    selectedTrackUris: string[];
    playingTrackUri: string | null;
    playbackLoading: boolean;

    onPlayTrack: (playlistItem: SpotifyPlaylistItem) => void;
    onAddToQueue: (playlistItem: SpotifyPlaylistItem) => void;
    onResearchTrack: (playlistItem: SpotifyPlaylistItem) => void;
    onFindSimilarTracks: (playlistItem: SpotifyPlaylistItem) => void;
    onRemoveTrack: (playlistItem: SpotifyPlaylistItem) => void;
    onToggleTrackSelection: (playlistItem: SpotifyPlaylistItem) => void;
};

export function PlaylistTrackList({
    tracks,
    selectionMode,
    selectedTrackUris,
    playingTrackUri,
    playbackLoading,
    onPlayTrack,
    onAddToQueue,
    onResearchTrack,
    onFindSimilarTracks,
    onRemoveTrack,
    onToggleTrackSelection,
}: PlaylistTrackListProps) {
    return (
        <motion.div layout className="space-y-2">
            <AnimatePresence initial={false}>
                {tracks.map((playlistItem, index) => {
                    const uri = playlistItem.item?.uri ?? playlistItem.track?.uri ?? "";
                    const selected = uri ? selectedTrackUris.includes(uri) : false;

                    return (
                        <motion.div
                            key={playlistItem.item?.id ?? playlistItem.track?.id ?? index}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -16, height: 0 }}
                            transition={{
                                opacity: { duration: 0.16 },
                                y: { duration: 0.18 },
                                x: { duration: 0.16 },
                                layout: { duration: 0.22 },
                            }}
                        >
                            <TrackRow
                                playlistItem={playlistItem}
                                index={index}
                                selectionMode={selectionMode}
                                selected={selected}
                                playingTrackUri={playingTrackUri}
                                playbackLoading={playbackLoading}
                                onToggleSelect={onToggleTrackSelection}
                                onRemove={onRemoveTrack}
                                onPlay={onPlayTrack}
                                onAddToQueue={onAddToQueue}
                                onResearch={onResearchTrack}
                                onFindSimilar={onFindSimilarTracks}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </motion.div>
    );
}