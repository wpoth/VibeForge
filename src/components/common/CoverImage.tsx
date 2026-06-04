import { getBestImage } from "@/lib/ui-helpers";
import type { SpotifyImage } from "@/lib/spotify-types";

type CoverImageProps = {
    images?: SpotifyImage[];
    alt: string;
    size?: "sm" | "md" | "lg";
};

const sizeClasses = {
    sm: "w-12 h-12 rounded-lg",
    md: "w-14 h-14 rounded-xl",
    lg: "w-32 h-32 rounded-2xl",
};

export function CoverImage({ images, alt, size = "md" }: CoverImageProps) {
    const imageUrl = getBestImage(images);

    return (
        <div
            className={`${sizeClasses[size]} bg-zinc-800 overflow-hidden shrink-0 shadow-lg border border-white/10`}
        >
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                    ♪
                </div>
            )}
        </div>
    );
}