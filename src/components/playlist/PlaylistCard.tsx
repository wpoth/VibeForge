"use client";

import { useState } from "react";
import { motion } from "motion/react";

import {
  ContextMenu,
  closeAllContextMenus,
  type ContextMenuItem,
} from "@/components/common/ContextMenu";
import { CoverImage } from "@/components/common/CoverImage";
import type { SpotifyPlaylist } from "@/lib/spotify-types";
import { isLikedSongsPlaylist } from "@/lib/spotify-types";
import { getPlaylistTrackCount } from "@/lib/ui-helpers";

type PlaylistCardProps = {
  playlist: SpotifyPlaylist;
  isSelected: boolean;
  canRemove?: boolean;
  canPlay?: boolean;
  onClick: () => void;
  onRemove: () => void;
  onPlay: () => void;
};

type MenuState = {
  open: boolean;
  x: number;
  y: number;
};

export function PlaylistCard({
  playlist,
  isSelected,
  canRemove = true,
  canPlay = true,
  onClick,
  onRemove,
  onPlay,
}: PlaylistCardProps) {
  const [menu, setMenu] = useState<MenuState>({
    open: false,
    x: 0,
    y: 0,
  });

  const spotifyUrl = playlist.external_urls?.spotify;
  const likedSongs = isLikedSongsPlaylist(playlist);

  const menuItems: ContextMenuItem[] = [
    {
      label: "Open",
      onClick,
    },
    {
      label: likedSongs ? "Play a song after opening" : "Play",
      disabled: !canPlay,
      onClick: onPlay,
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
      label: likedSongs ? "Cannot remove Liked Songs" : "Remove from library",
      destructive: true,
      disabled: !canRemove,
      onClick: onRemove,
    },
  ];

  return (
    <>
      <motion.div
        role="button"
        tabIndex={0}
        layout
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.985 }}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();

          closeAllContextMenus();

          setMenu({
            open: true,
            x: event.clientX,
            y: event.clientY,
          });
        }}
        className={`group min-w-56 max-w-56 cursor-pointer rounded-xl border p-3 text-left transition outline-none focus:border-green-400/60 lg:min-w-0 lg:max-w-none ${isSelected
            ? "border-green-400/40 bg-green-500/10"
            : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
          }`}
      >
        <div className="flex items-center gap-3">
          <div className="group/cover relative shrink-0">
            <CoverImage
              images={playlist.images}
              alt={`${playlist.name} cover`}
              size="sm"
            />

            {canPlay && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={(event) => {
                  event.stopPropagation();
                  onPlay();
                }}
                className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/55 opacity-0 transition group-hover/cover:opacity-100"
                aria-label={`Play ${playlist.name}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 pl-0.5 text-xs text-black shadow-lg shadow-green-500/30">
                  ▶
                </span>
              </motion.button>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {playlist.name}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {likedSongs ? "Library" : `${getPlaylistTrackCount(playlist)} tracks`}
            </p>
          </div>
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