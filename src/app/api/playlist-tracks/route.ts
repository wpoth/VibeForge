import { getPlaylistTracks } from "@/lib/spotify";

export async function POST(req: Request) {
  try {
    const { accessToken, playlistId } = await req.json();

    if (!accessToken || !playlistId) {
      return Response.json({ error: "Missing data" }, { status: 400 });
    }

    const tracks = await getPlaylistTracks(accessToken, playlistId);

    return Response.json(tracks);
  } catch (err: any) {
    console.error("PLAYLIST TRACKS CRASH:", err);

    return Response.json(
      {
        error: true,
        message: err.message,
      },
      { status: 500 }
    );
  }
}