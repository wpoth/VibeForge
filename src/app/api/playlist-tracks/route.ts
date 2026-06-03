import { getPlaylistTracks } from "@/lib/spotify";

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    console.log("RAW BODY:", raw);

    const { accessToken, playlistId } = JSON.parse(raw || "{}");

    console.log("accessToken exists:", !!accessToken);
    console.log("playlistId:", playlistId);

    if (!accessToken || !playlistId) {
      return Response.json(
        {
          error: "Missing data",
          accessToken: !!accessToken,
          playlistId,
        },
        { status: 400 }
      );
    }
    
    if (!accessToken) {
      return Response.json({ error: "NO ACCESS TOKEN" });
    }

    const tracks = await getPlaylistTracks(accessToken, playlistId);

    return Response.json(tracks);
  } catch (err: any) {
    console.error("API CRASH:", err);

    return Response.json(
      {
        error: "Server crashed",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}