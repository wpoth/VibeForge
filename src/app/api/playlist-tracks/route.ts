import { getPlaylistTracks } from "@/lib/spotify";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { accessToken, playlistId } = body;

    if (!accessToken || !playlistId) {
      return Response.json(
        { error: "Missing accessToken or playlistId" },
        { status: 400 }
      );
    }

    const tracks = await getPlaylistTracks(accessToken, playlistId);

    return Response.json(tracks);
  } catch (err: any) {
    console.error("playlist-tracks error:", err);

    return Response.json(
      { error: "Server error", details: err?.message },
      { status: 500 }
    );
  }
}