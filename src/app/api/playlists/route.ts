export async function POST(req: Request) {
  try {
    const { accessToken, spotifyId } = await req.json();

    if (!accessToken || !spotifyId) {
      return Response.json(
        { error: "Missing accessToken or spotifyId" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.spotify.com/v1/users/${spotifyId}/playlists`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: true, message: data },
        { status: res.status }
      );
    }

    // ✅ Normalize playlists
    const playlists = (data.items ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.images?.[0]?.url ?? null,
      trackCount: p.tracks?.total ?? 0,
    }));

    return Response.json({ playlists });
  } catch (err: any) {
    return Response.json(
      { error: true, message: err.message },
      { status: 500 }
    );
  }
}