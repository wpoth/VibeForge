import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { spotifyId } = await req.json();

    if (!session?.accessToken) {
      return Response.json(
        { error: true, message: "No session / access token" },
        { status: 401 }
      );
    }

    if (!spotifyId) {
      return Response.json(
        { error: true, message: "Missing spotifyId" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.spotify.com/v1/users/${spotifyId}/playlists`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json(
        {
          error: true,
          status: res.status,
          spotify: data,
        },
        { status: res.status }
      );
    }

    return Response.json({
      playlists: (data.items ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        trackCount: p.tracks?.total ?? 0,
      })),
    });
  } catch (err: any) {
    console.error("PLAYLISTS API CRASH:", err);

    return Response.json(
      {
        error: true,
        message: err.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}