import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { playlist } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a music expert. Analyze playlists and describe their vibe.",
        },
        {
          role: "user",
          content: playlist
            .map(
              (t: any) =>
                `${t.name} - ${t.artists?.join(", ")}`
            )
            .join("\n"),
        },
      ],
    });

    return Response.json({
      result: completion.choices[0]?.message?.content,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}