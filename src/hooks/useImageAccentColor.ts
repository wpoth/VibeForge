"use client";

import { FastAverageColor } from "fast-average-color";
import { useEffect, useState } from "react";

export type AccentColor = {
  rgb: string;
  rgbaSoft: string;
  rgbaMedium: string;
  rgbaStrong: string;
};

function clamp(value: number, min = 0, max = 255) {
  return Math.min(max, Math.max(min, value));
}

function rgbToHsl(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case red:
        h = (green - blue) / d + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / d + 2;
        break;
      case blue:
        h = (red - green) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) {
    const value = Math.round(l * 255);
    return [value, value, value] as const;
  }

  function hueToRgb(p: number, q: number, t: number) {
    let safeT = t;

    if (safeT < 0) safeT += 1;
    if (safeT > 1) safeT -= 1;
    if (safeT < 1 / 6) return p + (q - p) * 6 * safeT;
    if (safeT < 1 / 2) return q;
    if (safeT < 2 / 3) return p + (q - p) * (2 / 3 - safeT) * 6;

    return p;
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ] as const;
}

function makeVisibleAccentColor(r: number, g: number, b: number) {
  const { h, s, l } = rgbToHsl(r, g, b);

  const boostedSaturation = Math.max(s, 0.58);
  const boostedLightness = Math.min(Math.max(l, 0.52), 0.68);

  const [newR, newG, newB] = hslToRgb(h, boostedSaturation, boostedLightness);

  return {
    r: clamp(newR),
    g: clamp(newG),
    b: clamp(newB),
  };
}

function createAccentColor(r: number, g: number, b: number): AccentColor {
  return {
    rgb: `${r}, ${g}, ${b}`,
    rgbaSoft: `rgba(${r}, ${g}, ${b}, 0.16)`,
    rgbaMedium: `rgba(${r}, ${g}, ${b}, 0.34)`,
    rgbaStrong: `rgba(${r}, ${g}, ${b}, 0.62)`,
  };
}

export function useImageAccentColor(imageUrl?: string | null) {
  const [accentColor, setAccentColor] = useState<AccentColor | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setAccentColor(null);
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

        const [rawR, rawG, rawB] = color.value;
        const visibleColor = makeVisibleAccentColor(rawR, rawG, rawB);

        setAccentColor(
          createAccentColor(visibleColor.r, visibleColor.g, visibleColor.b),
        );
      } catch {
        if (!cancelled) {
          setAccentColor(null);
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
