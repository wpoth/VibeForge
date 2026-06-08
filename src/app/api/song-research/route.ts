type SongResearchRequest = {
    trackName?: string;
    artists?: string[];
    album?: string;
    spotifyUrl?: string;
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

type SongResearchResult = {
    summary: string;
    meaning: string;
    story: string;
    context: string;
    moodTags: string[];
    sonicNotes: string;
    relatedMedia: string | null;
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

export async function POST(req: Request) {
    try {
        const { trackName, artists, album, spotifyUrl } =
            (await req.json()) as SongResearchRequest;

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
You are VibeForge's Song Researcher.

Analyze the song using public music knowledge, metadata, and general interpretation.

Song:
"${trackName}"

Artist(s):
${artistList.map((artist) => `- ${artist}`).join("\n")}

Album:
${album || "Unknown"}

Spotify URL:
${spotifyUrl || "Unknown"}

Return ONLY valid JSON with this exact shape:
{
  "summary": "short overview of the song",
  "meaning": "possible interpretation of the song's themes and meaning",
  "story": "what the song seems to be about narratively or emotionally",
  "context": "artist, album, anime/game/movie, release, or cultural context if known",
  "moodTags": ["tag 1", "tag 2", "tag 3"],
  "sonicNotes": "short notes about the sound, energy, instrumentation, or vocal style",
  "relatedMedia": "anime/game/movie/show/franchise if relevant, otherwise null",
  "confidence": "low | medium | high"
}

Important rules:
- Do not quote or reproduce song lyrics.
- Do not provide full lyrics.
- Do not invent facts.
- If you are unsure, say so clearly.
- Phrase interpretation as "possible meaning" or "likely theme", not absolute truth.
- If the song is from anime, game, movie, show, or soundtrack, mention that if known.
- Keep every field concise but useful.
- moodTags must contain 3 to 7 short tags.
- confidence must be "low", "medium", or "high".
- Return JSON only. No markdown. No commentary outside JSON.
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
                                "You are a careful music researcher. You summarize and interpret songs without quoting or reproducing lyrics. Return valid JSON only.",
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

        let parsed: Partial<SongResearchResult>;

        try {
            parsed = JSON.parse(content) as Partial<SongResearchResult>;
        } catch (error) {
            console.error("Song research JSON parse failed:", {
                error: safeError(error),
                content,
            });

            return Response.json(
                {
                    error: true,
                    message: "AI returned invalid JSON",
                    rawContent: content,
                },
                { status: 500 }
            );
        }

        const research: SongResearchResult = {
            summary:
                typeof parsed.summary === "string" && parsed.summary.trim()
                    ? parsed.summary.trim()
                    : "No summary available.",
            meaning:
                typeof parsed.meaning === "string" && parsed.meaning.trim()
                    ? parsed.meaning.trim()
                    : "No interpretation available.",
            story:
                typeof parsed.story === "string" && parsed.story.trim()
                    ? parsed.story.trim()
                    : "No narrative explanation available.",
            context:
                typeof parsed.context === "string" && parsed.context.trim()
                    ? parsed.context.trim()
                    : "No specific context found.",
            moodTags: Array.isArray(parsed.moodTags)
                ? parsed.moodTags
                    .filter((tag): tag is string => typeof tag === "string")
                    .map((tag) => tag.trim())
                    .filter(Boolean)
                    .slice(0, 7)
                : [],
            sonicNotes:
                typeof parsed.sonicNotes === "string" && parsed.sonicNotes.trim()
                    ? parsed.sonicNotes.trim()
                    : "No sonic notes available.",
            relatedMedia:
                typeof parsed.relatedMedia === "string" && parsed.relatedMedia.trim()
                    ? parsed.relatedMedia.trim()
                    : null,
            confidence:
                parsed.confidence === "low" ||
                    parsed.confidence === "medium" ||
                    parsed.confidence === "high"
                    ? parsed.confidence
                    : "medium",
        };

        return Response.json({
            success: true,
            research,
        });
    } catch (error) {
        console.error("Song research route error:", safeError(error));

        return Response.json(
            {
                error: true,
                message:
                    error instanceof Error ? error.message : "Failed to research song",
            },
            { status: 500 }
        );
    }
}