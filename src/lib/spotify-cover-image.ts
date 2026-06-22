const MAX_SPOTIFY_COVER_BYTES = 256 * 1024;

type PreparedSpotifyCoverImage = {
    imageBase64: string;
    previewUrl: string;
    sizeBytes: number;
};

function getBase64ByteSize(base64: string) {
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - padding;
}

function loadImageFromFile(file: File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not read the selected image."));
        };

        image.src = objectUrl;
    });
}

function drawSquareCover({
    image,
    size,
}: {
    image: HTMLImageElement;
    size: number;
}) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Could not prepare image canvas.");
    }

    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;

    const sourceSize = Math.min(sourceWidth, sourceHeight);
    const sourceX = (sourceWidth - sourceSize) / 2;
    const sourceY = (sourceHeight - sourceSize) / 2;

    context.fillStyle = "#000000";
    context.fillRect(0, 0, size, size);

    context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        size,
        size,
    );

    return canvas;
}

export async function prepareSpotifyCoverImage(
    file: File,
): Promise<PreparedSpotifyCoverImage> {
    if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file.");
    }

    const image = await loadImageFromFile(file);

    const sizes = [640, 512, 384, 300];
    const qualities = [0.92, 0.86, 0.8, 0.72, 0.64, 0.56, 0.48, 0.42];

    for (const size of sizes) {
        const canvas = drawSquareCover({
            image,
            size,
        });

        for (const quality of qualities) {
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            const imageBase64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
            const sizeBytes = getBase64ByteSize(imageBase64);

            if (sizeBytes <= MAX_SPOTIFY_COVER_BYTES) {
                return {
                    imageBase64,
                    previewUrl: dataUrl,
                    sizeBytes,
                };
            }
        }
    }

    throw new Error(
        "Could not compress this image under Spotify's 256 KB cover limit. Try a simpler image.",
    );
}