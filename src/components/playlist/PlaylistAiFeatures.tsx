"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Radar, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { FeatureHiddenCard } from "@/components/common/FeatureHiddenCard";
import { FeatureLoadingCard } from "@/components/common/FeatureLoadingCard";
import { PillButton } from "@/components/common/PillButton";
import { PlaylistVibeMap } from "@/components/playlist/PlaylistVibeMap";
import { usePlaylistVibeMap } from "@/hooks/usePlaylistVibeMap";
import type { SpotifyPlaylist, SpotifyPlaylistItem } from "@/lib/spotify-types";

type PlaylistAiFeaturesProps = {
    selectedPlaylist: SpotifyPlaylist;
    tracks: SpotifyPlaylistItem[];
    loadingAI: boolean;
    aiAnalysis: string | null;
    selectionMode: boolean;
    onGenerateAiAnalysis: () => void;
};

export function PlaylistAiFeatures({
    selectedPlaylist,
    tracks,
    loadingAI,
    aiAnalysis,
    selectionMode,
    onGenerateAiAnalysis,
}: PlaylistAiFeaturesProps) {
    const [analysisHidden, setAnalysisHidden] = useState(false);

    const {
        vibeMap,
        vibeMapLoading,
        vibeMapError,
        vibeMapHidden,
        generateVibeMap,
        hideVibeMap,
        showVibeMap,
    } = usePlaylistVibeMap({
        selectedPlaylist,
        tracks,
    });

    useEffect(() => {
        setAnalysisHidden(false);
    }, [selectedPlaylist.id]);

    function handleGenerateAiAnalysis() {
        setAnalysisHidden(false);
        onGenerateAiAnalysis();
    }

    return (
        <>
            <AnimatePresence>
                {tracks.length > 0 && !selectionMode && (
                    <motion.div
                        key="playlist-ai-actions"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
                    >
                        {!vibeMap && (
                            <PillButton
                                icon={Radar}
                                onClick={generateVibeMap}
                                disabled={vibeMapLoading}
                                variant="default"
                                fullWidth
                                className="rounded-lg font-semibold sm:w-auto"
                            >
                                {vibeMapLoading ? "Mapping vibes..." : "Generate vibe map"}
                            </PillButton>
                        )}

                        {!aiAnalysis && (
                            <PillButton
                                onClick={handleGenerateAiAnalysis}
                                disabled={loadingAI}
                                variant="primary"
                                fullWidth
                                className="rounded-lg font-semibold sm:w-auto"
                            >
                                Generate AI analysis
                            </PillButton>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {vibeMapLoading && (
                    <FeatureLoadingCard
                        key="vibe-map-loading"
                        title="Mapping playlist vibe..."
                        icon={Radar}
                        variant="scores"
                    />
                )}

                {vibeMapError && !vibeMapLoading && (
                    <motion.div
                        key="vibe-map-error"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4"
                    >
                        <p className="text-sm font-semibold text-red-200">
                            Could not generate vibe map
                        </p>
                        <p className="mt-2 text-sm text-red-100/80">{vibeMapError}</p>
                    </motion.div>
                )}

                {!vibeMapLoading && vibeMap && vibeMapHidden && (
                    <FeatureHiddenCard
                        key="vibe-map-hidden"
                        title="Vibe map hidden"
                        description="The playlist vibe map is still available."
                        icon={Eye}
                        onShow={showVibeMap}
                    />
                )}

                {!vibeMapLoading && vibeMap && !vibeMapHidden && (
                    <PlaylistVibeMap
                        key="vibe-map-result"
                        vibeMap={vibeMap}
                        loading={vibeMapLoading}
                        onRegenerate={generateVibeMap}
                        onHide={hideVibeMap}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {loadingAI && (
                    <FeatureLoadingCard
                        key="ai-analysis-loading"
                        title="Generating AI analysis..."
                    />
                )}

                {!loadingAI && aiAnalysis && analysisHidden && (
                    <FeatureHiddenCard
                        key="ai-analysis-hidden"
                        title="AI analysis hidden"
                        description="The playlist analysis is still available."
                        icon={Eye}
                        onShow={() => setAnalysisHidden(false)}
                    />
                )}

                {!loadingAI && aiAnalysis && !analysisHidden && (
                    <motion.div
                        key="ai-analysis-result"
                        initial={{ opacity: 0, y: 10, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.99 }}
                        transition={{ duration: 0.22 }}
                        className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl"
                    >
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="font-semibold">AI Analysis</h3>
                                <p className="mt-1 text-xs text-zinc-500">
                                    Generated from the current playlist.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <PillButton
                                    icon={RefreshCw}
                                    onClick={handleGenerateAiAnalysis}
                                    disabled={loadingAI}
                                    fullWidth
                                    className="sm:w-auto sm:py-1"
                                >
                                    Regenerate
                                </PillButton>

                                <PillButton
                                    icon={EyeOff}
                                    onClick={() => setAnalysisHidden(true)}
                                    fullWidth
                                    className="sm:w-auto sm:py-1"
                                >
                                    Hide
                                </PillButton>
                            </div>
                        </div>

                        <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-zinc-300">
                            {aiAnalysis}
                        </pre>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}