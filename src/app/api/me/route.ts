import { getSpotifyProfile } from "@/lib/spotify";

export async function POST(req: Request) {
  const { accessToken } = await req.json();

  if (!accessToken) {
    return Response.json({ error: "No token" }, { status: 401 });
  }

  const profile = await getSpotifyProfile(accessToken);

  return Response.json(profile);
}