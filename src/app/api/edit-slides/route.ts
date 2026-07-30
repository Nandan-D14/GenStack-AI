import { NextRequest, NextResponse } from "next/server";
import { getAIClient, extractJson } from "@/server/ai";



export async function POST(req: NextRequest) {
  try {
    const { slides, prompt, deckId } = await req.json();

    if (!slides || !prompt || !deckId) {
      return NextResponse.json(
        { error: "Missing required fields (slides, prompt, deckId)" },
        { status: 400 }
      );
    }

    const { client, model } = getAIClient();

    const systemPrompt = `You are an expert presentation editor. You will receive existing slides as JSON and an edit instruction.
Apply the edit instruction precisely and return the COMPLETE updated slides array.

EDIT TYPES YOU HANDLE:
1. Tone Change — Rewrite all bullet text to match the requested tone (formal, casual, persuasive, etc.)
2. Length Change — Add or remove bullets/slides to match requested length
3. Content Addition — Add new slide(s) with appropriate layout, topic-specific title, and substantive bullets
4. Content Deletion — Remove targeted slide(s) from the array
5. Reordering — Move slides to a different position
6. Content Rewrite — Rewrite bullets for clarity, impact, or a different angle

QUALITY RULES:
- Every bullet must contain specific, substantive information — no filler
- Keep unaffected slides exactly the same
- Only modify slides that the edit instruction targets
- New slides should have layout-appropriate content

Each slide object must have:
- "title": string
- "layout": one of "title", "content", "data", "chart", "quote", "closing", "two_column"
- "bullets": array of strings
- "speakerNotes": string

Return ONLY a valid JSON array of slide objects. No markdown fences, no explanation.`;

    // Retry up to 2 times
    let lastError = "";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Here are the current slides:\n\n${JSON.stringify(slides, null, 2)}\n\nEdit instruction: ${prompt}`,
            },
          ],
        });

        const rawContent = response.choices[0]?.message?.content || "";
        const updatedSlides = extractJson(rawContent);

        if (!Array.isArray(updatedSlides)) {
          throw new Error("Response is not an array");
        }

        return NextResponse.json({ slides: updatedSlides });
      } catch (err: any) {
        lastError = err.message;
        console.warn(
          `Edit slides attempt ${attempt + 1} failed:`,
          lastError
        );
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    // All retries failed
    console.error("Edit slides failed after retries:", lastError);
    return NextResponse.json(
      { error: "Failed to edit slides. Please try again." },
      { status: 503 }
    );
  } catch (error: any) {
    console.error("Error editing slides:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
