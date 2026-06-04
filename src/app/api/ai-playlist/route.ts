type AiTrackSuggestion = {
  query: string;
};

type GroqResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
};

type SpotifyUserResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

type SpotifyTrack = {
  id?: string;
  uri?: string;
  name?: string;
  artists?: {
    name?: string;
  }[];
};

type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifyTrack[];
  };
  error?: {
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
    message?: string;
  };
};

function extractJsonArray(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI did not return a valid JSON array");
  }

  return text.slice(start, end + 1);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function POST(req: Request) {
  try {
    const { accessToken, prompt, mode, playlistName, isPublic } =
      await req.json();

    if (!accessToken) {
      return Response.json(
        { error: true, message: "Missing access token" },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: true, message: "Missing prompt" },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return Response.json(
        { error: true, message: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }

    const meRes: globalThis.Response = await fetch(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const meData = (await meRes.json()) as SpotifyUserResponse;

    if (!meRes.ok || !meData.id) {
      return Response.json(
        {
          error: true,
          message: meData?.error?.message ?? "Failed to fetch Spotify user",
          details: meData,
        },
        { status: meRes.status }
      );
    }

    const aiPrompt = `
You are helping create a Spotify playlist.

User request:
"${prompt}"

Mode:
"${mode ?? "vibe"}"

Return ONLY a JSON array of 25 objects.
Each object must have this shape:
{ "query": "artist name song title" }

Rules:
- Use real songs and artists.
- Match the user's vibe or artist-based request.
- Avoid duplicates.
- Use a mix of obvious and slightly deeper picks.
- Do not include explanations.
- Do not include markdown.
- Do not include anything outside the JSON array.
`;

    const aiRes: globalThis.Response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You generate Spotify track search queries as strict JSON.",
            },
            {
              role: "user",
              content: aiPrompt,
            },
          ],
          temperature: 0.8,
        }),
      }
    );

    const aiData = (await aiRes.json()) as GroqResponse;

    if (!aiRes.ok) {
      return Response.json(
        {
          error: true,
          message: "AI request failed",
          details: aiData,
        },
        { status: aiRes.status }
      );
    }

    const content = aiData.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(extractJsonArray(content)) as AiTrackSuggestion[];

    const queries = uniqueStrings(
      parsed
        .map((item) => item.query)
        .filter((query): query is string => typeof query === "string")
    ).slice(0, 25);

    if (!queries.length) {
      return Response.json(
        { error: true, message: "AI generated no usable track queries" },
        { status: 500 }
      );
    }

    const foundTracks: SpotifyTrack[] = [];
    const foundUris: string[] = [];

    for (const query of queries) {
      const searchUrl = new URL("https://api.spotify.com/v1/search");
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("type", "track");
      searchUrl.searchParams.set("limit", "1");
      searchUrl.searchParams.set("market", "NL");

      const searchRes: globalThis.Response = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const searchData = (await searchRes.json()) as SpotifySearchResponse;

      if (!searchRes.ok) {
        console.error("Spotify search failed:", searchData);
        continue;
      }

      const track = searchData.tracks?.items?.[0];

      if (track?.uri && !foundUris.includes(track.uri)) {
        foundTracks.push(track);
        foundUris.push(track.uri);
      }
    }

    if (!foundUris.length) {
      return Response.json(
        { error: true, message: "No matching Spotify tracks found" },
        { status: 404 }
      );
    }

    const finalPlaylistName =
      playlistName?.trim() ||
      `VibeForge - ${prompt.trim().slice(0, 40)}`;

    const createPlaylistRes: globalThis.Response = await fetch(
      `https://api.spotify.com/v1/users/${meData.id}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: finalPlaylistName,
          description: `Generated by VibeForge from prompt: "${prompt}"`,
          public: Boolean(isPublic),
        }),
      }
    );

    const createdPlaylist =
      (await createPlaylistRes.json()) as SpotifyCreatePlaylistResponse;

    if (!createPlaylistRes.ok || !createdPlaylist.id) {
      return Response.json(
        {
          error: true,
          message:
            createdPlaylist?.error?.message ?? "Failed to create playlist",
          details: createdPlaylist,
        },
        { status: createPlaylistRes.status }
      );
    }

    const addItemsRes: globalThis.Response = await fetch(
      `https://api.spotify.com/v1/playlists/${createdPlaylist.id}/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: foundUris.slice(0, 100),
        }),
      }
    );

    const addItemsData = await addItemsRes.json();

    if (!addItemsRes.ok) {
      return Response.json(
        {
          error: true,
          message: "Playlist was created, but adding tracks failed",
          playlist: createdPlaylist,
          details: addItemsData,
        },
        { status: addItemsRes.status }
      );
    }

    return Response.json({
      success: true,
      playlist: {
        id: createdPlaylist.id,
        name: createdPlaylist.name,
        url: createdPlaylist.external_urls?.spotify,
      },
      tracks: foundTracks.map((track) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        artists:
          track.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
      })),
    });
  } catch (error) {
    console.error("AI playlist route error:", error);

    return Response.json(
      {
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate playlist",
      },
      { status: 500 }
    );
  }
}