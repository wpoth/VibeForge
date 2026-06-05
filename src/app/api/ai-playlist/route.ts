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

function getValidSelectedTracks(selectedTracks: unknown): SelectedPreviewTrack[] {
  if (!Array.isArray(selectedTracks)) return [];

  return selectedTracks.filter((track): track is SelectedPreviewTrack => {
    if (!track || typeof track !== "object") return false;

    const candidate = track as SelectedPreviewTrack;

    return (
      typeof candidate.uri === "string" &&
      candidate.uri.startsWith("spotify:track:")
    );
  });
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
      selectedTracks,
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

    const validSelectedTracks = getValidSelectedTracks(selectedTracks);

    if (!validSelectedTracks.length) {
      return Response.json(
        {
          error: true,
          message:
            "No resolved Spotify preview tracks were selected. Generate a preview first, then select songs from that preview.",
          step: "missing_resolved_preview_tracks",
          selectedTracks,
        },
        { status: 400 }
      );
    }

    const foundUris = Array.from(
      new Set(
        validSelectedTracks
          .map((track) => track.uri)
          .filter((uri): uri is string => Boolean(uri))
      )
    );

    if (!foundUris.length) {
      return Response.json(
        {
          error: true,
          message:
            "Selected preview tracks did not contain usable Spotify URIs.",
          step: "missing_preview_track_uris",
          selectedTracks: validSelectedTracks,
        },
        { status: 400 }
      );
    }

    logStep("Using selected preview Spotify URIs", {
      selectedTrackCount: validSelectedTracks.length,
      uriCount: foundUris.length,
      uris: foundUris,
      tracks: validSelectedTracks.map((track) => ({
        id: track.id,
        uri: track.uri,
        name: track.name,
        artists: track.artists,
        source: track.source,
      })),
    });

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

      logStep("Append items response", {
        status: addItemsRes.status,
        ok: addItemsRes.ok,
        snapshotId: addItemsData.snapshot_id,
        error: addItemsData.error,
        fullResponse: addItemsData,
      });

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
        tracks: validSelectedTracks
          .filter((track) => track.uri && foundUris.includes(track.uri))
          .map((track) => ({
            id: track.id,
            uri: track.uri,
            name: track.name,
            artists: track.artists ?? [],
            album: track.album,
            imageUrl: track.imageUrl,
            source: track.source,
          })),
        debug: {
          prompt,
          usedPreviewTracks: true,
          selectedTrackCount: validSelectedTracks.length,
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
      }
    );

    const createdPlaylist =
      (await createPlaylistRes.json()) as SpotifyCreatePlaylistResponse;

    logStep("Create playlist response", {
      status: createPlaylistRes.status,
      ok: createPlaylistRes.ok,
      playlistId: createdPlaylist.id,
      playlistName: createdPlaylist.name,
      playlistUrl: createdPlaylist.external_urls?.spotify,
      error: createdPlaylist.error,
      fullResponse: createdPlaylist,
    });

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

    logStep("Add items response", {
      status: addItemsRes.status,
      ok: addItemsRes.ok,
      snapshotId: addItemsData.snapshot_id,
      error: addItemsData.error,
      fullResponse: addItemsData,
    });

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
      tracks: validSelectedTracks
        .filter((track) => track.uri && foundUris.includes(track.uri))
        .map((track) => ({
          id: track.id,
          uri: track.uri,
          name: track.name,
          artists: track.artists ?? [],
          album: track.album,
          imageUrl: track.imageUrl,
          source: track.source,
        })),
      debug: {
        prompt,
        usedPreviewTracks: true,
        selectedTrackCount: validSelectedTracks.length,
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
            : "Failed to create or update playlist",
        step: "unhandled_error",
      },
      { status: 500 }
    );
  }
}