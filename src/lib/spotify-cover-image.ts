const MAX_SPOTIFY_COVER_BYTES = 256 * 1024;

export type PreparedSpotifyCoverImage = {
    imageBase64: string;
    previewUrl: string;
    sizeBytes: number;
};

export function getBase64ByteSize(base64: string) {
    const cleanBase64 = base64.replace(/^data:image\/jpeg;base64,/, "");
    const padding = cleanBase64.endsWith("==")
        ? 2
        : cleanBase64.endsWith("=")
            ? 1
            : 0;

    return Math.floor((cleanBase64.length * 3) / 4) - padding;
}

function copyCanvasToSize(sourceCanvas: HTMLCanvasElement, size: number) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Could not prepare image canvas.");
    }

    context.drawImage(sourceCanvas, 0, 0, size, size);

    return canvas;
}

export function compressSpotifyCoverCanvas(
    sourceCanvas: HTMLCanvasElement,
): PreparedSpotifyCoverImage {
    const sizes = [640, 512, 384, 300];
    const qualities = [0.92, 0.86, 0.8, 0.72, 0.64, 0.56, 0.48, 0.42];

    for (const size of sizes) {
        const canvas = copyCanvasToSize(sourceCanvas, size);

        for (const quality of qualities) {
            const previewUrl = canvas.toDataURL("image/jpeg", quality);
            const imageBase64 = previewUrl.replace(/^data:image\/jpeg;base64,/, "");
            const sizeBytes = getBase64ByteSize(imageBase64);

            if (sizeBytes <= MAX_SPOTIFY_COVER_BYTES) {
                return {
                    imageBase64,
                    previewUrl,
                    sizeBytes,
                };
            }
        }
    }

    throw new Error(
        "Could not compress this image under Spotify's 256 KB cover limit. Try a simpler image.",
    );
}