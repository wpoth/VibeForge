import { getPlaylistItems, getSavedTracksPage } from "@/lib/spotify";
import { LIKED_SONGS_PLAYLIST_ID } from "@/lib/spotify-types";

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : "Unknown error";
}

export async function POST(req: Request) {
    try {
        const { accessToken, playlistId, limit = 50, offset = 0 } = (await req.json()) as {
            accessToken?: string;
            playlistId?: string;
            limit?: number;
            offset?: number;
        };

        if (!accessToken || !playlistId) {
            return Response.json(
                { error: "Missing accessToken or playlistId" },
                { status: 400 },
            );
        }

        if (playlistId === LIKED_SONGS_PLAYLIST_ID) {
            const page = await getSavedTracksPage({
                accessToken,
                limit,
                offset,
            });

            return Response.json({
                success: true,
                isPaged: true,
                count: page.items.length,
                total: page.total,
                limit: page.limit,
                offset: page.offset,
                nextOffset: page.nextOffset,
                hasMore: page.hasMore,
                items: page.items,
            });
        }

        const items = await getPlaylistItems(accessToken, playlistId);

        return Response.json({
            success: true,
            isPaged: false,
            count: items.length,
            total: items.length,
            nextOffset: null,
            hasMore: false,
            items,
        });
    } catch (err: unknown) {
        return Response.json(
            { error: true, message: getErrorMessage(err) },
            { status: 500 },
        );
    }
}