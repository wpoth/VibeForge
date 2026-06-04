import { useState } from "react";

import type {
  AiPlaylistResponse,
  SpotifyPlaylist,
} from "@/lib/spotify-types";

import { getErrorMessage } from "@/lib/ui-helpers";

type UseAiPlaylistCreatorArgs = {
  accessToken: string | undefined;
  playlists: SpotifyPlaylist[];
  selectedPlaylist: SpotifyPlaylist | null;
  setPlaylists: React.Dispatch<React.SetStateAction<SpotifyPlaylist[]>>;
  setSelectedPlaylist: React.Dispatch<
    React.SetStateAction<SpotifyPlaylist | null>
  >;
  loadPlaylists: () => Promise<void>;
  openPlaylist: (playlist: SpotifyPlaylist) => Promise<void>;
};

type UseAiPlaylistCreatorResult = {
  aiPrompt: string;
  setAiPrompt: React.Dispatch<React.SetStateAction<string>>;
  aiPlaylistName: string;
  setAiPlaylistName: React.Dispatch<React.SetStateAction<string>>;
  aiPlaylistMode: "vibe" | "artist";
  setAiPlaylistMode: React.Dispatch<React.SetStateAction<"vibe" | "artist">>;
  aiPlaylistTarget: "new" | "existing";
  setAiPlaylistTarget: React.Dispatch<
    React.SetStateAction<"new" | "existing">
  >;
  selectedTargetPlaylistId: string;
  setSelectedTargetPlaylistId: React.Dispatch<React.SetStateAction<string>>;
  creatingPlaylist: boolean;
  createdPlaylistUrl: string | null;
  aiPlaylistSuccessMessage: string | null;
  createAiPlaylist: () => Promise<void>;
  aiPlaylistCreatorError: string | null;
};

export function useAiPlaylistCreator({
  accessToken,
  selectedPlaylist,
  setPlaylists,
  setSelectedPlaylist,
  loadPlaylists,
  openPlaylist,
}: UseAiPlaylistCreatorArgs): UseAiPlaylistCreatorResult {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPlaylistName, setAiPlaylistName] = useState("");
  const [aiPlaylistMode, setAiPlaylistMode] = useState<"vibe" | "artist">(
    "vibe"
  );

  const [aiPlaylistTarget, setAiPlaylistTarget] = useState<"new" | "existing">(
    "new"
  );

  const [selectedTargetPlaylistId, setSelectedTargetPlaylistId] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [createdPlaylistUrl, setCreatedPlaylistUrl] = useState<string | null>(
    null
  );

  const [aiPlaylistSuccessMessage, setAiPlaylistSuccessMessage] =
    useState<string | null>(null);

  const [aiPlaylistCreatorError, setAiPlaylistCreatorError] =
    useState<string | null>(null);

  async function createAiPlaylist() {
    if (!accessToken) return;

    if (!aiPrompt.trim()) {
      setAiPlaylistCreatorError("Type a vibe or artist first.");
      return;
    }

    if (aiPlaylistTarget === "existing" && !selectedTargetPlaylistId) {
      setAiPlaylistCreatorError("Choose a playlist to add songs to.");
      return;
    }

    setCreatingPlaylist(true);
    setCreatedPlaylistUrl(null);
    setAiPlaylistSuccessMessage(null);
    setAiPlaylistCreatorError(null);

    try {
      const res = await fetch("/api/ai-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          prompt: aiPrompt,
          mode: aiPlaylistMode,
          playlistName: aiPlaylistName,
          isPublic: false,
          action: aiPlaylistTarget === "existing" ? "append" : "create",
          targetPlaylistId:
            aiPlaylistTarget === "existing"
              ? selectedTargetPlaylistId
              : undefined,
        }),
      });

      const data = (await res.json()) as AiPlaylistResponse;

      console.log("AI PLAYLIST RESPONSE:", data);

      if (!res.ok || data?.error) {
        throw new Error(
          data?.message || String(data?.error) || "Failed to create playlist"
        );
      }

      if (data.action === "append") {
        const addedCount = data.tracks?.length ?? 0;

        setPlaylists((currentPlaylists) =>
          currentPlaylists.map((playlist) => {
            if (playlist.id !== selectedTargetPlaylistId) return playlist;

            const currentTotal =
              playlist.items?.total ?? playlist.tracks?.total ?? 0;

            const nextTotal = currentTotal + addedCount;

            return {
              ...playlist,
              items: { total: nextTotal },
              tracks: { total: nextTotal },
            };
          })
        );

        setSelectedPlaylist((currentPlaylist) => {
          if (
            !currentPlaylist ||
            currentPlaylist.id !== selectedTargetPlaylistId
          ) {
            return currentPlaylist;
          }

          const currentTotal =
            currentPlaylist.items?.total ??
            currentPlaylist.tracks?.total ??
            0;

          const nextTotal = currentTotal + addedCount;

          return {
            ...currentPlaylist,
            items: { total: nextTotal },
            tracks: { total: nextTotal },
          };
        });

        if (selectedPlaylist?.id === selectedTargetPlaylistId) {
          await openPlaylist(selectedPlaylist);
        }

        setCreatedPlaylistUrl(null);
        setAiPlaylistSuccessMessage(
          `Added ${addedCount} songs to the selected playlist.`
        );

        return;
      }

      setCreatedPlaylistUrl(data.playlist?.url ?? null);
      setAiPlaylistSuccessMessage("Playlist created successfully.");

      const createdPlaylist = data.playlist;

      if (createdPlaylist?.id) {
        const playlistId = createdPlaylist.id;
        const playlistName = createdPlaylist.name ?? "Generated Playlist";

        const total =
          createdPlaylist.items?.total ??
          createdPlaylist.tracks?.total ??
          data.tracks?.length ??
          0;

        const newPlaylist: SpotifyPlaylist = {
          id: playlistId,
          name: playlistName,
          items: { total },
          tracks: { total },
          images: createdPlaylist.images ?? [],
        };

        setPlaylists((currentPlaylists) => {
          const alreadyExists = currentPlaylists.some(
            (playlist) => playlist.id === playlistId
          );

          if (alreadyExists) return currentPlaylists;

          return [newPlaylist, ...currentPlaylists];
        });
      }

      await loadPlaylists();
    } catch (error: unknown) {
      console.error("Create AI playlist failed:", error);
      setAiPlaylistCreatorError(getErrorMessage(error));
    } finally {
      setCreatingPlaylist(false);
    }
  }

  return {
    aiPrompt,
    setAiPrompt,
    aiPlaylistName,
    setAiPlaylistName,
    aiPlaylistMode,
    setAiPlaylistMode,
    aiPlaylistTarget,
    setAiPlaylistTarget,
    selectedTargetPlaylistId,
    setSelectedTargetPlaylistId,
    creatingPlaylist,
    createdPlaylistUrl,
    aiPlaylistSuccessMessage,
    createAiPlaylist,
    aiPlaylistCreatorError,
  };
}