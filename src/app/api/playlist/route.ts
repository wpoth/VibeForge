export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { playlistId } = await req.json();

    if (!session?.accessToken) {
      return Response.json({ error: "No session" }, { status: 401 });
    }

    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        { error: true, spotify: data },
        { status: res.status }
      );
    }

    return Response.json({
      id: data.id,
      name: data.name,
      tracks:
        data.tracks?.items?.map((t: any) => ({
          id: t.item.id,
          name: t.item.name,
          artists: t.item.artists?.map((a: any) => a.name) ?? [],
        })) ?? [],
    });
  } catch (err: any) {
    console.error(err);

    return Response.json(
      { error: true, message: err.message },
      { status: 500 }
    );
  }
}