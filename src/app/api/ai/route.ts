import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
    const { playlist } = await req.json();

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a music expert. Analyze playlists and describe their vibe clearly and concisely.",
                },
                {
                    role: "user",
                    content: `
Analyze this playlist:

${playlist.map((t: any) => `${t.name} - ${t.artists?.join(", ")}`).join("\n")}

Return:
- vibe description
- energy level (1-10)
- mood
- genre summary
`,
                },
            ],
        });

        return Response.json({
            result: completion.choices[0].message.content,
        });
    } catch (err: any) {
        return Response.json(
            { error: err.message },
            { status: 500 }
        );
    }
}