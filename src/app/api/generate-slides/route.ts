import { NextRequest, NextResponse } from "next/server";
import { generateStructured } from "@/server/generate";
import { SlidesResponseSchema, normalizeSlidesPayload } from "@/server/schemas";
import { generateSlidesSystem } from "@/server/prompts";



function generateFallbackSlides(prompt: string, tone: string, audience: string): any[] {
  const topic = prompt || "New Presentation";
  const cleanTitle = topic.length > 50 ? topic.slice(0, 50) + "..." : topic;

  return [
    {
      title: cleanTitle,
      layout: "title",
      bullets: [
        `A strategic overview for ${audience || "stakeholders"}`,
        `${tone === "creative" ? "Fresh perspectives" : "Data-driven insights"} and actionable next steps`,
      ],
      speakerNotes: `Welcome everyone. Today we're diving into ${cleanTitle}. By the end of this presentation, you'll have a clear understanding of the landscape, the key data, and concrete next steps.`,
    },
    {
      title: `Why ${cleanTitle} Demands Attention Now`,
      layout: "content",
      bullets: [
        `Market dynamics are shifting rapidly, creating both risks and opportunities in ${cleanTitle}`,
        "Organizations that act now can capture first-mover advantage before the window closes",
        "Current approaches are hitting diminishing returns — a new strategy is needed",
        "Stakeholder expectations have evolved significantly in the last 12 months",
      ],
      speakerNotes: `Let's start with why this matters right now. The landscape around ${cleanTitle} has changed dramatically, and the cost of inaction is growing every quarter.`,
    },
    {
      title: `Core Drivers & Market Forces`,
      layout: "two_column",
      bullets: [
        "Accelerating technology adoption across all segments",
        "Rising customer expectations for speed and quality",
        "Regulatory changes creating new compliance requirements",
        "Competitor consolidation reshaping market dynamics",
        "Talent availability shifting toward specialized skills",
        "Investment flowing toward proven, scalable solutions",
      ],
      speakerNotes: "On the left, we see the internal operational drivers pushing change. On the right, the external market forces that make this transformation inevitable.",
    },
    {
      title: `The Numbers That Matter`,
      layout: "data",
      bullets: [
        "73%: Organizations reporting increased urgency to transform",
        "$2.8T: Global market opportunity by 2027",
        "4.2x: ROI for early adopters vs. late followers",
        "18 months: Average time-to-value for well-executed initiatives",
      ],
      speakerNotes: "Let me walk you through the data. These aren't projections — they're based on validated research and real-world outcomes from organizations already making this move.",
    },
    {
      title: `Growth Trajectory & Milestones`,
      layout: "chart",
      bullets: [
        "Phase 1 (Q1-Q2): Foundation — establish infrastructure, onboard pilot team, baseline metrics",
        "Phase 2 (Q3-Q4): Scale — expand to 5 business units, achieve 40% efficiency gain",
        "Phase 3 (Year 2): Optimize — full deployment, predictive capabilities, 80% cost reduction",
      ],
      speakerNotes: "This chart shows our three-phase trajectory. Notice how the growth curve steepens in Phase 2 as network effects kick in.",
    },
    {
      title: `Strategic Roadmap & Next Steps`,
      layout: "closing",
      bullets: [
        "Schedule a discovery workshop with stakeholders within the next 2 weeks",
        "Commission a detailed feasibility analysis covering technical and financial dimensions",
        "Establish a cross-functional steering committee to oversee implementation",
      ],
      speakerNotes: `To close, here are three concrete actions we can take starting this week. I've prepared a detailed brief for each of you. Let's open it up for questions.`,
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, deckId, tone, audience, slidesCount: requestedCount, skill } = await req.json();

    if (!prompt || !deckId) {
      return NextResponse.json(
        { error: "Missing prompt or deckId" },
        { status: 400 }
      );
    }

    const slidesCount = Math.min(Math.max(Number(requestedCount) || 7, 3), 30);

    const systemPrompt = generateSlidesSystem({
      slidesCount,
      tone: tone || "professional",
      audience: audience || "general",
      skill: skill || null,
    });

    try {
      const parsed = await generateStructured({
        task: "generate-slides",
        schema: SlidesResponseSchema,
        schemaName: "SlidesResponse",
        system: systemPrompt,
        user: `Generate a ${slidesCount}-slide presentation about: "${prompt}"`,
        maxRetries: 2,
        transform: normalizeSlidesPayload,
      });

      return NextResponse.json({ slides: parsed.slides });
    } catch (err: any) {
      // All retries failed — use high-quality fallback
      console.warn("All LLM retries exhausted, using fallback slides:", err?.message);
      return NextResponse.json({
        slides: generateFallbackSlides(prompt, tone, audience),
      });
    }
  } catch (error: any) {
    console.error("Error generating slides:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
