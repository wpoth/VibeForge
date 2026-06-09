"use client";

type TrackInlineActionsProps = {
    canUseTrackActions: boolean;
    canQueue: boolean;
    onFindSimilar: () => void;
    onResearch: () => void;
    onQueue: () => void;
};

export function TrackInlineActions({
    canUseTrackActions,
    canQueue,
    onFindSimilar,
    onResearch,
    onQueue,
}: TrackInlineActionsProps) {
    return (
        <>
            <button
                type="button"
                onClick={onFindSimilar}
                disabled={!canUseTrackActions}
                className="hidden rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 opacity-0 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 group-hover:opacity-100 lg:block"
            >
                Similar
            </button>

            <button
                type="button"
                onClick={onResearch}
                disabled={!canUseTrackActions}
                className="hidden rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 opacity-0 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 group-hover:opacity-100 lg:block"
            >
                Research
            </button>

            <button
                type="button"
                onClick={onQueue}
                disabled={!canQueue}
                className="hidden rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 opacity-0 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 group-hover:opacity-100 lg:block"
            >
                Queue
            </button>
        </>
    );
}