import { getPlaylistItems, getSavedTracks } from "@/lib/spotify";
import { LIKED_SONGS_PLAYLIST_ID } from "@/lib/spotify-types";

function getErrorMessage(err: unknown) {
    return err instanceof Error ? err.message : "Unknown error";
}

export async function POST(req: Request) {
    try {
        const { accessToken, playlistId } = (await req.json()) as {
            accessToken?: string;
            playlistId?: string;
        };

        if (!accessToken || !playlistId) {
            return Response.json(
                { error: "Missing accessToken or playlistId" },
                { status: 400 },
            );
        }

        const items =
            playlistId === LIKED_SONGS_PLAYLIST_ID
                ? await getSavedTracks(accessToken, 200)
                : await getPlaylistItems(accessToken, playlistId);

        return Response.json({
            success: true,
            count: items.length,
            items,
        });
    } catch (err: unknown) {
        return Response.json(
            { error: true, message: getErrorMessage(err) },
            { status: 500 },
        );
    }
}