import type {
    SpotifyImage,
    SpotifyPlaylistItem,
    SpotifyTrack,
} from "@/lib/spotify-types";

export function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : "Unknown error";
}

export function getTrackFromPlaylistItem(
    item: SpotifyPlaylistItem
): SpotifyTrack | null {
    return item.item ?? item.track ?? null;
}

export function getBestImage(images?: SpotifyImage[]) {
    return images?.[0]?.url ?? null;
}

export function getPlaylistTrackCount(playlist: {
    items?: { total?: number };
    tracks?: { total?: number };
}) {
    return playlist.items?.total ?? playlist.tracks?.total ?? 0;
}

export function getRelativeAddedTime(addedAt?: string | null) {
    if (!addedAt) return null;

    const addedDate = new Date(addedAt);
    const now = new Date();

    const diffMs = now.getTime() - addedDate.getTime();
    const diffMinutes = Math.floor(diffMs / 1000 / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Added just now";
    if (diffMinutes < 60) return `Added ${diffMinutes} min ago`;
    if (diffHours < 24) return `Added ${diffHours} hr ago`;
    if (diffDays === 1) return "Added yesterday";
    if (diffDays < 7) return `Added ${diffDays} days ago`;

    return `Added ${addedDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
            addedDate.getFullYear() === now.getFullYear()
                ? undefined
                : "numeric",
    })}`;
}

export function wasRecentlyAdded(addedAt?: string | null) {
    if (!addedAt) return false;

    const addedDate = new Date(addedAt);
    const now = new Date();

    const diffMs = now.getTime() - addedDate.getTime();
    const diffHours = diffMs / 1000 / 60 / 60;

    return diffHours <= 24;
}