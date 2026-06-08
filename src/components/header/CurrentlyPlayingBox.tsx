"use client";

import { Music2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type CurrentlyPlayingBoxProps = {
    title?: string;
    artists?: string[];
    imageUrl?: string | null;
    isPlaying?: boolean;
    onClick?: () => void;
};

function TypewriterText({
    text,
    className,
}: {
    text: string;
    className?: string;
}) {
    const [displayedText, setDisplayedText] = useState(text);
    const [phase, setPhase] = useState<"idle" | "deleting" | "typing">("idle");
    const previousTextRef = useRef(text);

    useEffect(() => {
        if (previousTextRef.current === text) return;

        setPhase("deleting");
    }, [text]);

    useEffect(() => {
        if (phase === "idle") return;

        if (phase === "deleting") {
            if (displayedText.length > 0) {
                const timeoutId = window.setTimeout(() => {
                    setDisplayedText((current) => current.slice(0, -1));
                }, 10);

                return () => window.clearTimeout(timeoutId);
            }

            previousTextRef.current = text;
            setPhase("typing");
            return;
        }

        if (phase === "typing") {
            if (displayedText.length < text.length) {
                const timeoutId = window.setTimeout(() => {
                    setDisplayedText(text.slice(0, displayedText.length + 1));
                }, 16);

                return () => window.clearTimeout(timeoutId);
            }

            setPhase("idle");
        }
    }, [displayedText, phase, text]);

    return (
        <span className={className}>
            {displayedText}
            {phase !== "idle" && (
                <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity }}
                    className="ml-0.5 inline-block text-green-300"
                >
                    |
                </motion.span>
            )}
        </span>
    );
}

export function CurrentlyPlayingBox({
    title,
    artists,
    imageUrl,
    isPlaying = false,
    onClick,
}: CurrentlyPlayingBoxProps) {
    const hasTrack = Boolean(title);
    const artistText = artists?.join(", ") || "Spotify";

    return (
        <motion.button
            type="button"
            whileHover={{ scale: hasTrack ? 1.015 : 1 }}
            whileTap={{ scale: hasTrack ? 0.985 : 1 }}
            onClick={hasTrack ? onClick : undefined}
            disabled={!hasTrack}
            className="group relative flex min-w-0 max-w-[180px] items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-left shadow-lg shadow-black/10 backdrop-blur-xl transition hover:bg-white/[0.08] disabled:cursor-default disabled:opacity-70 sm:max-w-xs sm:gap-3 sm:px-3 lg:max-w-md"
        >
            {imageUrl && (
                <>
                    <div className="absolute inset-0 opacity-45">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt=""
                            className="h-full w-full scale-150 object-cover blur-2xl"
                        />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-[#151823]/55 to-black/35" />
                    <div className="absolute inset-0 bg-white/[0.03] opacity-0 transition group-hover:opacity-100" />
                </>
            )}

            {!imageUrl && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-green-500/[0.06]" />
            )}

            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.08] ring-1 ring-white/10">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={`${title ?? "Current track"} cover`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        <Music2 size={14} strokeWidth={2.2} />
                    </div>
                )}

                {isPlaying && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#0f1117] bg-green-400" />
                )}
            </div>

            <div className="relative min-w-0">
                <p className="truncate text-xs font-medium text-white">
                    <TypewriterText text={title ?? "Nothing playing"} />
                </p>

                <p className="hidden truncate text-[11px] text-zinc-300 sm:block">
                    <TypewriterText text={artistText} />
                </p>
            </div>
        </motion.button>
    );
}