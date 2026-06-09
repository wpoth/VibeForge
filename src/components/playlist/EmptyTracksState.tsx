"use client";

import { Music2 } from "lucide-react";
import { motion } from "motion/react";

export function EmptyTracksState() {
    return (
        <motion.div
            key="empty-tracks"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center"
        >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-zinc-500">
                <Music2 size={22} strokeWidth={2.2} />
            </div>

            <p className="text-lg font-semibold text-white">No tracks found</p>

            <p className="mt-2 text-sm text-zinc-400">
                This playlist does not have any readable tracks yet.
            </p>
        </motion.div>
    );
}