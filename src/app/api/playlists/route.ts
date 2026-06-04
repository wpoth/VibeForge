import { getUserPlaylists } from "@/lib/spotify";

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unknown error";
}

export async function POST(req: Request) {
  try {
    const { accessToken } = (await req.json()) as { accessToken?: string };

    if (!accessToken) {
      return Response.json(
        { error: "Missing accessToken" },
        { status: 400 }
      );
    }

    const playlists = await getUserPlaylists(accessToken);

    return Response.json({ items: playlists });
  } catch (err: unknown) {
    return Response.json(
      { error: true, message: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
