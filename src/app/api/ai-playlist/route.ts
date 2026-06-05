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
  console.log(`[AI_PLAYLIST] ${step}`, data ?? "");
}

function logError(step: string, data?: unknown) {
  console.error(`[AI_PLAYLIST_ERROR] ${step}`, data ?? "");
}

function toSpotifyTrackFromPreview(track: SelectedPreviewTrack): SpotifyTrack {
  return {
    id: track.id,
    uri: track.uri,
    name: track.name,
    artists: track.artists?.map((artistName) => ({
      name: artistName,
    })),
  };
}

function buildSpotifySearchQuery(track: SelectedPreviewTrack) {
  const query = track.query?.trim();

  if (query) {
    return query;
  }

  const name = track.name?.trim();
  const artists = track.artists?.join(" ").trim();

  return [artists, name].filter(Boolean).join(" ").trim();
}

async function resolveSpotifyTrack({
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
  searchUrl.searchParams.set("limit", "1");
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

  const firstTrack = isRawText(searchData)
    ? null
    : searchData.tracks?.items?.[0] ?? null;

  logStep("Spotify search result", {
    query,
    status: searchRes.status,
    ok: searchRes.ok,
    foundCount: isRawText(searchData)
      ? 0
      : searchData.tracks?.items?.length ?? 0,
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

  if (!searchRes.ok || isRawText(searchData)) {
    return {
      track: null,
      status: searchRes.status,
      error: searchError,
    };
  }

  return {
    track: firstTrack,
    status: searchRes.status,
    error: null,
  };
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    logStep("START");

    const body = await req.json();

    const {
      accessToken,
      prompt,
      playlistName,
      isPublic,
      action = "create",
      targetPlaylistId,
      selectedTracks,
    }: {
      accessToken?: string;
      prompt?: string;
      playlistName?: string;
      isPublic?: boolean;
      action?: AiPlaylistAction;
      targetPlaylistId?: string;
      selectedTracks?: SelectedPreviewTrack[];
    } = body;

    logStep("Request body received", {
      hasAccessToken: Boolean(accessToken),
      prompt,
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

    if (action !== "create" && action !== "append") {
      return Response.json(
        {
          error: true,
          message: "Invalid action. Use 'create' or 'append'.",
          step: "validate_action",
        },
        { status: 400 }
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
        { status: 400 }
      );
    }

    if (!Array.isArray(selectedTracks) || selectedTracks.length === 0) {
      return Response.json(
        {
          error: true,
          message:
            "No preview songs were selected. Generate a preview and select songs first.",
          step: "missing_selected_preview_tracks",
        },
        { status: 400 }
      );
    }

    logStep("Fetching Spotify user");

    const meRes: globalThis.Response = await fetch(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
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
        { status: meRes.status }
      );
    }

    const validSelectedTracks = selectedTracks.filter((track) => {
      const hasUri =
        typeof track.uri === "string" && track.uri.startsWith("spotify:");

      const hasQuery =
        typeof track.query === "string" && Boolean(track.query.trim());

      const hasName =
        typeof track.name === "string" && Boolean(track.name.trim());

      return hasUri || hasQuery || hasName;
    });

    if (!validSelectedTracks.length) {
      return Response.json(
        {
          error: true,
          message:
            "Preview songs were sent, but none had a usable query, name, or Spotify URI.",
          step: "invalid_selected_preview_tracks",
          selectedTracks,
        },
        { status: 400 }
      );
    }

    const foundTracks: SpotifyTrack[] = [];
    const foundUris: string[] = [];

    const searchFailures: {
      query: string;
      status: number;
      error?: unknown;
    }[] = [];

    logStep("Resolving selected preview tracks", {
      selectedTrackCount: validSelectedTracks.length,
      tracks: validSelectedTracks.map((track) => ({
        uri: track.uri,
        query: track.query,
        name: track.name,
        artists: track.artists,
        source: track.source,
      })),
    });

    for (const selectedTrack of validSelectedTracks) {
      if (
        typeof selectedTrack.uri === "string" &&
        selectedTrack.uri.startsWith("spotify:")
      ) {
        const spotifyTrack = toSpotifyTrackFromPreview(selectedTrack);

        if (spotifyTrack.uri && !foundUris.includes(spotifyTrack.uri)) {
          foundTracks.push(spotifyTrack);
          foundUris.push(spotifyTrack.uri);
        }

        continue;
      }

      const query = buildSpotifySearchQuery(selectedTrack);

      if (!query) {
        searchFailures.push({
          query: "missing query",
          status: 400,
          error: {
            message: "Selected preview track had no query/name to search",
            selectedTrack,
          },
        });

        continue;
      }

      const result = await resolveSpotifyTrack({
        accessToken,
        query,
      });

      if (result.status === 429) {
        return Response.json(
          {
            error: true,
            message:
              "Spotify search is rate-limiting requests right now. Please wait a few minutes and try again.",
            step: "resolve_selected_preview_tracks_rate_limited",
            query,
            searchFailures,
          },
          { status: 429 }
        );
      }

      if (!result.track?.uri) {
        searchFailures.push({
          query,
          status: result.status,
          error: result.error,
        });

        continue;
      }

      if (!foundUris.includes(result.track.uri)) {
        foundTracks.push(result.track);
        foundUris.push(result.track.uri);
      }

      await sleep(250);
    }

    if (!foundUris.length) {
      return Response.json(
        {
          error: true,
          message: "Spotify could not find any of the selected preview songs.",
          step: "resolve_selected_preview_tracks",
          selectedTracks: validSelectedTracks,
          searchFailures,
        },
        { status: 404 }
      );
    }

    const urisToAdd = foundUris.slice(0, 100);

    if (action === "append") {
      logStep("Adding selected preview tracks to existing playlist", {
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
        }
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
          { status: addItemsRes.status }
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
          usedPreviewTracks: true,
          selectedTrackCount: validSelectedTracks.length,
          foundTrackCount: foundTracks.length,
          addedTrackCount: urisToAdd.length,
          searchFailureCount: searchFailures.length,
          searchFailures,
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
      }
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
        { status: createPlaylistRes.status }
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
      }
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
        { status: addItemsRes.status }
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
        usedPreviewTracks: true,
        selectedTrackCount: validSelectedTracks.length,
        foundTrackCount: foundTracks.length,
        addedTrackCount: urisToAdd.length,
        searchFailureCount: searchFailures.length,
        searchFailures,
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
            : "Failed to create or update playlist",
        step: "unhandled_error",
      },
      { status: 500 }
    );
  }
}