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

type SelectedPreviewTrack = {
  id?: string;
  uri?: string;
  query?: string;
  name?: string;
  artists?: string[];
  album?: string;
  imageUrl?: string | null;
  source?: string;
};

type SpotifyUserResponse = {
  id?: string;
  display_name?: string;
  email?: string;
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

type SpotifyAddItemsResponse = {
  snapshot_id?: string;
  error?: {
    message?: string;
  };
};

type AiPlaylistAction = "create" | "append";

async function readJsonOrText<T>(res: Response): Promise<T | { rawText: string }> {
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
  console.log(`[AI_PLAYLIST] ${step}`, data ?? "");
}

function logError(step: string, data?: unknown) {
  console.error(`[AI_PLAYLIST_ERROR] ${step}`, data ?? "");
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    logStep("START");

    const body = await req.json();

    const {
      accessToken,
      prompt,
      mode,
      playlistName,
      isPublic,
      action = "create",
      targetPlaylistId,
      selectedTracks,
    }: {
      accessToken?: string;
      prompt?: string;
      mode?: string;
      playlistName?: string;
      isPublic?: boolean;
      action?: AiPlaylistAction;
      targetPlaylistId?: string;
      selectedTracks?: SelectedPreviewTrack[];
    } = body;

    logStep("Request body received", {
      hasAccessToken: Boolean(accessToken),
      prompt,
      mode,
      playlistName,
      isPublic,
      action,
      targetPlaylistId,
      selectedTrackCount: selectedTracks?.length ?? 0,
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

    if (action !== "create" && action !== "append") {
      return Response.json(
        {
          error: true,
          message: "Invalid action. Use 'create' or 'append'.",
          step: "validate_action",
        },
        { status: 400 },
      );
    }

    if (
      action === "append" &&
      (!targetPlaylistId || typeof targetPlaylistId !== "string")
    ) {
      return Response.json(
        {
          error: true,
          message: "Missing target playlist ID",
          step: "validate_append_target",
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

    logStep("Fetching Spotify user");

    const meRes: globalThis.Response = await fetch(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const meData = (await meRes.json()) as SpotifyUserResponse;

    logStep("Spotify /me response", {
      status: meRes.status,
      ok: meRes.ok,
      userId: meData.id,
      displayName: meData.display_name,
      error: meData.error,
    });

    if (!meRes.ok || !meData.id) {
      return Response.json(
        {
          error: true,
          message: meData?.error?.message ?? "Failed to fetch Spotify user",
          details: meData,
          step: "fetch_spotify_user",
        },
        { status: meRes.status },
      );
    }

    let foundTracks: SpotifyTrack[] = [];
    let foundUris: string[] = [];
    let queries: string[] = [];
    let searchFailures: {
      query: string;
      status: number;
      error?: unknown;
    }[] = [];

    const validSelectedTracks = Array.isArray(selectedTracks)
      ? selectedTracks.filter((track) => {
        const hasUri =
          typeof track.uri === "string" && track.uri.startsWith("spotify:");

        const hasQuery =
          typeof track.query === "string" && Boolean(track.query.trim());

        return hasUri || hasQuery;
      })
      : [];

    if (validSelectedTracks.length > 0) {
      logStep("Using selected preview tracks", {
        selectedTrackCount: validSelectedTracks.length,
        tracks: validSelectedTracks.map((track) => ({
          uri: track.uri,
          query: track.query,
          name: track.name,
          artists: track.artists,
        })),
      });

      const tracksWithUris = validSelectedTracks.filter(
        (track) =>
          typeof track.uri === "string" && track.uri.startsWith("spotify:")
      );

      foundTracks = tracksWithUris.map((track) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        artists: track.artists?.map((artistName) => ({
          name: artistName,
        })),
      }));

      foundUris = Array.from(
        new Set(
          tracksWithUris
            .map((track) => track.uri)
            .filter((uri): uri is string => Boolean(uri))
        )
      );

      const tracksNeedingSearch = validSelectedTracks.filter(
        (track) => !track.uri && track.query
      );

      for (const selectedTrack of tracksNeedingSearch) {
        const query = selectedTrack.query?.trim();

        if (!query) continue;

        const searchUrl = new URL("https://api.spotify.com/v1/search");
        searchUrl.searchParams.set("q", query);
        searchUrl.searchParams.set("type", "track");
        searchUrl.searchParams.set("limit", "1");
        searchUrl.searchParams.set("market", "NL");

        logStep("Resolving selected preview track", {
          query,
          name: selectedTrack.name,
          artists: selectedTrack.artists,
        });

        const searchRes: globalThis.Response = await fetch(searchUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const searchData = (await searchRes.json()) as SpotifySearchResponse;

        logStep("Selected preview track resolve result", {
          query,
          status: searchRes.status,
          ok: searchRes.ok,
          foundCount: searchData.tracks?.items?.length ?? 0,
          firstTrack: searchData.tracks?.items?.[0]
            ? {
              id: searchData.tracks.items[0].id,
              name: searchData.tracks.items[0].name,
              uri: searchData.tracks.items[0].uri,
              artists: searchData.tracks.items[0].artists?.map(
                (artist) => artist.name
              ),
            }
            : null,
          error: searchData.error,
        });

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

        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    if (foundUris.length === 0) {
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

If mode is "vibe":
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

      const aiData = await readJsonOrText<GroqResponse>(aiRes);

      const aiContent =
        "rawText" in aiData ? null : aiData.choices?.[0]?.message?.content ?? null;

      const aiError =
        "rawText" in aiData ? aiData.rawText : aiData.error?.message ?? null;

      logStep("Groq response", {
        status: aiRes.status,
        ok: aiRes.ok,
        hasContent: Boolean(aiContent),
        contentPreview: aiContent?.slice(0, 500),
        error: aiError,
      });

      if (!aiRes.ok) {
        const message =
          "rawText" in aiData
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

      if ("rawText" in aiData) {
        return Response.json(
          {
            error: true,
            message:
              aiRes.status === 429
                ? "Too many AI requests. Please wait a bit and try again."
                : "AI returned a non-JSON response",
            rawContent: aiData.rawText,
            step: "ai_response_format",
          },
          { status: aiRes.status === 429 ? 429 : 500 }
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
        return Response.json(
          {
            error: true,
            message: "AI returned invalid JSON",
            rawContent: content,
            details: safeError(error),
            step: "parse_ai_json",
          },
          { status: 500 },
        );
      }

      queries = uniqueStrings(
        parsed
          .map((item) => item.query)
          .filter((query): query is string => typeof query === "string"),
      ).slice(0, 25);

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
          { status: 500 },
        );
      }

      logStep("Starting Spotify search", {
        queryCount: queries.length,
      });

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

        logStep("Spotify search result", {
          query,
          status: searchRes.status,
          ok: searchRes.ok,
          foundCount: searchData.tracks?.items?.length ?? 0,
          firstTrack: searchData.tracks?.items?.[0]
            ? {
              id: searchData.tracks.items[0].id,
              name: searchData.tracks.items[0].name,
              uri: searchData.tracks.items[0].uri,
              artists: searchData.tracks.items[0].artists?.map(
                (artist) => artist.name,
              ),
            }
            : null,
          error: searchData.error,
        });

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

      if (!foundUris.length) {
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
    }

    const urisToAdd = foundUris.slice(0, 100);

    if (action === "append") {
      logStep("Adding AI tracks to existing playlist", {
        endpoint: "POST /playlists/{id}/items",
        playlistId: targetPlaylistId,
        uriCount: urisToAdd.length,
        uris: urisToAdd,
      });

      const addItemsRes: globalThis.Response = await fetch(
        `https://api.spotify.com/v1/playlists/${targetPlaylistId}/items`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: urisToAdd,
          }),
        },
      );

      const addItemsData =
        (await addItemsRes.json()) as SpotifyAddItemsResponse;

      if (!addItemsRes.ok) {
        return Response.json(
          {
            error: true,
            message:
              addItemsData?.error?.message ??
              `Failed to add tracks to playlist. Spotify returned ${addItemsRes.status}.`,
            details: addItemsData,
            step: "append_items",
          },
          { status: addItemsRes.status },
        );
      }

      const responsePayload = {
        success: true,
        action: "append" as const,
        playlist: {
          id: targetPlaylistId,
          items: {
            total: urisToAdd.length,
          },
          tracks: {
            total: urisToAdd.length,
          },
        },
        tracks: foundTracks.map((track) => ({
          id: track.id,
          uri: track.uri,
          name: track.name,
          artists:
            track.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
        })),
        debug: {
          prompt,
          mode: mode ?? "vibe",
          generatedQueries: queries,
          usedPreviewTracks: validSelectedTracks.length > 0,
          foundTrackCount: foundTracks.length,
          addedTrackCount: urisToAdd.length,
          durationMs: Date.now() - startedAt,
        },
      };

      logStep("SUCCESS", responsePayload);

      return Response.json(responsePayload);
    }

    const finalPlaylistName =
      playlistName?.trim() || `VibeForge - ${prompt.trim().slice(0, 40)}`;

    logStep("Creating Spotify playlist", {
      endpoint: "POST /me/playlists",
      userId: meData.id,
      finalPlaylistName,
      isPublic: Boolean(isPublic),
      trackCountToAdd: urisToAdd.length,
    });

    const createPlaylistRes: globalThis.Response = await fetch(
      "https://api.spotify.com/v1/me/playlists",
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
      },
    );

    const createdPlaylist =
      (await createPlaylistRes.json()) as SpotifyCreatePlaylistResponse;

    if (!createPlaylistRes.ok || !createdPlaylist.id) {
      return Response.json(
        {
          error: true,
          message:
            createdPlaylist?.error?.message ??
            `Failed to create playlist. Spotify returned ${createPlaylistRes.status}.`,
          details: createdPlaylist,
          step: "create_playlist",
        },
        { status: createPlaylistRes.status },
      );
    }

    logStep("Adding tracks to new playlist", {
      endpoint: "POST /playlists/{id}/items",
      playlistId: createdPlaylist.id,
      uriCount: urisToAdd.length,
      uris: urisToAdd,
    });

    const addItemsRes: globalThis.Response = await fetch(
      `https://api.spotify.com/v1/playlists/${createdPlaylist.id}/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: urisToAdd,
        }),
      },
    );

    const addItemsData = (await addItemsRes.json()) as SpotifyAddItemsResponse;

    if (!addItemsRes.ok) {
      return Response.json(
        {
          error: true,
          message:
            addItemsData?.error?.message ??
            `Playlist was created, but adding tracks failed. Spotify returned ${addItemsRes.status}.`,
          playlist: createdPlaylist,
          details: addItemsData,
          step: "add_items",
        },
        { status: addItemsRes.status },
      );
    }

    const responsePayload = {
      success: true,
      action: "create" as const,
      playlist: {
        id: createdPlaylist.id,
        name: createdPlaylist.name,
        url: createdPlaylist.external_urls?.spotify,
        items: {
          total: urisToAdd.length,
        },
        tracks: {
          total: urisToAdd.length,
        },
      },
      tracks: foundTracks.map((track) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        artists:
          track.artists?.map((artist) => artist.name).filter(Boolean) ?? [],
      })),
      debug: {
        prompt,
        mode: mode ?? "vibe",
        generatedQueries: queries,
        usedPreviewTracks: validSelectedTracks.length > 0,
        foundTrackCount: foundTracks.length,
        addedTrackCount: urisToAdd.length,
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
            : "Failed to generate playlist",
        step: "unhandled_error",
      },
      { status: 500 },
    );
  }
}
