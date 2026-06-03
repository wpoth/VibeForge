import { getPlaylistTracks } from "@/lib/spotify";

export async function POST(req: Request) {
  const { accessToken, playlistId } = await req.json();

  if (!accessToken || !playlistId) {
    return Response.json({ error: "Missing data" }, { status: 400 });
  }

  const tracks = await getPlaylistTracks(accessToken, playlistId);

  return Response.json(tracks);
}