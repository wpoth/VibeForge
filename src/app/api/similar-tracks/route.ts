import type { SpotifySearchResponse, SpotifyTrack } from "@/lib/spotify-types";

type SimilarTracksRequest = {
    accessToken?: string;
    trackName?: string;
    artists?: string[];
    album?: string;
};

type SimilarTrackSuggestion = {
    query: string;
    name: string;
    artists: string[];
    reason: string;
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
    suggestion: SimilarTrackSuggestion
) {
    const nameMatches = textMatches(suggestion.name, spotifyTrack.name);

    const expectedArtists =
        suggestion.artists?.map(normalizeText).filter(Boolean) ?? [];

    const actualArtists =
        spotifyTrack.artists
            ?.map((artist) => normalizeText(artist.name))
            .filter(Boolean) ?? [];

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

function buildSpotifySearchQueries(suggestion: SimilarTrackSuggestion) {
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

async function searchSpotifyTracks({
    accessToken,
    query,
}: {
    accessToken: string;
    query: string;
}) {
    const searchUrl = new URL("https://api.spotify.com/v1/search");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "track");
    searchUrl.searchParams.set("limit", "5");
    searchUrl.searchParams.set("market", "NL");

    const res: globalThis.Response = await fetch(searchUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const data = await readJsonOrText<SpotifySearchResponse>(res);

    if (!res.ok || isRawText(data)) {
        return {
            status: res.status,
            tracks: [],
            error: isRawText(data) ? data.rawText : data.error?.message,
        };
    }

    return {
        status: res.status,
        tracks: data.tracks?.items ?? [],
        error: null,
    };
}

async function resolveSuggestionToSpotify({
    accessToken,
    suggestion,
}: {
    accessToken: string;
    suggestion: SimilarTrackSuggestion;
}) {
    const queries = buildSpotifySearchQueries(suggestion);

    for (const query of queries) {
        const result = await searchSpotifyTracks({
            accessToken,
            query,
        });

        if (result.status === 429) {
            return {
                track: null,
                status: 429,
                error: result.error,
            };
        }

        if (!result.tracks.length) continue;

        const strictMatch = result.tracks.find((track) =>
            spotifyTrackMatchesSuggestion(track, suggestion)
        );

        const fallbackMatch = result.tracks.find((track) => track.uri);

        const track = strictMatch ?? fallbackMatch ?? null;

        if (track?.uri) {
            return {
                track,
                status: result.status,
                error: null,
            };
        }
    }

    return {
        track: null,
        status: 404,
        error: "No Spotify match found",
    };
}

function uniqueSuggestions(suggestions: SimilarTrackSuggestion[]) {
    const seen = new Set<string>();

    return suggestions.filter((suggestion) => {
        const key = `${suggestion.artists?.join(",").toLowerCase()}-${suggestion.name?.toLowerCase()}`;

        if (!key || seen.has(key)) return false;

        seen.add(key);
        return true;
    });
}

function mapSpotifyTrack({
    track,
    suggestion,
}: {
    track: SpotifyTrack;
    suggestion: SimilarTrackSuggestion;
}) {
    return {
        id: track.id,
        uri: track.uri,
        name: track.name,
        artists:
            track.artists
                ?.map((artist) => artist.name)
                .filter((name): name is string => Boolean(name)) ?? [],
        album: track.album?.name,
        imageUrl: track.album?.images?.[0]?.url ?? null,
        spotifyUrl: track.external_urls?.spotify,
        reason: suggestion.reason,
        query: suggestion.query,
    };
}

export async function POST(req: Request) {
    try {
        const { accessToken, trackName, artists, album } =
            (await req.json()) as SimilarTracksRequest;

        if (!accessToken) {
            return Response.json(
                {
                    error: true,
                    message: "Missing access token",
                },
                { status: 400 }
            );
        }

        if (!trackName || typeof trackName !== "string") {
            return Response.json(
                {
                    error: true,
                    message: "Missing track name",
                },
                { status: 400 }
            );
        }

        const artistList = Array.isArray(artists)
            ? artists.filter((artist) => typeof artist === "string" && artist.trim())
            : [];

        if (!artistList.length) {
            return Response.json(
                {
                    error: true,
                    message: "Missing artist name",
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
                },
                { status: 500 }
            );
        }

        const prompt = `
You are VibeForge's similar-song finder.

Generate Spotify-resolvable songs similar to this source track.

Source track:
"${trackName}"

Source artist(s):
${artistList.map((artist) => `- ${artist}`).join("\n")}

Source album:
${album || "Unknown"}

Return ONLY valid JSON with this exact shape:
{
  "tracks": [
    {
      "query": "artist name song title",
      "name": "song title",
      "artists": ["artist name"],
      "reason": "why this is similar"
    }
  ]
}

Rules:
- Return exactly 15 tracks.
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations outside the JSON.
- Every track must be real.
- Every artist must be real.
- Every query must be Spotify-searchable.
- Do not return the source track itself.
- Avoid duplicates.
- Prefer songs that match the source track's mood, genre, scene, vocals, instrumentation, language, energy, and cultural context.
- If the source track is from anime, games, movies, or OST culture, prefer related official songs, similar artists, and similar scene music.
- If the source artist is Japanese, anime-adjacent, game-adjacent, or vocal-driven, prefer similar Japanese/scene-adjacent artists unless a non-Japanese match is clearly appropriate.
- Avoid covers, nightcore, slowed, sped-up, karaoke, tribute, piano cover, or remix versions unless the original song is actually a remix.
- "reason" must be concise, for example:
  - "similar dramatic anime rock energy"
  - "same emotional J-rock style"
  - "similar game OST atmosphere"
  - "same dark electronic mood"
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
                                "You generate accurate Spotify-resolvable similar song suggestions. Return JSON only.",
                        },
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                    temperature: 0.2,
                    response_format: {
                        type: "json_object",
                    },
                }),
            }
        );

        const aiData = await readJsonOrText<GroqResponse>(aiRes);

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
                },
                { status: 500 }
            );
        }

        const content = aiData.choices?.[0]?.message?.content ?? "";

        let suggestions: SimilarTrackSuggestion[];

        try {
            const parsed = JSON.parse(content) as {
                tracks?: SimilarTrackSuggestion[];
            };

            suggestions = Array.isArray(parsed.tracks) ? parsed.tracks : [];
        } catch {
            return Response.json(
                {
                    error: true,
                    message: "AI returned invalid JSON",
                    rawContent: content,
                },
                { status: 500 }
            );
        }

        const cleanedSuggestions = uniqueSuggestions(
            suggestions
                .filter(
                    (suggestion) =>
                        typeof suggestion.query === "string" &&
                        typeof suggestion.name === "string" &&
                        Array.isArray(suggestion.artists)
                )
                .map((suggestion) => ({
                    query: suggestion.query.trim(),
                    name: suggestion.name.trim(),
                    artists: suggestion.artists
                        .filter((artist): artist is string => typeof artist === "string")
                        .map((artist) => artist.trim())
                        .filter(Boolean),
                    reason:
                        typeof suggestion.reason === "string" && suggestion.reason.trim()
                            ? suggestion.reason.trim()
                            : "similar song",
                }))
        ).slice(0, 15);

        const sourceKey = `${normalizeText(artistList.join(" "))}-${normalizeText(
            trackName
        )}`;

        const seenUris = new Set<string>();
        const results = [];

        for (const suggestion of cleanedSuggestions) {
            const suggestionKey = `${normalizeText(
                suggestion.artists.join(" ")
            )}-${normalizeText(suggestion.name)}`;

            if (suggestionKey === sourceKey) {
                continue;
            }

            const resolved = await resolveSuggestionToSpotify({
                accessToken,
                suggestion,
            });

            if (resolved.status === 429) {
                return Response.json(
                    {
                        error: true,
                        message:
                            "Spotify search is rate-limiting requests right now. Please wait a few minutes and try again.",
                    },
                    { status: 429 }
                );
            }

            if (!resolved.track?.uri || seenUris.has(resolved.track.uri)) {
                continue;
            }

            seenUris.add(resolved.track.uri);

            results.push(
                mapSpotifyTrack({
                    track: resolved.track,
                    suggestion,
                })
            );

            if (results.length >= 12) {
                break;
            }
        }

        if (!results.length) {
            return Response.json(
                {
                    error: true,
                    message:
                        "Could not find Spotify-matched similar songs. Try a different source track.",
                },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            tracks: results,
            debug: {
                sourceTrack: trackName,
                sourceArtists: artistList,
                generatedCount: cleanedSuggestions.length,
                foundCount: results.length,
            },
        });
    } catch (error) {
        console.error("Similar tracks route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to find similar tracks",
            },
            { status: 500 }
        );
    }
}