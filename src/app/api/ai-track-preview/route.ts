type AiTrackSuggestion = {
  query: string;
  name?: string;
  artists?: string[];
  source?: string;
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

function isRawText<T extends object>(
  value: JsonOrText<T>
): value is { rawText: string } {
  return "rawText" in value;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeText(value?: string) {
  return (
    value
      ?.normalize("NFKD")
      .toLowerCase()
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function textMatches(expected?: string, actual?: string) {
  const normalizedExpected = normalizeText(expected);
  const normalizedActual = normalizeText(actual);

  if (!normalizedExpected || !normalizedActual) return false;

  return (
    normalizedActual === normalizedExpected ||
    normalizedActual.includes(normalizedExpected) ||
    normalizedExpected.includes(normalizedActual)
  );
}

function spotifyTrackMatchesSuggestion(
  spotifyTrack: SpotifyTrack,
  suggestion: AiTrackSuggestion
) {
  const expectedName = suggestion.name;
  const actualName = spotifyTrack.name;

  const expectedArtists =
    suggestion.artists?.map(normalizeText).filter(Boolean) ?? [];

  const actualArtists =
    spotifyTrack.artists
      ?.map((artist) => normalizeText(artist.name))
      .filter(Boolean) ?? [];

  const nameMatches = expectedName
    ? textMatches(expectedName, actualName)
    : Boolean(spotifyTrack.uri);

  const artistMatches =
    expectedArtists.length === 0 ||
    expectedArtists.some((expectedArtist) =>
      actualArtists.some(
        (actualArtist) =>
          actualArtist === expectedArtist ||
          actualArtist.includes(expectedArtist) ||
          expectedArtist.includes(actualArtist)
      )
    );

  return nameMatches && artistMatches;
}

function buildSpotifySearchQueries(suggestion: AiTrackSuggestion) {
  const query = suggestion.query?.trim();
  const name = suggestion.name?.trim();
  const primaryArtist = suggestion.artists?.[0]?.trim();
  const artists = suggestion.artists?.join(" ").trim();

  const queries = [
    name && primaryArtist ? `track:"${name}" artist:"${primaryArtist}"` : "",
    query,
    [artists, name].filter(Boolean).join(" ").trim(),
  ];

  return Array.from(
    new Set(queries.filter((value): value is string => Boolean(value)))
  );
}

async function searchSpotifyTrack({
  accessToken,
  query,
}: {
  accessToken: string;
  query: string;
}): Promise<{
  track: SpotifyTrack | null;
  status: number;
  error: unknown;
}> {
  const searchUrl = new URL("https://api.spotify.com/v1/search");
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("type", "track");
  searchUrl.searchParams.set("limit", "5");
  searchUrl.searchParams.set("market", "NL");

  const searchRes: globalThis.Response = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const searchData = await readJsonOrText<SpotifySearchResponse>(searchRes);

  const searchError = isRawText(searchData)
    ? searchData.rawText
    : searchData.error?.message ?? null;

  logStep("Spotify search result", {
    query,
    status: searchRes.status,
    ok: searchRes.ok,
    foundCount: isRawText(searchData)
      ? 0
      : searchData.tracks?.items?.length ?? 0,
    firstTrack:
      !isRawText(searchData) && searchData.tracks?.items?.[0]
        ? {
          id: searchData.tracks.items[0].id,
          name: searchData.tracks.items[0].name,
          uri: searchData.tracks.items[0].uri,
          artists: searchData.tracks.items[0].artists?.map(
            (artist) => artist.name
          ),
        }
        : null,
    error: searchError,
  });

  if (!searchRes.ok || isRawText(searchData)) {
    return {
      track: null,
      status: searchRes.status,
      error: searchError,
    };
  }

  return {
    track: searchData.tracks?.items?.[0] ?? null,
    status: searchRes.status,
    error: null,
  };
}

async function resolveSuggestionToSpotifyTrack({
  accessToken,
  suggestion,
}: {
  accessToken: string;
  suggestion: AiTrackSuggestion;
}): Promise<{
  track: SpotifyTrack | null;
  queryUsed?: string;
  status: number;
  error: unknown;
}> {
  const queries = buildSpotifySearchQueries(suggestion);

  for (const query of queries) {
    const result = await searchSpotifyTrack({
      accessToken,
      query,
    });

    if (result.status === 429) {
      return {
        track: null,
        queryUsed: query,
        status: result.status,
        error: result.error,
      };
    }

    if (!result.track?.uri) {
      continue;
    }

    if (!spotifyTrackMatchesSuggestion(result.track, suggestion)) {
      logStep("Spotify result rejected for preview", {
        query,
        expected: {
          name: suggestion.name,
          artists: suggestion.artists,
          source: suggestion.source,
        },
        actual: {
          name: result.track.name,
          artists: result.track.artists?.map((artist) => artist.name),
          uri: result.track.uri,
        },
      });

      continue;
    }

    return {
      track: result.track,
      queryUsed: query,
      status: result.status,
      error: null,
    };
  }

  return {
    track: null,
    status: 404,
    error: {
      message: "No Spotify result matched suggestion",
      suggestion,
      queries,
    },
  };
}

function uniqueSuggestions(values: AiTrackSuggestion[]) {
  const seen = new Set<string>();

  return values.filter((track) => {
    const key =
      track.query?.trim().toLowerCase() ||
      `${track.artists?.join(" ").toLowerCase()} ${track.name?.toLowerCase()}`;

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
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

Your job is to generate accurate Spotify-resolvable track suggestions.
These suggestions will be searched on Spotify immediately, so they must be real tracks with correct artists.

User request:
"${prompt}"

Mode:
"${mode ?? "vibe"}"

Return ONLY valid JSON with this exact shape:
{
  "tracks": [
    {
      "query": "artist name song title",
      "name": "song title",
      "artists": ["artist name"],
      "source": "why this belongs"
    }
  ]
}

The "tracks" array must contain exactly 15 objects.

Important output rules:
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations outside the JSON.
- Do not include comments.
- Every item must have "query", "name", "artists", and "source".
- "query" must be concise and Spotify-searchable.
- "query" should be formatted as: "Artist Name Song Title".
- "name" must be the track title only.
- "artists" must be an array of artist/composer names.
- "source" should be short, for example "Persona 4 battle theme", "Bleach opening 1", "similar artist", or "official OST".
- Do not invent fake songs.
- Do not invent fake artists.
- Avoid duplicate tracks.
- Prefer tracks likely to exist on Spotify.
- Avoid instrumental/orchestral/piano/live/remix variants unless they are official and well-known.
- Avoid vague soundtrack titles unless you know they are real Spotify tracks.

If mode is "artist":
- The user is asking for music similar to the named artist or artists.
- First identify the intended music artist, not just the literal word.
- Include some tracks by the requested artist if relevant.
- Include tracks by similar artists with matching genre, energy, production style, vocal style, language, era, and scene.
- Do not randomly switch to unrelated artists from another country/language unless the prompt asks for that.

If the user asks for an anime, game, movie, show, series, franchise, soundtrack, opening, ending, OST, OP, ED, theme song, or character-related playlist:
- Treat the title as a media franchise, not as a normal word.
- Identify the intended anime/game/movie/show first.
- Generate official opening themes, ending themes, battle themes, insert songs, OST tracks, and closely related official music.
- Prefer exact artist/composer + song title queries.
- Do not include unrelated mainstream artists unless they are actually connected to the franchise.
- Do not interpret titles literally. For example, "Bleach" means the anime Bleach, not cleaning products, colors, or unrelated songs.
- For Japanese anime/games, prefer Japanese artists, official soundtrack composers, and songs actually used in that anime/game.
- Avoid fan covers, remixes, AMVs, nightcore, slowed versions, sped-up versions, karaoke, and unofficial tribute songs unless the user asks for them.

Persona examples:
- For Persona 3, prefer "Yumi Kawamura Burn My Dread", "Lotus Juice Mass Destruction", "Shoji Meguro Memories of You".
- For Persona 4, prefer "Shihoko Hirata Pursuing My True Self", "Shihoko Hirata Reach Out To The Truth", "Shihoko Hirata I'll Face Myself", "Shoji Meguro Heartbeat Heartbreak", "Shoji Meguro Your Affection", "Shihoko Hirata Never More".
- For Persona 5, prefer "Lyn Last Surprise", "Lyn Wake Up Get Up Get Out There", "Lyn Life Will Change", "Lyn Rivers In the Desert", "Shoji Meguro Beneath the Mask".

If mode is "vibe":
- The user is asking for a mood, setting, genre, activity, or aesthetic.
- Translate the vibe into real songs that match the emotional tone, tempo, genre, and atmosphere.
- Prefer variety across artists while keeping the playlist coherent.

Quality rules:
- Prioritize accurate real-world music matches over obscure guesses.
- Prefer official artist names and official song titles.
- For anime/game/movie/show soundtrack requests, always prefer official artist/composer + exact song title.
- For OST tracks, use composer name + track title, for example "Shoji Meguro Heartbeat Heartbreak" or "Shiro Sagisu Number One".
- Avoid generic searches like "sad song", "anime opening", "Persona 4 soundtrack", or "rock music".
- Avoid album-only queries. Suggestions must point to tracks.
- Do not include confidence scores or extra metadata.

Examples:

User request: "Persona 4"
Mode: "vibe"
Good output:
{
  "tracks": [
    {
      "query": "Shihoko Hirata Pursuing My True Self",
      "name": "Pursuing My True Self",
      "artists": ["Shihoko Hirata"],
      "source": "Persona 4 opening"
    },
    {
      "query": "Shihoko Hirata Reach Out To The Truth",
      "name": "Reach Out To The Truth",
      "artists": ["Shihoko Hirata"],
      "source": "Persona 4 battle theme"
    },
    {
      "query": "Shoji Meguro Heartbeat Heartbreak",
      "name": "Heartbeat Heartbreak",
      "artists": ["Shoji Meguro"],
      "source": "Persona 4 OST"
    }
  ]
}

User request: "make a playlist containing bleach anime openings endings and ost"
Mode: "vibe"
Good output:
{
  "tracks": [
    {
      "query": "ORANGE RANGE Asterisk",
      "name": "Asterisk",
      "artists": ["ORANGE RANGE"],
      "source": "Bleach opening 1"
    },
    {
      "query": "UVERworld D-tecnoLife",
      "name": "D-tecnoLife",
      "artists": ["UVERworld"],
      "source": "Bleach opening 2"
    },
    {
      "query": "YUI Rolling star",
      "name": "Rolling star",
      "artists": ["YUI"],
      "source": "Bleach opening"
    },
    {
      "query": "Shiro Sagisu Number One",
      "name": "Number One",
      "artists": ["Shiro Sagisu"],
      "source": "Bleach OST"
    }
  ]
}

Now generate exactly 15 track suggestions for the user's request.
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
                "You generate accurate Spotify-resolvable playlist track suggestions. Return valid JSON only.",
            },
            {
              role: "user",
              content: aiPrompt,
            },
          ],
          temperature: 0.15,
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

    const suggestions = uniqueSuggestions(
      parsed
        .filter((track) => typeof track.query === "string")
        .map((track) => {
          const query = track.query.trim();

          return {
            query,
            name:
              typeof track.name === "string" && track.name.trim()
                ? track.name.trim()
                : query,
            artists: Array.isArray(track.artists)
              ? track.artists.filter(
                (artist): artist is string =>
                  typeof artist === "string" && Boolean(artist.trim())
              )
              : [],
            source:
              typeof track.source === "string" && track.source.trim()
                ? track.source.trim()
                : "AI suggestion",
          };
        })
    ).slice(0, 15);

    logStep("Parsed preview suggestions", {
      count: suggestions.length,
      suggestions,
    });

    if (!suggestions.length) {
      return Response.json(
        {
          error: true,
          message: "AI generated no usable preview tracks",
          step: "parse_preview_tracks",
        },
        { status: 500 }
      );
    }

    const resolvedTracks: {
      id?: string;
      uri?: string;
      query: string;
      name?: string;
      artists?: string[];
      album?: string;
      imageUrl?: string | null;
      source?: string;
    }[] = [];

    const resolveFailures: {
      query: string;
      status: number;
      error?: unknown;
    }[] = [];

    const seenUris = new Set<string>();

    for (const suggestion of suggestions) {
      const result = await resolveSuggestionToSpotifyTrack({
        accessToken,
        suggestion,
      });

      if (result.status === 429) {
        return Response.json(
          {
            error: true,
            message:
              "Spotify search is rate-limiting requests right now. Please wait a few minutes and try again.",
            step: "spotify_search_rate_limited",
            query: result.queryUsed ?? suggestion.query,
            resolveFailures,
          },
          { status: 429 }
        );
      }

      if (!result.track?.uri || seenUris.has(result.track.uri)) {
        resolveFailures.push({
          query: result.queryUsed ?? suggestion.query,
          status: result.status,
          error: result.error,
        });

        continue;
      }

      seenUris.add(result.track.uri);

      resolvedTracks.push({
        id: result.track.id,
        uri: result.track.uri,
        query: suggestion.query,
        name: result.track.name,
        artists:
          result.track.artists
            ?.map((artist) => artist.name)
            .filter((name): name is string => Boolean(name)) ??
          suggestion.artists ??
          [],
        album: result.track.album?.name,
        imageUrl: result.track.album?.images?.[0]?.url ?? null,
        source: suggestion.source,
      });
      await sleep(250);
    }

    logStep("Resolved preview tracks", {
      requestedCount: suggestions.length,
      resolvedCount: resolvedTracks.length,
      failureCount: resolveFailures.length,
      resolveFailures,
      resolvedTracks,
    });

    if (!resolvedTracks.length) {
      return Response.json(
        {
          error: true,
          message:
            "Could not resolve any AI suggestions to Spotify tracks. Try a more specific prompt.",
          step: "resolve_preview_tracks",
          suggestions,
          resolveFailures,
        },
        { status: 404 }
      );
    }

    const responsePayload = {
      success: true,
      tracks: resolvedTracks,
      debug: {
        prompt,
        mode: mode ?? "vibe",
        generatedQueries: suggestions.map((track) => track.query),
        foundTrackCount: resolvedTracks.length,
        resolveFailureCount: resolveFailures.length,
        resolveFailures,
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