import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getPlaylistTracks } from "@/lib/spotify";

export async function POST(req: Request) {
  try {
    const { playlistId } = await req.json();

    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tracks = await getPlaylistTracks(
      session.accessToken,
      playlistId
    );

    return Response.json(tracks);
  } catch (err: any) {
    console.error("PLAYLIST TRACKS CRASH:", err);

    return Response.json(
      {
        error: true,
        message: err.message,
      },
      { status: 500 }
    );
  }
}