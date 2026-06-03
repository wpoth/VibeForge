import { getUserPlaylists } from "@/lib/spotify";

export async function POST(req: Request) {
  try {
    const { accessToken, spotifyId } = await req.json();

    if (!accessToken || !spotifyId) {
      return Response.json(
        { error: "Missing accessToken or spotifyId" },
        { status: 400 }
      );
    }

    const playlists = await getUserPlaylists(accessToken);

    // FILTER HERE
    const filtered = playlists.items.filter(
      (p: any) =>
        p.owner?.id === spotifyId || p.collaborative === true
    );

    return Response.json({ items: filtered });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
