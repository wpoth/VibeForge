import { spotifyFetch } from "@/lib/spotify";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { playlistId } = await req.json();

    if (!session?.accessToken) {
      return Response.json(
        { error: "No session access token" },
        { status: 401 }
      );
    }

    const data = await spotifyFetch(
      `/playlists/${playlistId}`,
      session.accessToken
    );

    const tracks =
      data.tracks?.items?.map((t: any) => {
        const track = t.item;

        return {
          id: track.id,
          name: track.name,
          artists: track.artists?.map((a: any) => a.name) ?? [],
        };
      }) ?? [];

    return Response.json({
      id: data.id,
      name: data.name,
      description: data.description,
      image: data.images?.[0]?.url ?? null,
      tracks,
    });
  } catch (err: any) {
    return Response.json(
      {
        error: true,
        message: err.message,
      },
      { status: 500 }
    );
  }
}