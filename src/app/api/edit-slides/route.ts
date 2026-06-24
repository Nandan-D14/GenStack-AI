import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { slides, prompt, deckId } = await req.json();

    if (!slides || !prompt || !deckId) {
      return NextResponse.json({ error: "Missing required fields (slides, prompt, deckId)" }, { status: 400 });
    }

    console.log("Editing slides via MiniMax-M3...");
    const client = new OpenAI({
      baseURL: process.env.TOKENROUTER_BASE_URL || "https://api.tokenrouter.com/v1",
      apiKey: process.env.TOKENROUTER_API_KEY,
    });

    const response = await client.chat.completions.create({
      model: "minimax-m3",
      messages: [
        {
          role: "system",
          content: `You are an expert presentation editor. You will receive the existing slides as a JSON array and an edit instruction.
Apply the edit instruction to the slides and return the COMPLETE updated slides array.

IMPORTANT: You MUST respond with ONLY a valid JSON array. Do NOT wrap it in markdown code blocks like \`\`\`json. No explanations.

Each slide object must have:
- "title": string (the slide headline)
- "layout": one of "title", "content", "data", "chart", "comparison", "quote", "closing", "two_column"
- "bullets": array of strings (key points for this slide)
- "speakerNotes": string (brief notes for the speaker)

Rules:
- Keep unaffected slides exactly the same.
- Only modify slides that the edit instruction targets.
- You may add, delete, or reorder slides if requested.`,
        },
        {
          role: "user",
          content: `Here are the current slides:\n\n${JSON.stringify(slides, null, 2)}\n\nEdit instruction: ${prompt}`,
        },
      ],
    });

    const rawContent = response.choices[0]?.message?.content || "";
    console.log("Raw LLM response received, length:", rawContent.length);

    let updatedSlides: any[];
    try {
      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      updatedSlides = JSON.parse(jsonStr);
      if (!Array.isArray(updatedSlides)) {
        throw new Error("Response is not an array");
      }
    } catch (err: any) {
      console.error("JSON parse failed. Raw response was:", rawContent);
      throw new Error("AI failed to return valid JSON slides. Please try again.");
    }

    return NextResponse.json({ slides: updatedSlides });
  } catch (error: any) {
    console.error("Error editing slides:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
