import { useState } from "react";

import { getErrorMessage } from "@/lib/ui-helpers";

export type PlayerQueueItem = {
    id?: string;
    uri?: string;
    type?: string;
    name?: string;
    artists?: string[];
    album?: string;
    imageUrl?: string | null;
    durationMs?: number;
    spotifyUrl?: string;
    explicit?: boolean;
};

type PlayerQueueResponse = {
    success?: boolean;
    error?: boolean | string;
    message?: string;
    currentlyPlaying?: PlayerQueueItem | null;
    queue?: PlayerQueueItem[];
};

type UsePlayerQueueArgs = {
    accessToken: string | undefined;
};

export function usePlayerQueue({ accessToken }: UsePlayerQueueArgs) {
    const [queueOpen, setQueueOpen] = useState(false);
    const [queueLoading, setQueueLoading] = useState(false);
    const [queueError, setQueueError] = useState<string | null>(null);
    const [currentlyPlayingQueueItem, setCurrentlyPlayingQueueItem] =
        useState<PlayerQueueItem | null>(null);
    const [queueItems, setQueueItems] = useState<PlayerQueueItem[]>([]);

    async function loadQueue() {
        if (!accessToken) {
            setQueueError("Could not open queue because you are not logged in.");
            setQueueOpen(true);
            return;
        }

        setQueueOpen(true);
        setQueueLoading(true);
        setQueueError(null);

        try {
            const res = await fetch("/api/player-queue", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessToken,
                }),
            });

            const data = (await res.json()) as PlayerQueueResponse;

            if (!res.ok || data.error) {
                throw new Error(
                    data.message || String(data.error) || "Could not fetch queue"
                );
            }

            setCurrentlyPlayingQueueItem(data.currentlyPlaying ?? null);
            setQueueItems(data.queue ?? []);
        } catch (error: unknown) {
            console.error("Load queue failed:", error);
            setQueueError(getErrorMessage(error));
        } finally {
            setQueueLoading(false);
        }
    }

    function closeQueue() {
        setQueueOpen(false);
    }

    return {
        queueOpen,
        queueLoading,
        queueError,
        currentlyPlayingQueueItem,
        queueItems,
        loadQueue,
        closeQueue,
    };
}