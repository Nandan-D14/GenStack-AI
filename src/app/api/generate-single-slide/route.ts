import { NextRequest, NextResponse } from "next/server";
import { generateStructured, StructuredGenerationError } from "@/server/generate";
import { SlideResponseSchema } from "@/server/schemas";
import { singleSlideSystem } from "@/server/prompts";

export async function POST(req: NextRequest) {
  try {
    const { planItem, deckContext, tone, audience, allPlanItems, skill, contextChunks } =
      await req.json();

    if (!planItem) {
      return NextResponse.json({ error: "Missing planItem" }, { status: 400 });
    }

    const { system, user } = singleSlideSystem({
      planItem,
      deckContext: deckContext || "Presentation",
      tone: tone || "professional",
      audience: audience || "general audience",
      allPlanItems: Array.isArray(allPlanItems) ? allPlanItems : [planItem],
      skill: skill || null,
      contextChunks: contextChunks || undefined,
    });

    try {
      const result = await generateStructured({
        task: "generate-single-slide",
        schema: SlideResponseSchema,
        schemaName: "Slide",
        system,
        user,
        maxRetries: 2,
        transform: (c: any) => {
          if (c && typeof c === "object") {
            if (!c.layout) c.layout = planItem.layout;
            if (Array.isArray(c.bullets)) {
              c.bullets = c.bullets.filter(
                (b: any) => typeof b === "string" && b.trim().length > 0,
              );
            }
            if (!c.speakerNotes)
              c.speakerNotes = `Key points about ${planItem.title}.`;
          }
          return c;
        },
      });

      return NextResponse.json(result);
    } catch (err) {
      console.error(
        `Slide generation failed for "${planItem.title}":`,
        err instanceof StructuredGenerationError ? err.message : err,
      );
      return NextResponse.json(
        {
          error: `Failed to generate slide "${planItem.title}" after multiple attempts. Please try again.`,
          retryable: true,
        },
        { status: 503 },
      );
    }
  } catch (error: any) {
    console.error("Generate single slide error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 },
    );
  }
}
