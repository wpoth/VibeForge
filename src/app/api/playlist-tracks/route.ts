import { getPlaylistItems } from "@/lib/spotify";

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
        { status: 400 }
      );
    }

    const items = await getPlaylistItems(accessToken, playlistId);

    return Response.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (err: unknown) {
    return Response.json(
      { error: true, message: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
