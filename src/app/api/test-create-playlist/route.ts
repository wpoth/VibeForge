type SpotifyUserResponse = {
  id?: string;
  error?: {
    status?: number;
    message?: string;
  };
};

type SpotifyCreatePlaylistResponse = {
  id?: string;
  name?: string;
  external_urls?: {
    spotify?: string;
  };
  error?: {
    status?: number;
    message?: string;
  };
};

export async function POST(req: Request) {
  const { accessToken } = await req.json();

  if (!accessToken) {
    return Response.json(
      { error: true, message: "Missing access token" },
      { status: 400 }
    );
  }

  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const meData = (await meRes.json()) as SpotifyUserResponse;

  if (!meRes.ok || !meData.id) {
    return Response.json(
      {
        error: true,
        message: "Failed /me",
        status: meRes.status,
        details: meData,
      },
      { status: meRes.status }
    );
  }

  const createRes = await fetch(
    `https://api.spotify.com/v1/me/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `VibeForge Test ${new Date().toISOString()}`,
        description: "Temporary test playlist",
        public: false,
      }),
    }
  );

  const createData =
    (await createRes.json()) as SpotifyCreatePlaylistResponse;

  return Response.json(
    {
      meStatus: meRes.status,
      userId: meData.id,
      createStatus: createRes.status,
      createOk: createRes.ok,
      createData,
    },
    { status: createRes.status }
  );
}