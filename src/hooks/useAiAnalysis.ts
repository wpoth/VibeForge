import { useState } from "react";

import type {
  ApiErrorResponse,
  SpotifyPlaylistItem,
  SpotifyTrack,
} from "@/lib/spotify-types";

import {
  getErrorMessage,
  getTrackFromPlaylistItem,
} from "@/lib/ui-helpers";

type UseAiAnalysisResult = {
  aiAnalysis: string | null;
  setAiAnalysis: React.Dispatch<React.SetStateAction<string | null>>;
  loadingAI: boolean;
  generateAiAnalysis: (
    playlistItems: SpotifyPlaylistItem[]
  ) => Promise<void>;
  aiAnalysisError: string | null;
};

export function useAiAnalysis(): UseAiAnalysisResult {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  async function generateAiAnalysis(playlistItems: SpotifyPlaylistItem[]) {
    const simplified = playlistItems
      .map(getTrackFromPlaylistItem)
      .filter((track): track is SpotifyTrack => Boolean(track?.name))
      .map((track) => ({
        name: track.name,
        artists:
          track.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
      }));

    if (!simplified.length) return;

    setLoadingAI(true);
    setAiAnalysisError(null);

    try {
      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playlist: simplified }),
      });

      const aiData = (await aiRes.json()) as ApiErrorResponse & {
        result?: string;
      };

      if (!aiRes.ok || aiData?.error) {
        throw new Error(
          aiData?.message || String(aiData?.error) || "AI analysis failed"
        );
      }

      setAiAnalysis(aiData?.result ?? null);
    } catch (error: unknown) {
      console.error("AI failed:", error);
      setAiAnalysisError(getErrorMessage(error));
    } finally {
      setLoadingAI(false);
    }
  }

  return {
    aiAnalysis,
    setAiAnalysis,
    loadingAI,
    generateAiAnalysis,
    aiAnalysisError,
  };
}