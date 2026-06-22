"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import {
    compressSpotifyCoverCanvas,
    type PreparedSpotifyCoverImage,
} from "@/lib/spotify-cover-image";

type PlaylistCoverCropDialogProps = {
    open: boolean;
    playlistName: string;
    file: File | null;
    uploading: boolean;
    onClose: () => void;
    onConfirm: (preparedImage: PreparedSpotifyCoverImage) => Promise<void>;
};

type ImageInfo = {
    src: string;
    naturalWidth: number;
    naturalHeight: number;
};

const PREVIEW_SIZE = 320;
const OUTPUT_SIZE = 640;

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function loadImage(file: File) {
    return new Promise<ImageInfo>((resolve, reject) => {
        const src = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            resolve({
                src,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
            });
        };

        image.onerror = () => {
            URL.revokeObjectURL(src);
            reject(new Error("Could not load the selected image."));
        };

        image.src = src;
    });
}

export function PlaylistCoverCropDialog({
    open,
    playlistName,
    file,
    uploading,
    onClose,
    onConfirm,
}: PlaylistCoverCropDialogProps) {
    const imageElementRef = useRef<HTMLImageElement | null>(null);
    const dragStartRef = useRef<{
        pointerX: number;
        pointerY: number;
        offsetX: number;
        offsetY: number;
    } | null>(null);

    const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({
        x: 0,
        y: 0,
    });

    const baseScale = useMemo(() => {
        if (!imageInfo) return 1;

        return Math.max(
            PREVIEW_SIZE / imageInfo.naturalWidth,
            PREVIEW_SIZE / imageInfo.naturalHeight,
        );
    }, [imageInfo]);

    const scaledImageSize = useMemo(() => {
        if (!imageInfo) {
            return {
                width: PREVIEW_SIZE,
                height: PREVIEW_SIZE,
            };
        }

        return {
            width: imageInfo.naturalWidth * baseScale * zoom,
            height: imageInfo.naturalHeight * baseScale * zoom,
        };
    }, [baseScale, imageInfo, zoom]);

    function clampOffset(nextOffset: { x: number; y: number }, nextZoom = zoom) {
        if (!imageInfo) return nextOffset;

        const nextScaledWidth = imageInfo.naturalWidth * baseScale * nextZoom;
        const nextScaledHeight = imageInfo.naturalHeight * baseScale * nextZoom;

        const maxX = Math.max(0, (nextScaledWidth - PREVIEW_SIZE) / 2);
        const maxY = Math.max(0, (nextScaledHeight - PREVIEW_SIZE) / 2);

        return {
            x: clamp(nextOffset.x, -maxX, maxX),
            y: clamp(nextOffset.y, -maxY, maxY),
        };
    }

    useEffect(() => {
        if (!open || !file) {
            setImageInfo(null);
            setImageError(null);
            setZoom(1);
            setOffset({
                x: 0,
                y: 0,
            });
            return;
        }

        let active = true;
        let objectUrlToClean: string | null = null;

        setImageInfo(null);
        setImageError(null);
        setZoom(1);
        setOffset({
            x: 0,
            y: 0,
        });

        loadImage(file)
            .then((info) => {
                if (!active) {
                    URL.revokeObjectURL(info.src);
                    return;
                }

                objectUrlToClean = info.src;
                setImageInfo(info);
            })
            .catch((error: unknown) => {
                if (!active) return;

                setImageError(
                    error instanceof Error
                        ? error.message
                        : "Could not load the selected image.",
                );
            });

        return () => {
            active = false;

            if (objectUrlToClean) {
                URL.revokeObjectURL(objectUrlToClean);
            }
        };
    }, [file, open]);

    useEffect(() => {
        setOffset((currentOffset) => clampOffset(currentOffset, zoom));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom, imageInfo]);

    function resetCrop() {
        setZoom(1);
        setOffset({
            x: 0,
            y: 0,
        });
    }

    function createCroppedCanvas() {
        const image = imageElementRef.current;

        if (!image || !imageInfo) {
            throw new Error("No image is ready to crop.");
        }

        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Could not prepare crop canvas.");
        }

        context.fillStyle = "#000000";
        context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        const outputScale = OUTPUT_SIZE / PREVIEW_SIZE;
        const drawWidth = scaledImageSize.width * outputScale;
        const drawHeight = scaledImageSize.height * outputScale;
        const drawX =
            ((PREVIEW_SIZE - scaledImageSize.width) / 2 + offset.x) * outputScale;
        const drawY =
            ((PREVIEW_SIZE - scaledImageSize.height) / 2 + offset.y) * outputScale;

        context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

        return canvas;
    }

    async function handleConfirm() {
        try {
            const canvas = createCroppedCanvas();
            const preparedImage = compressSpotifyCoverCanvas(canvas);

            await onConfirm(preparedImage);
        } catch (error) {
            setImageError(
                error instanceof Error
                    ? error.message
                    : "Could not prepare the playlist cover.",
            );
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="playlist-cover-crop-dialog"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xl"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !uploading) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#101217] p-5 text-white shadow-2xl"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-200">
                                    <ImagePlus size={14} />
                                    Playlist cover
                                </div>

                                <h2 className="mt-3 text-2xl font-black tracking-tight">
                                    Choose the crop
                                </h2>

                                <p className="mt-1 text-sm text-zinc-500">
                                    Drag and zoom the image for{" "}
                                    <span className="text-zinc-300">{playlistName}</span>.
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={uploading}
                                onClick={onClose}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Close cover crop dialog"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
                            <div className="mx-auto">
                                <div
                                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/30"
                                    style={{
                                        width: PREVIEW_SIZE,
                                        height: PREVIEW_SIZE,
                                        maxWidth: "calc(100vw - 48px)",
                                        maxHeight: "calc(100vw - 48px)",
                                        touchAction: "none",
                                    }}
                                    onPointerDown={(event) => {
                                        if (!imageInfo || uploading) return;

                                        event.currentTarget.setPointerCapture(event.pointerId);

                                        dragStartRef.current = {
                                            pointerX: event.clientX,
                                            pointerY: event.clientY,
                                            offsetX: offset.x,
                                            offsetY: offset.y,
                                        };
                                    }}
                                    onPointerMove={(event) => {
                                        if (!dragStartRef.current || !imageInfo || uploading) {
                                            return;
                                        }

                                        const deltaX = event.clientX - dragStartRef.current.pointerX;
                                        const deltaY = event.clientY - dragStartRef.current.pointerY;

                                        setOffset(
                                            clampOffset({
                                                x: dragStartRef.current.offsetX + deltaX,
                                                y: dragStartRef.current.offsetY + deltaY,
                                            }),
                                        );
                                    }}
                                    onPointerUp={(event) => {
                                        dragStartRef.current = null;
                                        event.currentTarget.releasePointerCapture(event.pointerId);
                                    }}
                                    onPointerCancel={(event) => {
                                        dragStartRef.current = null;
                                        event.currentTarget.releasePointerCapture(event.pointerId);
                                    }}
                                >
                                    {imageInfo && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            ref={imageElementRef}
                                            src={imageInfo.src}
                                            alt="Selected playlist cover"
                                            draggable={false}
                                            className="absolute left-1/2 top-1/2 select-none"
                                            style={{
                                                width: scaledImageSize.width,
                                                height: scaledImageSize.height,
                                                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                                                maxWidth: "none",
                                            }}
                                        />
                                    )}

                                    {!imageInfo && !imageError && (
                                        <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                            <Loader2 size={24} className="animate-spin" />
                                        </div>
                                    )}

                                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
                                </div>

                                <p className="mt-3 text-center text-xs text-zinc-600">
                                    Drag inside the square to reposition.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <label
                                            htmlFor="cover-zoom"
                                            className="text-sm font-semibold text-zinc-200"
                                        >
                                            Zoom
                                        </label>

                                        <span className="text-xs text-zinc-500">
                                            {Math.round(zoom * 100)}%
                                        </span>
                                    </div>

                                    <input
                                        id="cover-zoom"
                                        type="range"
                                        min="1"
                                        max="3"
                                        step="0.01"
                                        value={zoom}
                                        disabled={!imageInfo || uploading}
                                        onChange={(event) => {
                                            const nextZoom = Number(event.target.value);
                                            setZoom(nextZoom);
                                            setOffset((currentOffset) =>
                                                clampOffset(currentOffset, nextZoom),
                                            );
                                        }}
                                        className="w-full accent-green-400"
                                    />
                                </div>

                                <button
                                    type="button"
                                    disabled={!imageInfo || uploading}
                                    onClick={resetCrop}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <RotateCcw size={16} />
                                    Reset crop
                                </button>

                                {imageError && (
                                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                                        {imageError}
                                    </div>
                                )}

                                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-xs leading-5 text-zinc-500">
                                    Spotify requires a JPEG cover under 256 KB. VibeForge will
                                    compress the cropped image automatically before uploading.
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        disabled={uploading}
                                        onClick={onClose}
                                        className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        disabled={!imageInfo || uploading}
                                        onClick={handleConfirm}
                                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-green-400 px-4 text-sm font-bold text-black shadow-lg shadow-green-400/20 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {uploading && (
                                            <Loader2 size={16} className="animate-spin" />
                                        )}
                                        {uploading ? "Uploading..." : "Use this cover"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}