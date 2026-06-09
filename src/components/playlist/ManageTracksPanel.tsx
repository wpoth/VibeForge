"use client";

import { AnimatePresence, motion } from "motion/react";

type ManageTracksPanelProps = {
    selectionMode: boolean;
    selectedTrackCount: number;
    onToggleSelectionMode: () => void;
    onClearSelection: () => void;
    onSelectAllTracks: () => void;
    onRequestRemoveSelectedTracks: () => void;
};

export function ManageTracksPanel({
    selectionMode,
    selectedTrackCount,
    onToggleSelectionMode,
    onClearSelection,
    onSelectAllTracks,
    onRequestRemoveSelectedTracks,
}: ManageTracksPanelProps) {
    return (
        <motion.aside
            layout
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="order-first xl:order-none xl:sticky xl:top-20 xl:self-start"
        >
            <div className="rounded-2xl border border-white/10 bg-[#12141f]/90 p-4 shadow-xl backdrop-blur-xl">
                <div className="mb-4">
                    <p className="text-sm font-semibold text-white">
                        {selectionMode ? `${selectedTrackCount} selected` : "Manage tracks"}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Select multiple songs and remove them in one action.
                    </p>
                </div>

                <div className="grid gap-2">
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={onToggleSelectionMode}
                        className={`rounded-xl px-3 py-2 text-sm font-medium transition ${selectionMode
                                ? "bg-white/[0.08] text-zinc-300 hover:bg-white/[0.12]"
                                : "bg-green-500 text-black hover:bg-green-400"
                            }`}
                    >
                        {selectionMode ? "Exit select" : "Select songs"}
                    </motion.button>

                    <AnimatePresence>
                        {selectionMode && (
                            <motion.div
                                key="selection-actions"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.18 }}
                                className="grid gap-2 overflow-hidden"
                            >
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.015 }}
                                    whileTap={{ scale: 0.985 }}
                                    onClick={onSelectAllTracks}
                                    className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.1]"
                                >
                                    Select all
                                </motion.button>

                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.015 }}
                                    whileTap={{ scale: 0.985 }}
                                    onClick={onClearSelection}
                                    disabled={selectedTrackCount === 0}
                                    className="rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Clear selection
                                </motion.button>

                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.015 }}
                                    whileTap={{ scale: 0.985 }}
                                    onClick={onRequestRemoveSelectedTracks}
                                    disabled={selectedTrackCount === 0}
                                    className="rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Remove selected
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.aside>
    );
}