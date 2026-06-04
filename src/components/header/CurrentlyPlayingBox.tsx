type CurrentlyPlayingBoxProps = {
    title?: string;
    artists?: string[];
    imageUrl?: string | null;
    isPlaying: boolean;
};

export function CurrentlyPlayingBox({
    title,
    artists = [],
    imageUrl,
    isPlaying,
}: CurrentlyPlayingBoxProps) {
    if (!title) {
        return (
            <div className="hidden max-w-xs items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 md:flex">
                <div className="h-9 w-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-xs text-zinc-500">
                    ♪
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-400">Nothing playing</p>
                    <p className="truncate text-[11px] text-zinc-600">
                        Start Spotify to show your track
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative hidden max-w-xs overflow-hidden rounded-2xl border border-white/10 px-3 py-2 shadow-lg md:flex">
            {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-50 blur-xl scale-125"
                />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />

            <div className="relative z-10 flex min-w-0 items-center gap-3">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-black/30 ring-1 ring-white/15">
                    {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={imageUrl}
                            alt={`${title} cover`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                            ♪
                        </div>
                    )}
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${isPlaying ? "bg-green-400" : "bg-zinc-500"
                                }`}
                        />
                        <p className="truncate text-xs font-semibold text-white">
                            {title}
                        </p>
                    </div>

                    <p className="truncate text-[11px] text-zinc-300">
                        {artists.join(", ") || "Unknown artist"}
                    </p>
                </div>
            </div>
        </div>
    );
}