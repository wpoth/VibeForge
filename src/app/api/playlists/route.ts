import { spotifyFetch } from "@/lib/spotify";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { spotifyId } = await req.json();

    if (!session?.accessToken) {
      return Response.json(
        { error: "No session access token" },
        { status: 401 }
      );
    }

    const data = await spotifyFetch(
      `/users/${spotifyId}/playlists`,
      session.accessToken
    );

    return Response.json({
      playlists: (data.items ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        trackCount: p.tracks?.total ?? 0,
        image: p.images?.[0]?.url ?? null,
      })),
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