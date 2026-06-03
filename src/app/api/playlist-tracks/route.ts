import { getPlaylistTracks } from "@/lib/spotify";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const accessToken = body?.accessToken;
    const playlistId = body?.playlistId;

    if (!accessToken || !playlistId) {
      return Response.json(
        { error: "Missing accessToken or playlistId" },
        { status: 400 }
      );
    }

    const tracks = await getPlaylistTracks(accessToken, playlistId);

    return Response.json({
      tracks,
    });
  } catch (err: any) {
    console.error("PLAYLIST TRACKS CRASH:", {
      message: err.message,
      stack: err.stack,
    });

    return Response.json(
      {
        error: true,
        message: err.message,
      },
      { status: 500 }
    );
  }
}