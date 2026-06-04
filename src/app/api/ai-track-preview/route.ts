type AiTrackSuggestion = {
  query: string;
};

type GroqResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
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
  album?: {
    name?: string;
    images?: {
      url: string;
      height?: number | null;
      width?: number | null;
    }[];
  };
};

type SpotifySearchResponse = {
  tracks?: {
    items?: SpotifyTrack[];
  };
  error?: {
    message?: string;
  };
};

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function safeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

function logStep(step: string, data?: unknown) {
  console.log(`[AI_TRACK_PREVIEW] ${step}`, data ?? "");
}

function logError(step: string, data?: unknown) {
  console.error(`[AI_TRACK_PREVIEW_ERROR] ${step}`, data ?? "");
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    logStep("START");

    const {
      accessToken,
      prompt,
      mode,
    }: {
      accessToken?: string;
      prompt?: string;
      mode?: string;
    } = await req.json();

    logStep("Request body received", {
      hasAccessToken: Boolean(accessToken),
      prompt,
      mode,
    });

    if (!accessToken) {
      return Response.json(
        {
          error: true,
          message: "Missing access token",
          step: "validate_request",
        },
        { status: 400 },
      );
    }

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        {
          error: true,
          message: "Missing prompt",
          step: "validate_request",
        },
        { status: 400 },
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return Response.json(
        {
          error: true,
          message: "Missing GROQ_API_KEY",
          step: "environment",
        },
        { status: 500 },
      );
    }

    const aiPrompt = `
You are VibeForge, an expert Spotify playlist curator.

Your job is to generate Spotify track search queries that will be used by the Spotify Search API.
The output must be easy for Spotify to match to real tracks.

User request:
"${prompt}"

Mode:
"${mode ?? "vibe"}"

Return ONLY valid JSON with this exact shape:
{
  "tracks": [
    { "query": "artist name song title" }
  ]
}

The "tracks" array must contain exactly 25 objects.

Important output rules:
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations.
- Do not include comments.
- Do not include text before or after the JSON.
- Every item must have exactly one field: "query".
- Each query must be concise and Spotify-searchable.
- Each query should usually be formatted as: "Artist Name Song Title".
- Do not invent fake songs.
- Do not invent fake artists.
- No duplicate tracks.
- Prefer tracks likely to exist on Spotify.

If mode is "artist":
- The user is asking for music similar to the named artist or artists.
- First identify the intended music artist, not just the literal word.
- Include some tracks by the requested artist if relevant.
- Include tracks by similar artists with matching genre, energy, production style, vocal style, language, era, and scene.
- Do not randomly switch to unrelated artists from another country/language unless the prompt asks for that.
- If the artist is Japanese, Korean, Spanish, Dutch, etc., prefer music from the same or closely related scene.
- If the prompt says "like artist A and artist B", blend both artists' styles.

If mode is "vibe":
- The user is asking for a mood, setting, genre, activity, or aesthetic.
- Translate the vibe into real songs that match the emotional tone, tempo, genre, and atmosphere.
- Prefer variety across artists while keeping the playlist coherent.
- If the prompt mentions a genre, stay close to that genre.
- If the prompt mentions an activity, choose tracks that fit that activity.

Quality rules:
- Prioritize accurate real-world music matches over obscure guesses.
- Prefer official artist names and official song titles.
- Avoid covers, remixes, live versions, sped-up versions, and karaoke versions unless the prompt asks for them.
- Avoid generic searches like "sad song" or "rock music".
- Avoid album-only queries. Search queries must point to tracks.
- Do not include explanation fields, genres, reasons, confidence scores, or metadata.

Now generate exactly 25 Spotify search queries for the user's request.
`;

    logStep("Sending request to Groq", {
      model: "llama-3.1-8b-instant",
      promptLength: aiPrompt.length,
    });

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
                "You generate accurate Spotify track search queries. Return valid JSON only.",
            },
            {
              role: "user",
              content: aiPrompt,
            },
          ],
          temperature: 0.45,
          response_format: {
            type: "json_object",
          },
        }),
      },
    );

    const aiData = (await aiRes.json()) as GroqResponse;

    logStep("Groq response", {
      status: aiRes.status,
      ok: aiRes.ok,
      hasContent: Boolean(aiData.choices?.[0]?.message?.content),
      contentPreview: aiData.choices?.[0]?.message?.content?.slice(0, 500),
      error: aiData.error,
    });

    if (!aiRes.ok) {
      return Response.json(
        {
          error: true,
          message: aiData.error?.message ?? "AI request failed",
          details: aiData,
          step: "ai_request",
        },
        { status: aiRes.status },
      );
    }

    const content = aiData.choices?.[0]?.message?.content ?? "";

    let parsed: AiTrackSuggestion[];

    try {
      const json = JSON.parse(content) as {
        tracks?: AiTrackSuggestion[];
      };

      parsed = Array.isArray(json.tracks) ? json.tracks : [];
    } catch (error) {
      logError("Failed to parse AI JSON", {
        error: safeError(error),
        rawContent: content,
      });

      return Response.json(
        {
          error: true,
          message: "AI returned invalid JSON",
          rawContent: content,
          step: "parse_ai_json",
        },
        { status: 500 },
      );
    }

    const queries = uniqueStrings(
      parsed
        .map((item) => item.query)
        .filter((query): query is string => typeof query === "string"),
    ).slice(0, 25);

    if (!queries.length) {
      return Response.json(
        {
          error: true,
          message: "AI generated no usable track queries",
          step: "parse_ai_queries",
        },
        { status: 500 },
      );
    }

    const foundTracks: SpotifyTrack[] = [];
    const foundUris: string[] = [];
    const searchFailures: {
      query: string;
      status: number;
      error?: unknown;
    }[] = [];

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
        searchFailures.push({
          query,
          status: searchRes.status,
          error: searchData.error,
        });

        continue;
      }

      const track = searchData.tracks?.items?.[0];

      if (track?.uri && !foundUris.includes(track.uri)) {
        foundTracks.push(track);
        foundUris.push(track.uri);
      }
    }

    if (!foundTracks.length) {
      return Response.json(
        {
          error: true,
          message: "No matching Spotify tracks found",
          step: "spotify_search",
          queries,
          searchFailures,
        },
        { status: 404 },
      );
    }

    const responsePayload = {
      success: true,
      tracks: foundTracks.map((track) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        artists:
          track.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
        album: track.album?.name,
        imageUrl: track.album?.images?.[0]?.url ?? null,
      })),
      debug: {
        prompt,
        mode: mode ?? "vibe",
        generatedQueries: queries,
        foundTrackCount: foundTracks.length,
        durationMs: Date.now() - startedAt,
      },
    };

    logStep("SUCCESS", responsePayload);

    return Response.json(responsePayload);
  } catch (error) {
    logError("Unhandled route error", {
      error: safeError(error),
      durationMs: Date.now() - startedAt,
    });

    return Response.json(
      {
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate track preview",
        step: "unhandled_error",
      },
      { status: 500 },
    );
  }
}
