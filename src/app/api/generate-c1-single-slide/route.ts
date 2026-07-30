import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type PlanItem = {
  id: string;
  order: number;
  title: string;
  layout: string;
  description: string;
};

function fallbackSlide(planItem: PlanItem) {
  return {
    title: planItem.title,
    layout: planItem.layout,
    bullets: [
      planItem.description,
      "Key point supporting the main idea",
      "Supporting detail or statistic",
    ],
    speakerNotes: `Talk about ${planItem.title}: ${planItem.description}`,
    c1Dsl: null,
  };
}

const TEMPLATE_BY_LAYOUT: Record<string, string> = {
  title: "TitleOnly",
  content: "TextWithImage",
  data: "BigFact",
  chart: "TextWithChartVertical",
  quote: "KeyStatement",
  two_column: "TwoColumnText",
  closing: "TitleOnly",
};

export async function POST(req: NextRequest) {
  try {
    const { planItem, deckContext, tone, audience, allPlanItems, deckId } = await req.json();

    if (!planItem) {
      return NextResponse.json({ error: "Missing planItem" }, { status: 400 });
    }

    const apiKey = process.env.THESYS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(fallbackSlide(planItem));
    }

    const client = new OpenAI({
      baseURL: "https://api.thesys.dev/v1/artifact",
      apiKey,
    });

    const template = TEMPLATE_BY_LAYOUT[planItem.layout] || "TextWithImage";
    const allTitles = Array.isArray(allPlanItems)
      ? allPlanItems.map((p: PlanItem) => p.title).join(", ")
      : "";

    const response = await client.chat.completions.create({
      model: "c1/artifact/v-dev",
      messages: [
        {
          role: "system",
          content: `You are an expert presentation designer. Generate EXACTLY ONE slide, not a deck.

Use the ${template} slide template. The output must contain only one slide inside the slides artifact.

Slide requirements:
- Topic: ${deckContext || "Presentation"}
- Audience: ${audience || "general"}
- Tone: ${tone || "professional"}
- This slide title: ${planItem.title}
- This slide purpose: ${planItem.description}
- Full deck sequence: ${allTitles}

Do not add extra slides. Do not create title and closing slides unless requested by this plan item. Make this one slide visually polished and self-contained.`,
        },
        {
          role: "user",
          content: `Generate one ${template} slide for: "${planItem.title}". Purpose: ${planItem.description}`,
        },
      ],
      metadata: {
        thesys: JSON.stringify({
          c1_artifact_type: "slides",
          id: `slide-${deckId || "deck"}-${planItem.order}-${Date.now()}`,
        }),
      },
    });

    const c1Dsl = response.choices[0]?.message?.content || "";
    if (!c1Dsl.trim()) {
      return NextResponse.json(fallbackSlide(planItem));
    }

    return NextResponse.json({
      title: planItem.title,
      layout: planItem.layout,
      bullets: [planItem.description],
      speakerNotes: `Present this slide: ${planItem.description}`,
      c1Dsl,
    });
  } catch (error: any) {
    console.error("Generate C1 single slide error:", error);
    return NextResponse.json(fallbackSlide(error?.planItem || {
      id: "fallback",
      order: 0,
      title: "Generated Slide",
      layout: "content",
      description: "AI generated content",
    }));
  }
}
