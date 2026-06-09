"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  ListPlus,
  MoreHorizontal,
  Play,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";

import {
  closeAllContextMenus,
  ContextMenu,
  type ContextMenuItem,
} from "@/components/common/ContextMenu";
import {
  MobileActionSheet,
  type MobileActionSheetItem,
} from "@/components/common/MobileActionSheet";
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

const QUEUE_SWIPE_THRESHOLD = 72;
const MAX_SWIPE_DISTANCE = 104;

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
  const [isTouchLayout, setIsTouchLayout] = useState(false);
  const [swipeReady, setSwipeReady] = useState(false);

  const swipeX = useMotionValue(0);
  const queueBackgroundOpacity = useTransform(swipeX, [0, 40, 90], [0, 0.45, 1]);
  const queueIconScale = useTransform(swipeX, [0, 72, 104], [0.85, 1, 1.08]);

  const track = getTrackFromPlaylistItem(playlistItem);
  const trackUri = track?.uri ?? "";
  const isPlaying = Boolean(trackUri && playingTrackUri === trackUri);
  const spotifyUrl = track?.external_urls?.spotify;
  const imageUrl = track?.album?.images?.[0]?.url ?? null;

  const artistNames =
    track?.artists?.map((artist) => artist.name).filter(Boolean).join(", ") ||
    "Unknown artist";

  const canSwipeToQueue =
    isTouchLayout && !selectionMode && Boolean(trackUri) && !playbackLoading;

  useEffect(() => {
    function updateTouchLayout() {
      setIsTouchLayout(window.matchMedia("(max-width: 1023px)").matches);
    }

    updateTouchLayout();

    window.addEventListener("resize", updateTouchLayout);

    return () => {
      window.removeEventListener("resize", updateTouchLayout);
    };
  }, []);

  useEffect(() => {
    setSwipeReady(false);
    swipeX.set(0);
  }, [trackUri, selectionMode, swipeX]);

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

  function snapSwipeBack() {
    setSwipeReady(false);

    void animate(swipeX, 0, {
      type: "spring",
      stiffness: 520,
      damping: 36,
      mass: 0.75,
    });
  }

  function handleQueueSwipe() {
    if (!canSwipeToQueue) {
      snapSwipeBack();
      return;
    }

    onAddToQueue(playlistItem);
    snapSwipeBack();
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-xl lg:overflow-visible">
        <motion.div
          style={{
            opacity: queueBackgroundOpacity,
          }}
          className={`pointer-events-none absolute inset-0 flex items-center rounded-xl px-4 lg:hidden ${swipeReady
              ? "bg-green-500/25 text-green-200"
              : "bg-green-500/15 text-green-300"
            }`}
        >
          <motion.div
            style={{
              scale: queueIconScale,
            }}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-black shadow-lg shadow-green-500/30">
              <ListPlus size={18} strokeWidth={2.5} />
            </div>

            <span className="text-sm font-semibold">
              {swipeReady ? "Release to queue" : "Swipe to queue"}
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          layout
          drag={canSwipeToQueue ? "x" : false}
          dragDirectionLock
          dragConstraints={{
            left: 0,
            right: MAX_SWIPE_DISTANCE,
          }}
          dragElastic={0.12}
          dragMomentum={false}
          style={{
            x: swipeX,
            touchAction: canSwipeToQueue ? "pan-y" : undefined,
          }}
          onDragStart={() => {
            if (!canSwipeToQueue) return;

            closeAllContextMenus();
            setMobileActionsOpen(false);
          }}
          onDrag={(_, info) => {
            if (!canSwipeToQueue) return;

            const nextX = Math.max(0, info.offset.x);
            setSwipeReady(nextX >= QUEUE_SWIPE_THRESHOLD);
          }}
          onDragEnd={(_, info) => {
            if (!canSwipeToQueue) {
              snapSwipeBack();
              return;
            }

            const shouldQueue = info.offset.x >= QUEUE_SWIPE_THRESHOLD;

            if (shouldQueue) {
              handleQueueSwipe();
              return;
            }

            snapSwipeBack();
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
          className={`relative rounded-xl border p-3 transition ${selected
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

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPlay(playlistItem);
              }}
              disabled={playbackLoading || !trackUri}
              className={`group/cover relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white/[0.06] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${isPlaying ? "ring-1 ring-green-400/60" : ""
                }`}
              aria-label={`Play ${track?.name ?? "song"}`}
            >
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

              <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover/cover:opacity-100">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-black shadow-lg shadow-green-500/30">
                  <Play size={13} fill="currentColor" strokeWidth={2.4} />
                </span>
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm font-medium ${isPlaying ? "text-green-300" : "text-white"
                  }`}
              >
                {track?.name ?? "Unknown track"}
              </p>

              <p className="truncate text-xs text-zinc-500">{artistNames}</p>
            </div>

            <button
              type="button"
              onClick={() => onFindSimilar(playlistItem)}
              disabled={!track?.name}
              className="hidden rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 opacity-0 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 group-hover:opacity-100 lg:block"
            >
              Similar
            </button>

            <button
              type="button"
              onClick={() => onResearch(playlistItem)}
              disabled={!track?.name}
              className="hidden rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 opacity-0 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 group-hover:opacity-100 lg:block"
            >
              Research
            </button>

            <button
              type="button"
              onClick={() => onAddToQueue(playlistItem)}
              disabled={playbackLoading || !trackUri}
              className="hidden rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium text-zinc-300 opacity-0 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40 group-hover:opacity-100 lg:block"
            >
              Queue
            </button>

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
      </div>

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