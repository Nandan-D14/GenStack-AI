import { NextRequest, NextResponse } from "next/server";
import { generateStructured } from "@/server/generate";
import { SlidesResponseSchema, normalizeSlidesPayload } from "@/server/schemas";
import { editSlidesSystem } from "@/server/prompts";



export async function POST(req: NextRequest) {
  try {
    const { slides, prompt, deckId, skill } = await req.json();

    if (!slides || !prompt || !deckId) {
      return NextResponse.json(
        { error: "Missing required fields (slides, prompt, deckId)" },
        { status: 400 }
      );
    }

    const systemPrompt = editSlidesSystem({ skill: skill || null });

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
