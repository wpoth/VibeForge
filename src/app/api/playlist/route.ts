export async function POST(req: Request) {
  try {
    const { accessToken, playlistId } = await req.json();

    if (!accessToken || !playlistId) {
      return Response.json(
        { error: "Missing accessToken or playlistId" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data }, { status: res.status });
    }

    return Response.json(data);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
