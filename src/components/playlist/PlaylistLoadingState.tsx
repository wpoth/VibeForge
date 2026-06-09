"use client";

import {
    ManagePanelSkeleton,
    PlaylistHeaderSkeleton,
    TrackRowSkeleton,
} from "@/components/common/Skeletons";
import { motion } from "motion/react";

export function PlaylistLoadingState() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-6xl"
        >
            <PlaylistHeaderSkeleton />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0 space-y-2">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <TrackRowSkeleton key={index} />
                    ))}
                </div>

                <ManagePanelSkeleton />
            </div>
        </motion.div>
    );
}