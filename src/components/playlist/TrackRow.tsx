"use client";

import { useState } from "react";
import { motion } from "motion/react";

import { ContextMenu, type ContextMenuItem } from "@/components/common/ContextMenu";
import type { SpotifyPlaylistItem } from "@/lib/spotify-types";
import { getTrackFromPlaylistItem } from "@/lib/ui-helpers";

type TrackRowProps = {
  playlistItem: SpotifyPlaylistItem;
  index: number;
  selectionMode: boolean;
  selected: boolean;
  playingTrackUri: string | null;
  playbackLoading: boolean;
  onToggleSelect: (playlistItem: SpotifyPlaylistItem) => void;
  onRemove: (playlistItem: SpotifyPlaylistItem) => void;
  onPlay: (playlistItem: SpotifyPlaylistItem) => void;
  onAddToQueue: (playlistItem: SpotifyPlaylistItem) => void;
};

type MenuState = {
  open: boolean;
  x: number;
  y: number;
};

export function TrackRow({
  playlistItem,
  index,
  selectionMode,
  selected,
  playingTrackUri,
  playbackLoading,
  onToggleSelect,
  onRemove,
  onPlay,
  onAddToQueue,
}: TrackRowProps) {
  const [menu, setMenu] = useState<MenuState>({
    open: false,
    x: 0,
    y: 0,
  });

  const track = getTrackFromPlaylistItem(playlistItem);
  const trackUri = track?.uri ?? "";
  const isPlaying = Boolean(trackUri && playingTrackUri === trackUri);
  const spotifyUrl = track?.external_urls?.spotify;
  const imageUrl = track?.album?.images?.[0]?.url ?? null;
  const artistNames =
    track?.artists?.map((artist) => artist.name).filter(Boolean).join(", ") ||
    "Unknown artist";

  const menuItems: ContextMenuItem[] = [
    {
      label: "Play from here",
      disabled: !trackUri,
      onClick: () => onPlay(playlistItem),
    },
    {
      label: "Add to queue",
      disabled: !trackUri,
      onClick: () => onAddToQueue(playlistItem),
    },
    {
      label: "Open in Spotify",
      disabled: !spotifyUrl,
      onClick: () => {
        if (!spotifyUrl) return;
        window.open(spotifyUrl, "_blank", "noopener,noreferrer");
      },
    },
    {
      label: "Remove from playlist",
      destructive: true,
      onClick: () => onRemove(playlistItem),
    },
  ];

  return (
    <>
      <motion.div
        layout
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();

          setMenu({
            open: true,
            x: event.clientX,
            y: event.clientY,
          });
        }}
        className={`group rounded-xl border p-3 transition ${
          selected
            ? "border-green-400/40 bg-green-500/10"
            : isPlaying
              ? "border-green-400/30 bg-green-500/[0.07]"
              : "border-white/5 bg-white/[0.04] hover:bg-white/[0.07]"
        }`}
      >
        <div className="flex items-center gap-3">
          {selectionMode && (
            <button
              type="button"
              onClick={() => onToggleSelect(playlistItem)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition ${
                selected
                  ? "border-green-400 bg-green-500 text-black"
                  : "border-white/20 text-transparent hover:border-white/40"
              }`}
              aria-label={selected ? "Deselect song" : "Select song"}
            >
              ✓
            </button>
          )}

          <p className="hidden w-8 shrink-0 text-right text-sm text-zinc-600 sm:block">
            {index + 1}
          </p>

          <div className="group/cover relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`${track?.name ?? "Track"} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                ♪
              </div>
            )}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPlay(playlistItem);
              }}
              disabled={playbackLoading || !trackUri}
              className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover/cover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`Play ${track?.name ?? "song"}`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 pl-0.5 text-xs text-black shadow-lg shadow-green-500/30">
                {isPlaying ? "✓" : "▶"}
              </span>
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-medium ${
                isPlaying ? "text-green-300" : "text-white"
              }`}
            >
              {track?.name ?? "Unknown track"}
            </p>

            <p className="truncate text-xs text-zinc-500">{artistNames}</p>
          </div>

          <button
            type="button"
            onClick={() => onAddToQueue(playlistItem)}
            disabled={playbackLoading || !trackUri}
            className="hidden rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 opacity-0 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 group-hover:opacity-100 sm:block"
          >
            Queue
          </button>
        </div>
      </motion.div>

      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        items={menuItems}
        onClose={() =>
          setMenu((current) => ({
            ...current,
            open: false,
          }))
        }
      />
    </>
  );
}