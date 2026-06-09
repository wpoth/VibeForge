type VibeMapTrack = {
    name?: string;
    artists?: string[];
    album?: string;
};

type PlaylistVibeMapRequest = {
    playlistName?: string;
    tracks?: VibeMapTrack[];
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

type PlaylistVibeMapResult = {
    summary: string;
    moodTags: string[];
    genreTags: string[];
    bestFor: string[];
    energy: number;
    danceability: number;
    emotionalWeight: number;
    darkness: number;
    focus: number;
    cohesion: number;
    soundProfile: string;
    flow: string;
    standoutPattern: string;
    confidence: "low" | "medium" | "high";
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

function clampScore(value: unknown) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return 50;
    }

    return Math.min(100, Math.max(0, Math.round(value)));
}

function cleanStringArray(value: unknown, fallback: string[]) {
    if (!Array.isArray(value)) {
        return fallback;
    }

    const cleaned = value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8);

    return cleaned.length ? cleaned : fallback;
}

function cleanText(value: unknown, fallback: string) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function POST(req: Request) {
    try {
        const { playlistName, tracks } =
            (await req.json()) as PlaylistVibeMapRequest;

        if (!playlistName || typeof playlistName !== "string") {
            return Response.json(
                {
                    error: true,
                    message: "Missing playlist name",
                },
                { status: 400 }
            );
        }

        const cleanedTracks = Array.isArray(tracks)
            ? tracks
                .filter((track) => track?.name)
                .map((track) => ({
                    name: track.name?.trim() ?? "Unknown track",
                    artists:
                        track.artists
                            ?.filter((artist): artist is string => typeof artist === "string")
                            .map((artist) => artist.trim())
                            .filter(Boolean) ?? [],
                    album: track.album?.trim() || undefined,
                }))
                .slice(0, 80)
            : [];

        if (!cleanedTracks.length) {
            return Response.json(
                {
                    error: true,
                    message: "No readable tracks were provided",
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

        const trackList = cleanedTracks
            .map((track, index) => {
                const artists = track.artists.length
                    ? track.artists.join(", ")
                    : "Unknown artist";

                return `${index + 1}. ${track.name} — ${artists}${track.album ? ` (${track.album})` : ""
                    }`;
            })
            .join("\n");

        const prompt = `
You are VibeForge's Playlist Vibe Map engine.

Analyze this playlist and create a visual vibe map.

Playlist:
"${playlistName}"

Tracks:
${trackList}

Return ONLY valid JSON with this exact shape:
{
  "summary": "one concise summary of the playlist vibe",
  "moodTags": ["tag", "tag", "tag"],
  "genreTags": ["tag", "tag", "tag"],
  "bestFor": ["use case", "use case", "use case"],
  "energy": 0,
  "danceability": 0,
  "emotionalWeight": 0,
  "darkness": 0,
  "focus": 0,
  "cohesion": 0,
  "soundProfile": "short description of the sound",
  "flow": "short description of how the playlist feels from start to end",
  "standoutPattern": "short observation about repeated artists, genres, anime/game OSTs, mood, or structure",
  "confidence": "low | medium | high"
}

Rules:
- Return valid JSON only.
- Do not include markdown.
- Do not include explanations outside JSON.
- Scores must be numbers from 0 to 100.
- moodTags must be 3 to 7 short tags.
- genreTags must be 2 to 6 short tags.
- bestFor must be 2 to 5 short use cases.
- Do not invent private listening data.
- Use only the track metadata provided.
- If the playlist contains anime/game/movie/OST music, mention that in genreTags, soundProfile, or standoutPattern.
- If track metadata is too limited, set confidence to "low" or "medium".
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
                                "You create concise playlist vibe maps from track metadata. Return valid JSON only.",
                        },
                        {
                            role: "user",
                            content: prompt,
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

        let parsed: Partial<PlaylistVibeMapResult>;

        try {
            parsed = JSON.parse(content) as Partial<PlaylistVibeMapResult>;
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

        const vibeMap: PlaylistVibeMapResult = {
            summary: cleanText(
                parsed.summary,
                "This playlist has a mixed mood with a varied sound profile."
            ),
            moodTags: cleanStringArray(parsed.moodTags, ["mixed", "personal", "varied"]),
            genreTags: cleanStringArray(parsed.genreTags, ["mixed"]),
            bestFor: cleanStringArray(parsed.bestFor, ["casual listening"]),
            energy: clampScore(parsed.energy),
            danceability: clampScore(parsed.danceability),
            emotionalWeight: clampScore(parsed.emotionalWeight),
            darkness: clampScore(parsed.darkness),
            focus: clampScore(parsed.focus),
            cohesion: clampScore(parsed.cohesion),
            soundProfile: cleanText(
                parsed.soundProfile,
                "A varied selection of tracks with mixed energy and mood."
            ),
            flow: cleanText(
                parsed.flow,
                "The playlist moves through different moods and intensities."
            ),
            standoutPattern: cleanText(
                parsed.standoutPattern,
                "No strong repeated pattern was detected from the available metadata."
            ),
            confidence:
                parsed.confidence === "low" ||
                    parsed.confidence === "medium" ||
                    parsed.confidence === "high"
                    ? parsed.confidence
                    : "medium",
        };

        return Response.json({
            success: true,
            vibeMap,
            debug: {
                analyzedTrackCount: cleanedTracks.length,
            },
        });
    } catch (error) {
        console.error("Playlist vibe map route error:", error);

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to generate playlist vibe map",
            },
            { status: 500 }
        );
    }
}