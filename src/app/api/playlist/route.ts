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

    // ✅ FLATTEN EVERYTHING
    const tracks =
      data?.tracks?.items?.map((t: any) => {
        const track = t.item; // Spotify wrapper

        return {
          id: track.id,
          name: track.name,
          artists: track.artists?.map((a: any) => a.name) ?? [],
          album: track.album?.name ?? null,
        };
      }) ?? [];

    const playlist = {
      id: data.id,
      name: data.name,
      description: data.description,
      image: data.images?.[0]?.url ?? null,
      tracks,
    };

    return Response.json(playlist);
  } catch (err: any) {
    return Response.json(
      { error: true, message: err.message },
      { status: 500 }
    );
  }
}