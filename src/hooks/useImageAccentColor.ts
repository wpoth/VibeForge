"use client";

import { FastAverageColor } from "fast-average-color";
import { useEffect, useState } from "react";

type AccentColor = {
    rgb: string;
    rgbaSoft: string;
    rgbaMedium: string;
    rgbaStrong: string;
};

const fallbackColor: AccentColor = {
    rgb: "34, 197, 94",
    rgbaSoft: "rgba(34, 197, 94, 0.12)",
    rgbaMedium: "rgba(34, 197, 94, 0.25)",
    rgbaStrong: "rgba(34, 197, 94, 0.45)",
};

export function useImageAccentColor(imageUrl?: string | null) {
    const [accentColor, setAccentColor] = useState<AccentColor>(fallbackColor);

    useEffect(() => {
        if (!imageUrl) {
            setAccentColor(fallbackColor);
            return;
        }

        const safeImageUrl = imageUrl;
        let cancelled = false;
        const colorExtractor = new FastAverageColor();

        async function extractColor() {
            try {
                const color = await colorExtractor.getColorAsync(safeImageUrl, {
                    algorithm: "dominant",
                    crossOrigin: "anonymous",
                });

                if (cancelled) return;

                const [r, g, b] = color.value;

                setAccentColor({
                    rgb: `${r}, ${g}, ${b}`,
                    rgbaSoft: `rgba(${r}, ${g}, ${b}, 0.12)`,
                    rgbaMedium: `rgba(${r}, ${g}, ${b}, 0.25)`,
                    rgbaStrong: `rgba(${r}, ${g}, ${b}, 0.45)`,
                });
            } catch {
                if (!cancelled) {
                    setAccentColor(fallbackColor);
                }
            }
        }

        void extractColor();

        return () => {
            cancelled = true;
            colorExtractor.destroy();
        };
    }, [imageUrl]);

    return accentColor;
}