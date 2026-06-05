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

type JsonOrText<T extends object> = T | { rawText: string };

async function readJsonOrText<T extends object>(
  res: Response
): Promise<JsonOrText<T>> {
  const text = await res.text();

  if (!text) {
    return { rawText: "" };
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return { rawText: text };
  }
}


function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function isRawText<T extends object>(
  value: JsonOrText<T>
): value is { rawText: string } {
  return "rawText" in value;
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
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        {
          error: true,
          message: "Missing prompt",
          step: "validate_request",
        },
        { status: 400 }
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
        { status: 500 }
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

The "tracks" array must contain exactly 15 objects.

Important output rules:
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations.
- Do not include comments.
- Do not include text before or after the JSON.
- Every item must have exactly one field: "query".
- Each query must be concise and Spotify-searchable.
- Each query should usually be formatted as: "Artist Name Song Title".
- For anime/game/movie/show soundtrack requests, always prefer official artist/composer + exact song title.
- For OST tracks, use composer name + track title, for example "Shiro Sagisu Number One".
- Do not use hyphens between artist and song title unless the hyphen is part of the official title.
- Do not invent fake songs.
- Do not invent fake artists.
- Avoid duplicate artists unless the artist is highly central to the prompt.
- Avoid duplicate tracks.
- Prefer tracks likely to exist on Spotify.

If mode is "artist":
- The user is asking for music similar to the named artist or artists.
- First identify the intended music artist, not just the literal word.
- Include some tracks by the requested artist if relevant.
- Include tracks by similar artists with matching genre, energy, production style, vocal style, language, era, and scene.
- Do not randomly switch to unrelated artists from another country/language unless the prompt asks for that.
- If the artist is Japanese, Korean, Spanish, Dutch, etc., prefer music from the same or closely related scene.
- If the prompt says "like artist A and artist B", blend both artists' styles.
- Use recognizable songs plus some deeper but real picks.

If the user asks for an anime, game, movie, show, series, franchise, soundtrack, opening, ending, OST, OP, ED, theme song, or character-related playlist:
- Treat the title as a media franchise, not as a normal word.
- Identify the intended anime/game/movie/show first.
- Generate official opening themes, ending themes, insert songs, OST tracks, and closely related official music.
- Prefer exact artist + song title queries.
- Include the franchise name only when it helps Spotify search, but the query should still contain the real artist and song title.
- Do not include unrelated mainstream artists unless they are actually connected to the franchise.
- Do not interpret anime titles literally. For example, "Bleach" means the anime Bleach, not cleaning products, colors, or unrelated songs.
- For Japanese anime, prefer Japanese artists, official soundtrack composers, and songs actually used in that anime.
- Avoid fan covers, remixes, AMVs, nightcore, slowed versions, sped-up versions, karaoke, and unofficial tribute songs unless the user asks for them.

If mode is "vibe":
- The user is asking for a mood, setting, genre, activity, or aesthetic.
- Translate the vibe into real songs that match the emotional tone, tempo, genre, and atmosphere.
- Prefer variety across artists while keeping the playlist coherent.
- If the prompt mentions a genre, stay close to that genre.
- If the prompt mentions an activity, choose tracks that fit that activity.

Quality rules:
- Prioritize accurate real-world music matches over obscure guesses.
- Prefer tracks with strong Spotify availability.
- Prefer official artist names and official song titles.
- Avoid covers, remixes, live versions, sped-up versions, and karaoke versions unless the prompt asks for them.
- Avoid generic searches like "sad song" or "rock music".
- Avoid album-only queries. Search queries must point to tracks.
- Do not include explanation fields, genres, reasons, confidence scores, or metadata.

Examples:

User request: "make a playlist containing bleach anime openings endings and ost"
Mode: "vibe"
Good queries:
{ "query": "ORANGE RANGE Asterisk" }
{ "query": "UVERworld D-tecnoLife" }
{ "query": "High and Mighty Color Ichirin no Hana" }
{ "query": "YUI Rolling star" }
{ "query": "Aqua Timez ALONES" }
{ "query": "KELUN CHU-BURA" }
{ "query": "SCANDAL Shoujo S" }
{ "query": "SID Ranbu no Melody" }
{ "query": "miwa chAngE" }
{ "query": "Shiro Sagisu Number One" }
{ "query": "Shiro Sagisu Treachery" }
{ "query": "Shiro Sagisu Invasion" }

User request: "Music like Ado"
Mode: "artist"
Good queries:
{ "query": "Ado Usseewa" }
{ "query": "Ado Odo" }
{ "query": "Ado New Genesis" }
{ "query": "Eve Kaikai Kitan" }
{ "query": "YOASOBI Idol" }
{ "query": "ZUTOMAYO Byoushinwo Kamu" }
{ "query": "yama Haru wo Tsugeru" }
{ "query": "Reol No title" }
{ "query": "LiSA Gurenge" }
{ "query": "Kenshi Yonezu KICK BACK" }

User request: "math rock"
Mode: "vibe"
Good queries:
{ "query": "toe Goodbye" }
{ "query": "Covet Shibuya" }
{ "query": "CHON Bubble Dream" }
{ "query": "American Football Never Meant" }
{ "query": "Tricot POOL" }

User request: "late night coding, dark synthwave, no vocals"
Mode: "vibe"
Good queries:
{ "query": "HOME Resonance" }
{ "query": "Kavinsky Nightcall" }
{ "query": "Timecop1983 On the Run" }
{ "query": "Perturbator Future Club" }

Now generate exactly 15 Spotify search queries for the user's request.
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
          temperature: 0.25,
          response_format: {
            type: "json_object",
          },
        }),
      }
    );

    const aiData = await readJsonOrText<GroqResponse>(aiRes);

    const aiContent = isRawText(aiData)
      ? null
      : aiData.choices?.[0]?.message?.content ?? null;

    const aiError = isRawText(aiData)
      ? aiData.rawText
      : aiData.error?.message ?? null;

    logStep("Groq response", {
      status: aiRes.status,
      ok: aiRes.ok,
      hasContent: Boolean(aiContent),
      contentPreview: aiContent?.slice(0, 500),
      error: aiError,
    });

    if (!aiRes.ok) {
      const message = isRawText(aiData)
        ? aiData.rawText || "AI request failed"
        : aiData.error?.message ?? "AI request failed";

      return Response.json(
        {
          error: true,
          message:
            aiRes.status === 429
              ? "Too many AI requests. Please wait a bit and try again."
              : message,
          details: aiData,
          step: "ai_request",
        },
        { status: aiRes.status }
      );
    }

    if (isRawText(aiData)) {
      return Response.json(
        {
          error: true,
          message: "AI returned a non-JSON response",
          rawContent: aiData.rawText,
          step: "ai_response_format",
        },
        { status: 500 }
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
        { status: 500 }
      );
    }

    const queries = uniqueStrings(
      parsed
        .map((item) => item.query)
        .filter((query): query is string => typeof query === "string")
    ).slice(0, 15);

    logStep("Parsed AI queries", {
      count: queries.length,
      queries,
    });

    if (!queries.length) {
      return Response.json(
        {
          error: true,
          message: "AI generated no usable track queries",
          step: "parse_ai_queries",
        },
        { status: 500 }
      );
    }

    const foundTracks: SpotifyTrack[] = [];
    const foundUris: string[] = [];
    const searchFailures: {
      query: string;
      status: number;
      error?: unknown;
    }[] = [];

    logStep("Starting Spotify search", {
      queryCount: queries.length,
    });

    for (const query of queries) {
      const searchUrl = new URL("https://api.spotify.com/v1/search");
      searchUrl.searchParams.set("q", query);
      searchUrl.searchParams.set("type", "track");
      searchUrl.searchParams.set("limit", "1");
      searchUrl.searchParams.set("market", "NL");

      let searchRes: globalThis.Response = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (searchRes.status === 429) {
        const retryAfterHeader = searchRes.headers.get("retry-after");
        const retryAfterSeconds = Number(retryAfterHeader);

        const waitMs = Number.isFinite(retryAfterSeconds)
          ? retryAfterSeconds * 1000
          : 1500;

        logStep("Spotify search rate limited, retrying", {
          query,
          retryAfterHeader,
          waitMs,
        });

        await sleep(waitMs);

        searchRes = await fetch(searchUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }

      const searchData = await readJsonOrText<SpotifySearchResponse>(searchRes);

      const foundCount = isRawText(searchData)
        ? 0
        : searchData.tracks?.items?.length ?? 0;

      const firstTrack = isRawText(searchData)
        ? null
        : searchData.tracks?.items?.[0] ?? null;

      const searchError = isRawText(searchData)
        ? searchData.rawText
        : searchData.error?.message ?? null;

      logStep("Spotify search result", {
        query,
        status: searchRes.status,
        ok: searchRes.ok,
        foundCount,
        firstTrack: firstTrack
          ? {
            id: firstTrack.id,
            name: firstTrack.name,
            uri: firstTrack.uri,
            artists: firstTrack.artists?.map((artist) => artist.name),
          }
          : null,
        error: searchError,
      });

      if (!searchRes.ok) {
        searchFailures.push({
          query,
          status: searchRes.status,
          error: searchError,
        });

        if (searchRes.status === 429) {
          return Response.json(
            {
              error: true,
              message:
                "Spotify search is rate-limiting requests. Please wait a bit and try again.",
              step: "spotify_search_rate_limited",
              query,
              details: searchData,
            },
            { status: 429 }
          );
        }

        continue;
      }

      if (isRawText(searchData)) {
        searchFailures.push({
          query,
          status: searchRes.status,
          error: searchData.rawText,
        });

        continue;
      }

      const track = searchData.tracks?.items?.[0];

      if (track?.uri && !foundUris.includes(track.uri)) {
        foundTracks.push(track);
        foundUris.push(track.uri);
      }

      await sleep(250); // Avoid hitting Spotify rate limits
    }

    logStep("Spotify search complete", {
      foundTrackCount: foundTracks.length,
      foundUriCount: foundUris.length,
      searchFailureCount: searchFailures.length,
      searchFailures,
      foundTracks: foundTracks.map((track) => ({
        id: track.id,
        name: track.name,
        uri: track.uri,
        artists: track.artists?.map((artist) => artist.name),
      })),
    });

    if (!foundTracks.length) {
      return Response.json(
        {
          error: true,
          message: "No matching Spotify tracks found",
          step: "spotify_search",
          queries,
          searchFailures,
        },
        { status: 404 }
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
        searchFailureCount: searchFailures.length,
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
      { status: 500 }
    );
  }
}