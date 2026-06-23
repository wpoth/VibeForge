"use client";

import {
    ManagePanelSkeleton,
    PlaylistHeaderSkeleton,
    TrackRowSkeleton,
} from "@/components/common/Skeletons";

export function PlaylistLoadingState() {
    return (
        <div className="w-full max-w-6xl">
            <PlaylistHeaderSkeleton />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 space-y-2">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <TrackRowSkeleton key={index} />
                    ))}
                </div>

                <ManagePanelSkeleton />
            </div>
        </div>
    );
}