import { getUserPlaylists } from "@/lib/spotify";

export async function POST(req: Request) {
  const { accessToken } = await req.json();

  if (!accessToken) {
    return Response.json({ error: "Missing token" }, { status: 401 });
  }

  const playlists = await getUserPlaylists(accessToken);

  return Response.json(playlists);
}