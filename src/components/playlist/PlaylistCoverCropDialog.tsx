"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    Check,
    ImagePlus,
    Loader2,
    Minus,
    Move,
    Plus,
    RotateCcw,
    X,
} from "lucide-react";
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

const PREVIEW_SIZE = 360;
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
    const previewFrameRef = useRef<HTMLDivElement | null>(null);
    const imageElementRef = useRef<HTMLImageElement | null>(null);
    const dragStartRef = useRef<{
        pointerX: number;
        pointerY: number;
        offsetX: number;
        offsetY: number;
    } | null>(null);

    const [previewDisplaySize, setPreviewDisplaySize] = useState(PREVIEW_SIZE);
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
        if (!open) return;

        const frame = previewFrameRef.current;

        if (!frame) return;

        function updatePreviewSize() {
            const bounds = frame?.getBoundingClientRect();

            if (!bounds) return;

            setPreviewDisplaySize(bounds.width);
        }

        updatePreviewSize();

        const observer = new ResizeObserver(updatePreviewSize);
        observer.observe(frame);

        return () => {
            observer.disconnect();
        };
    }, [open]);

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

    function nudgeZoom(direction: "in" | "out") {
        const nextZoom =
            direction === "in"
                ? clamp(zoom + 0.1, 1, 3)
                : clamp(zoom - 0.1, 1, 3);

        setZoom(nextZoom);
        setOffset((currentOffset) => clampOffset(currentOffset, nextZoom));
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

    const previewScale = previewDisplaySize / PREVIEW_SIZE;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="playlist-cover-crop-dialog"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[999999] flex items-end justify-center bg-black/75 p-0 text-white backdrop-blur-xl sm:items-center sm:p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !uploading) {
                            onClose();
                        }
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 36, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 36, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#0d0f14] shadow-2xl shadow-black/50 sm:max-h-[92vh] sm:max-w-3xl sm:rounded-[2rem]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.035] px-4 py-4 sm:px-6">
                            <div className="min-w-0">
                                <div className="inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-green-200">
                                    <ImagePlus size={13} />
                                    Cover editor
                                </div>

                                <h2 className="mt-3 truncate text-2xl font-black tracking-tight sm:text-3xl">
                                    Crop playlist cover
                                </h2>

                                <p className="mt-1 truncate text-sm text-zinc-500">
                                    {playlistName}
                                </p>
                            </div>

                            <button
                                type="button"
                                disabled={uploading}
                                onClick={onClose}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-400 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Close cover crop dialog"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="custom-sidebar-scrollbar flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                            <div className="grid gap-6 lg:grid-cols-[minmax(0,390px)_minmax(260px,1fr)] lg:items-start">
                                <div className="mx-auto w-full max-w-[390px]">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500">
                                            <Move size={14} />
                                            Drag to reposition
                                        </div>

                                        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-zinc-400">
                                            1:1 square
                                        </span>
                                    </div>

                                    <div className="relative rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-2 shadow-2xl shadow-black/30">
                                        <div
                                            ref={previewFrameRef}
                                            className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-[1.25rem] bg-black"
                                            style={{
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

                                                const deltaX =
                                                    (event.clientX - dragStartRef.current.pointerX) /
                                                    previewScale;
                                                const deltaY =
                                                    (event.clientY - dragStartRef.current.pointerY) /
                                                    previewScale;

                                                setOffset(
                                                    clampOffset({
                                                        x: dragStartRef.current.offsetX + deltaX,
                                                        y: dragStartRef.current.offsetY + deltaY,
                                                    }),
                                                );
                                            }}
                                            onPointerUp={(event) => {
                                                dragStartRef.current = null;
                                                event.currentTarget.releasePointerCapture(
                                                    event.pointerId,
                                                );
                                            }}
                                            onPointerCancel={(event) => {
                                                dragStartRef.current = null;
                                                event.currentTarget.releasePointerCapture(
                                                    event.pointerId,
                                                );
                                            }}
                                        >
                                            <div
                                                className="absolute left-0 top-0"
                                                style={{
                                                    width: PREVIEW_SIZE,
                                                    height: PREVIEW_SIZE,
                                                    transform: `scale(${previewScale})`,
                                                    transformOrigin: "top left",
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
                                            </div>

                                            {!imageInfo && !imageError && (
                                                <div className="flex h-full w-full items-center justify-center text-zinc-500">
                                                    <Loader2 size={26} className="animate-spin" />
                                                </div>
                                            )}

                                            <div className="pointer-events-none absolute inset-0 rounded-[1.25rem] ring-1 ring-inset ring-white/10" />
                                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:33.333%_33.333%] opacity-40" />
                                        </div>
                                    </div>

                                    <p className="mt-3 text-center text-xs leading-5 text-zinc-600">
                                        This preview now uses the same crop math as the Spotify
                                        upload.
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-white">Zoom</p>
                                                <p className="mt-1 text-xs text-zinc-600">
                                                    Use the slider or buttons.
                                                </p>
                                            </div>

                                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-300">
                                                {Math.round(zoom * 100)}%
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                disabled={!imageInfo || uploading || zoom <= 1}
                                                onClick={() => nudgeZoom("out")}
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Zoom out"
                                            >
                                                <Minus size={17} />
                                            </button>

                                            <input
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
                                                className="h-2 w-full cursor-pointer accent-green-400 disabled:cursor-not-allowed"
                                            />

                                            <button
                                                type="button"
                                                disabled={!imageInfo || uploading || zoom >= 3}
                                                onClick={() => nudgeZoom("in")}
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-zinc-300 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Zoom in"
                                            >
                                                <Plus size={17} />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={!imageInfo || uploading}
                                        onClick={resetCrop}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <RotateCcw size={16} />
                                        Reset position
                                    </button>

                                    {imageError && (
                                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                                            {imageError}
                                        </div>
                                    )}

                                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                                        <p className="text-sm font-semibold text-zinc-200">
                                            Spotify requirements
                                        </p>

                                        <ul className="mt-2 space-y-1.5 text-xs leading-5 text-zinc-500">
                                            <li>JPEG cover image</li>
                                            <li>Square crop</li>
                                            <li>Maximum 256 KB</li>
                                            <li>VibeForge compresses it automatically</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 border-t border-white/10 bg-[#0d0f14]/95 p-4 backdrop-blur-xl sm:px-6">
                            <div className="mx-auto flex max-w-3xl flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={onClose}
                                    className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] px-5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={!imageInfo || uploading}
                                    onClick={handleConfirm}
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-400 px-5 text-sm font-black text-black shadow-lg shadow-green-400/20 transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-44"
                                >
                                    {uploading ? (
                                        <Loader2 size={17} className="animate-spin" />
                                    ) : (
                                        <Check size={17} />
                                    )}
                                    {uploading ? "Uploading..." : "Use this cover"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}