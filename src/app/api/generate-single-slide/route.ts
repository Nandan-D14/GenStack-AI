import { NextRequest, NextResponse } from "next/server";
import { generateStructured, StructuredGenerationError } from "@/server/generate";
import { SlideResponseSchema } from "@/server/schemas";

type PlanItem = {
  id: string;
  order: number;
  title: string;
  layout: string;
  description: string;
};



function buildSlidePrompt(
  planItem: PlanItem,
  deckContext: string,
  tone: string,
  audience: string,
  allPlanItems: PlanItem[]
): { system: string; user: string } {
  const totalSlides = allPlanItems.length;
  const slideIndex = planItem.order;

  // Build narrative context
  const prevSlide = slideIndex > 0 ? allPlanItems[slideIndex - 1] : null;
  const nextSlide =
    slideIndex < totalSlides - 1 ? allPlanItems[slideIndex + 1] : null;

  const narrativeContext = [
    `This is slide ${slideIndex + 1} of ${totalSlides}.`,
    prevSlide
      ? `Previous slide: "${prevSlide.title}" — ${prevSlide.description}`
      : "This is the first slide.",
    nextSlide
      ? `Next slide: "${nextSlide.title}" — ${nextSlide.description}`
      : "This is the final slide.",
  ].join("\n");

  const deckOutline = allPlanItems
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" (${p.layout})${i === slideIndex ? " ← THIS SLIDE" : ""}`
    )
    .join("\n");

  // Layout-specific content rules
  const layoutRules: Record<string, string> = {
    title: `TITLE SLIDE RULES:
- Generate 1-2 bullets as subtitle text (the deck's value proposition or tagline)
- Make the title compelling and attention-grabbing
- Speaker notes: 2-3 sentences to welcome the audience and set the stage`,

    content: `CONTENT SLIDE RULES:
- Generate 4-5 substantive bullet points
- Each bullet MUST be 8-15 words with specific, actionable information
- NO filler phrases like "Key point about..." or "Supporting detail..."
- Include real examples, specific strategies, or concrete details relevant to "${planItem.description}"
- Speaker notes: 3-4 sentences that expand on the bullets with additional context`,

    data: `DATA/METRICS SLIDE RULES:
- Generate 3-4 bullets in STRICT format: "NUMBER: Description"
- Examples of good format: "$4.2B: Total addressable market by 2027", "67%: Users reporting measurable improvement", "3x: Faster deployment vs traditional methods"
- Use realistic, specific numbers that are plausible for this topic
- Each metric must directly support the slide's thesis: "${planItem.description}"
- Speaker notes: Explain the significance of each metric and what it means for the audience`,

    chart: `CHART/TIMELINE SLIDE RULES:
- Generate 3-4 bullets representing phases, time periods, or data progression
- Format: "Phase/Period: Description with specific metric"
- Examples: "Phase 1 — Foundation: Build core platform, onboard 50 beta users", "2024-2025: Market expansion targeting 3 new verticals"
- Show clear progression or growth trajectory
- Speaker notes: Narrate the data story and what drives each phase`,

    quote: `QUOTE SLIDE RULES:
- Generate EXACTLY 2 bullets:
  * First bullet: A compelling, authentic-sounding quote relevant to "${planItem.description}" (20-40 words)
  * Second bullet: "— Author Name, Title/Role" (use a real or realistic-sounding expert)
- The quote must feel insightful and memorable, not generic
- Speaker notes: 2-3 sentences providing context for why this quote matters`,

    two_column: `TWO-COLUMN COMPARISON SLIDE RULES:
- Generate EXACTLY 6 bullets: first 3 for LEFT column, last 3 for RIGHT column
- Each bullet: 8-12 words, specific and parallel in structure
- The two columns should represent a clear contrast or comparison related to "${planItem.description}"
- Speaker notes: Explain the comparison and why it matters to the audience`,

    closing: `CLOSING/CTA SLIDE RULES:
- Generate 3 bullets as concrete action items or key takeaways
- Each should be a specific, actionable next step (not vague)
- Examples: "Schedule a pilot program with our team this quarter", "Review the ROI analysis shared in your follow-up email"
- Speaker notes: Strong closing statement that reinforces the core message and creates urgency`,
  };

  const layoutRule =
    layoutRules[planItem.layout] || layoutRules["content"];

  const system = `You are an expert presentation content writer creating one slide for a professional presentation.

## PRESENTATION CONTEXT
- Topic: "${deckContext}"
- Audience: ${audience}
- Tone: ${tone}
- ${narrativeContext}

## FULL DECK OUTLINE
${deckOutline}

## THIS SLIDE
- Title: "${planItem.title}"
- Layout: ${planItem.layout}
- Purpose: ${planItem.description}

## CONTENT REQUIREMENTS
${layoutRule}

## QUALITY STANDARDS
- Every bullet must contain SPECIFIC information — no filler or placeholder text
- Content must flow naturally from the previous slide and lead into the next
- Use concrete examples, real-world references, and specific details
- Match the ${tone} tone consistently
- Speaker notes should sound natural when read aloud — like a real presenter talking

## OUTPUT FORMAT
Return ONLY a valid JSON object. No markdown fences, no explanation:
{
  "title": "A compelling, specific title for this slide",
  "layout": "${planItem.layout}",
  "bullets": ["array", "of", "strings"],
  "speakerNotes": "Natural-sounding presenter script (2-4 sentences)"
}`;

  const user = `Generate the content for slide ${slideIndex + 1}: "${planItem.title}"

This slide should cover: ${planItem.description}

Remember: Return ONLY valid JSON.`;

  return { system, user };
}

export async function POST(req: NextRequest) {
  try {
    const { planItem, deckContext, tone, audience, allPlanItems } =
      await req.json();

    if (!planItem) {
      return NextResponse.json(
        { error: "Missing planItem" },
        { status: 400 }
      );
    }

    const { system, user } = buildSlidePrompt(
      planItem,
      deckContext || "Presentation",
      tone || "professional",
      audience || "general audience",
      Array.isArray(allPlanItems) ? allPlanItems : [planItem]
    );

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
            if (!c.speakerNotes) c.speakerNotes = `Key points about ${planItem.title}.`;
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
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error("Generate single slide error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
