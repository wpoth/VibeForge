import { getPlaylistTracks } from "@/lib/spotify";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    console.log("\n==============================");
    console.log("/api/playlist-tracks HIT");
    console.log("==============================");

    const body = await req.json();
    console.log(" REQUEST BODY:", body);

    const { playlistId, accessToken } = body;

    console.log(" PLAYLIST ID:", playlistId);
    console.log(" Access token preview:", accessToken?.slice(0, 25));

    // Missing required fields
    if (!playlistId || !accessToken) {
      console.log(" Missing playlistId or accessToken");
      return Response.json(
        { error: "Missing playlistId or accessToken" },
        { status: 400 }
      );
    }

    console.log("\n CALLING SPOTIFY API...");
    const tracks = await getPlaylistTracks(accessToken, playlistId);

    console.log("\n SPOTIFY SUCCESS");
    console.log("Tracks count:", tracks?.length ?? 0);
    console.log("⏱ Duration:", Date.now() - startTime, "ms");

    return Response.json({
      success: true,
      count: tracks?.length ?? 0,
      items: tracks,
    });
  } catch (err: any) {
    console.log("\n PLAYLIST TRACKS CRASH");
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
