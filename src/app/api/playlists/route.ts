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

    // Fetch ALL playlists (Spotify paginates)
    let url = "https://api.spotify.com/v1/me/playlists?limit=50";
    let allPlaylists: any[] = [];

    while (url) {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();

      if (!res.ok) {
        return Response.json({ error: data }, { status: res.status });
      }

      allPlaylists.push(...data.items);
      url = data.next;
    }

    // Filter: owner, collaborative, public
    const filtered = allPlaylists.filter(
      (p: any) =>
        p.owner?.id === spotifyId ||
        p.collaborative === true ||
        p.public === true
    );

    return Response.json({ items: filtered });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
