import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { prompt, deckId } = await req.json();

    if (!prompt || !deckId) {
      return NextResponse.json({ error: "Missing prompt or deckId" }, { status: 400 });
    }

    console.log("Generating slides JSON via MiniMax-M3...");
    const client = new OpenAI({
      baseURL: process.env.TOKENROUTER_BASE_URL || "https://api.tokenrouter.com/v1",
      apiKey: process.env.TOKENROUTER_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "minimax-m3",
      messages: [
        {
          role: "system",
          content: `You are an expert presentation designer. Generate a structured presentation based on the user's request.
Return the output as a strict JSON array of slide objects.

IMPORTANT: You MUST respond with ONLY a valid JSON array. Do NOT wrap it in markdown code blocks like \`\`\`json. No explanations.

Each slide object must have:
- "title": string (the slide headline)
- "layout": one of "title", "content", "data", "chart", "comparison", "quote", "closing", "two_column"
- "bullets": array of strings (key points for this slide)
- "speakerNotes": string (brief notes for the speaker)

Generate between 6 and 10 slides. The first slide must be "title" layout. The last slide must be "closing" layout.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content || "";
    console.log("Raw LLM response received, length:", rawContent.length);

    let slidesJson: any[];
    try {
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      slidesJson = JSON.parse(jsonStr);
      if (!Array.isArray(slidesJson)) {
        throw new Error("Response is not an array");
      }
    } catch (err: any) {
      console.error("JSON parse failed. Raw response was:", rawContent);
      throw new Error("AI failed to return valid JSON slides. Please try again.");
    }

    return NextResponse.json({ slides: slidesJson });
  } catch (error: any) {
    console.error("Error generating slides:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
