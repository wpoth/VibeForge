"use client";

import { useState } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  ExternalLink,
  ListPlus,
  MoreHorizontal,
  Play,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";

import {
  closeAllContextMenus,
  ContextMenu,
  type ContextMenuItem,
} from "@/components/common/ContextMenu";
import {
  MobileActionSheet,
  type MobileActionSheetItem,
} from "@/components/common/MobileActionSheet";
import { SwipeToQueueContainer } from "@/components/common/SwipeToQueueContainer";
import { TrackCoverButton } from "@/components/playlist/TrackCoverButton";
import { TrackInlineActions } from "@/components/playlist/TrackInlineActions";
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
  onResearch: (playlistItem: SpotifyPlaylistItem) => void;
  onFindSimilar: (playlistItem: SpotifyPlaylistItem) => void;
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
  onResearch,
  onFindSimilar,
}: TrackRowProps) {
  const [menu, setMenu] = useState<MenuState>({
    open: false,
    x: 0,
    y: 0,
  });

  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const track = getTrackFromPlaylistItem(playlistItem);
  const trackUri = track?.uri ?? "";
  const isPlaying = Boolean(trackUri && playingTrackUri === trackUri);
  const spotifyUrl = track?.external_urls?.spotify;
  const imageUrl = track?.album?.images?.[0]?.url ?? null;

  const artistNames =
    track?.artists?.map((artist) => artist.name).filter(Boolean).join(", ") ||
    "Unknown artist";
  const { settings } = useAppSettings();
  const canQueue = Boolean(trackUri) && !playbackLoading;
  const canUseTrackActions = Boolean(track?.name);
  const canSwipeToQueue =
    !settings.disableSwipeGestures && !selectionMode && canQueue;

  const sharedActionItems: Array<ContextMenuItem & MobileActionSheetItem> = [
    {
      label: "Play from here",
      icon: Play,
      disabled: !trackUri,
      onClick: () => onPlay(playlistItem),
    },
    {
      label: "Add to queue",
      icon: ListPlus,
      disabled: !trackUri,
      onClick: () => onAddToQueue(playlistItem),
    },
    {
      label: "Research song",
      icon: Search,
      disabled: !track?.name,
      onClick: () => onResearch(playlistItem),
    },
    {
      label: "Find similar songs",
      icon: Sparkles,
      disabled: !track?.name,
      onClick: () => onFindSimilar(playlistItem),
    },
    {
      label: "Open in Spotify",
      icon: ExternalLink,
      disabled: !spotifyUrl,
      onClick: () => {
        if (!spotifyUrl) return;
        window.open(spotifyUrl, "_blank", "noopener,noreferrer");
      },
    },
    {
      label: "Remove from playlist",
      icon: Trash2,
      destructive: true,
      onClick: () => onRemove(playlistItem),
    },
  ];

  return (
    <>
      <SwipeToQueueContainer
        enabled={canSwipeToQueue}
        onQueue={() => onAddToQueue(playlistItem)}
        onSwipeStart={() => {
          closeAllContextMenus();
          setMobileActionsOpen(false);
        }}
      >
        <motion.div
          layout
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
          className={`group relative rounded-xl border transition ${settings.compactTrackRows ? "p-2" : "p-3"
            } ${selected
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
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition ${selected
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

            <TrackCoverButton
              trackName={track?.name}
              imageUrl={imageUrl}
              isPlaying={isPlaying}
              disabled={playbackLoading || !trackUri}
              compact={settings.compactTrackRows}
              onPlay={() => onPlay(playlistItem)}
            />

            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${isPlaying ? "text-green-300" : "text-white"
                  }`}
              >
                {track?.name ?? "Unknown track"}
              </p>

              <p className="truncate text-xs text-zinc-500">{artistNames}</p>
            </div>

            <TrackInlineActions
              canUseTrackActions={canUseTrackActions}
              canQueue={canQueue}
              onFindSimilar={() => onFindSimilar(playlistItem)}
              onResearch={() => onResearch(playlistItem)}
              onQueue={() => onAddToQueue(playlistItem)}
            />

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setMobileActionsOpen(true);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-300 transition hover:bg-white/[0.1] hover:text-white lg:hidden"
              aria-label={`Open actions for ${track?.name ?? "song"}`}
            >
              <MoreHorizontal size={18} strokeWidth={2.4} />
            </button>
          </div>
        </motion.div>
      </SwipeToQueueContainer>

      <ContextMenu
        open={menu.open}
        x={menu.x}
        y={menu.y}
        items={sharedActionItems}
        onClose={() =>
          setMenu((current) => ({
            ...current,
            open: false,
          }))
        }
      />

      <MobileActionSheet
        open={mobileActionsOpen}
        title={track?.name ?? "Unknown track"}
        description={artistNames}
        items={sharedActionItems}
        onClose={() => setMobileActionsOpen(false)}
      />
    </>
  );
}