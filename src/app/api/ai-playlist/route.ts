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
        }: {
            accessToken?: string;
            prompt?: string;
            mode?: string;
            playlistName?: string;
            isPublic?: boolean;
        } = body;

        logStep("Request body received", {
            hasAccessToken: Boolean(accessToken),
            prompt,
            mode,
            playlistName,
            isPublic,
        });

        if (!accessToken) {
            logError("Missing access token");

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
            logError("Missing or invalid prompt", { prompt });

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

        logStep("Environment check", {
            hasGroqApiKey: Boolean(groqApiKey),
        });

        if (!groqApiKey) {
            logError("Missing GROQ_API_KEY");

            return Response.json(
                {
                    error: true,
                    message: "Missing GROQ_API_KEY",
                    step: "environment",
                },
                { status: 500 }
            );
        }

        // 1. Fetch Spotify user
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
            logError("Failed to fetch Spotify user", {
                status: meRes.status,
                meData,
            });

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

        // 2. Ask AI for track search queries
        const aiPrompt = `
You are helping create a Spotify playlist.

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
If mode is "artist", the user is asking for music similar to the named artist.
Do not interpret the artist name as a random word.

For artist mode:
- Identify the intended music artist.
- Generate tracks by that artist and artists with a similar sound.
- Prefer the same language, genre, vocal style, production style, and scene.

The "tracks" array must contain 25 objects. Each "query" should be a concise search string that would return a relevant track on Spotify. Use the following rules to generate the queries:
Rules:
- Use real songs and artists.
- Match the user's vibe or artist-based request.
- Avoid duplicates.
- Use a mix of obvious and slightly deeper picks.
- Do not include explanations.
- Do not include markdown.
- Do not include anything outside the JSON array.
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
                                "You generate Spotify track search queries. Return valid JSON only.",
                        },
                        {
                            role: "user",
                            content: aiPrompt,
                        },
                    ],
                    temperature: 0.6,
                    response_format: {
                        type: "json_object",
                    },
                }),
            }
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
            logError("AI request failed", {
                status: aiRes.status,
                aiData,
            });

            return Response.json(
                {
                    error: true,
                    message: aiData.error?.message ?? "AI request failed",
                    details: aiData,
                    step: "ai_request",
                },
                { status: aiRes.status }
            );
        }

        const content = aiData.choices?.[0]?.message?.content ?? "";

        logStep("Parsing AI JSON content", {
            contentLength: content.length,
            contentPreview: content.slice(0, 1000),
        });

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
        ).slice(0, 25);

        logStep("Parsed AI queries", {
            count: queries.length,
            queries,
        });

        if (!queries.length) {
            logError("AI generated no usable track queries", {
                parsed,
            });

            return Response.json(
                {
                    error: true,
                    message: "AI generated no usable track queries",
                    step: "parse_ai_queries",
                },
                { status: 500 }
            );
        }

        // 3. Search Spotify tracks
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

            logStep("Searching Spotify track", {
                query,
            });

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
            logError("No matching Spotify tracks found", {
                queries,
                searchFailures,
            });

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

        // 4. Create playlist
        const finalPlaylistName =
            playlistName?.trim() || `VibeForge - ${prompt.trim().slice(0, 40)}`;

        logStep("Creating Spotify playlist", {
            endpoint: "POST /me/playlists",
            userId: meData.id,
            finalPlaylistName,
            isPublic: Boolean(isPublic),
            trackCountToAdd: foundUris.length,
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
            logError("Create playlist failed", {
                status: createPlaylistRes.status,
                response: createdPlaylist,
            });

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

        // 5. Add tracks to playlist
        const urisToAdd = foundUris.slice(0, 100);

        logStep("Adding tracks to playlist", {
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
            logError("Add items failed", {
                status: addItemsRes.status,
                response: addItemsData,
                playlist: createdPlaylist,
            });

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
            debug: {
                prompt,
                mode: mode ?? "vibe",
                generatedQueries: queries,
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
            { status: 500 }
        );
    }
}