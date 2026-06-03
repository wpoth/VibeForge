import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { getPlaylistTracks } from "@/lib/spotify";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    console.log("\n==============================");
    console.log("📥 /api/playlist-tracks HIT");
    console.log("==============================");

    const body = await req.json();

    console.log("📦 REQUEST BODY:", body);

    const { playlistId } = body;

    console.log("🎵 PLAYLIST ID:", playlistId);

    const session = await getServerSession(authOptions);

    console.log("\n🔐 SESSION DEBUG:");
    console.log("Session exists:", !!session);
    console.log("Has accessToken:", !!session?.accessToken);
    console.log(
      "AccessToken preview:",
      session?.accessToken
        ? session.accessToken.slice(0, 25) + "..."
        : null
    );

    console.log("\n👤 FULL SESSION:");
    console.log(JSON.stringify(session, null, 2));

    if (!session?.accessToken) {
      console.log("❌ NO ACCESS TOKEN - returning 401");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("\n🚀 CALLING SPOTIFY API...");
    console.log("Playlist ID:", playlistId);

    const tracks = await getPlaylistTracks(
      session.accessToken,
      playlistId
    );

    console.log("\n✅ SPOTIFY SUCCESS");
    console.log("Tracks count:", tracks?.length ?? 0);

    console.log("⏱ Duration:", Date.now() - startTime, "ms");

    return Response.json({
      success: true,
      count: tracks?.length ?? 0,
      items: tracks,
    });
  } catch (err: any) {
    console.log("\n💥 PLAYLIST TRACKS CRASH");
    console.error(err);

    return Response.json(
      {
        error: true,
        message: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}