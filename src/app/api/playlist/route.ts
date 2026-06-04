import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
      snapshot_id: data.snapshot_id,
      items:
        data.tracks?.items?.map((t: any, index: number) => ({
          position: index,
          added_at: t.added_at,
          added_by: t.added_by,
          track: {
            id: t.track?.id ?? t.item?.id,
            uri: t.track?.uri ?? t.item?.uri,
            name: t.track?.name ?? t.item?.name,
            artists:
              (t.track?.artists ?? t.item?.artists)?.map((a: any) => ({
                name: a.name,
              })) ?? [],
            album: t.track?.album ?? t.item?.album,
          },
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