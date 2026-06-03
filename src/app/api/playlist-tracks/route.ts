import { getPlaylistTracks } from "@/lib/spotify";

export async function POST(req: Request) {
  try {
    const { accessToken, playlistId } = await req.json();

    if (!accessToken || !playlistId) {
      return Response.json(
        { error: "Missing accessToken or playlistId" },
        { status: 400 }
      );
    }

    const tracks = await getPlaylistTracks(accessToken, playlistId);

    return Response.json({
      success: true,
      count: tracks.length,
      items: tracks,
    });
  } catch (err: any) {
    return Response.json(
      { error: true, message: err.message },
      { status: 500 }
    );
  }
}
