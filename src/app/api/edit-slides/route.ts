import { NextRequest, NextResponse } from "next/server";
import { generateStructured } from "@/server/generate";
import { SlidesResponseSchema, normalizeSlidesPayload } from "@/server/schemas";



export async function POST(req: NextRequest) {
  try {
    const { slides, prompt, deckId } = await req.json();

    if (!slides || !prompt || !deckId) {
      return NextResponse.json(
        { error: "Missing required fields (slides, prompt, deckId)" },
        { status: 400 }
      );
    }

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

Return ONLY a valid JSON object with a "slides" array of slide objects. No markdown fences, no explanation.`;

    try {
      const parsed = await generateStructured({
        task: "edit-slides",
        schema: SlidesResponseSchema,
        schemaName: "SlidesResponse",
        system: systemPrompt,
        user: `Here are the current slides:\n\n${JSON.stringify(slides, null, 2)}\n\nEdit instruction: ${prompt}`,
        maxRetries: 2,
        transform: normalizeSlidesPayload,
      });

      return NextResponse.json({ slides: parsed.slides });
    } catch (err: any) {
      console.error("Edit slides failed after retries:", err?.message);
      return NextResponse.json(
        { error: "Failed to edit slides. Please try again." },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error("Error editing slides:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
