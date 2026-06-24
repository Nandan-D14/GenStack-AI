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
  };
}

export async function POST(req: NextRequest) {
  try {
    const { planItem, deckContext, tone, audience, allPlanItems } = await req.json();

    if (!planItem) {
      return NextResponse.json({ error: "Missing planItem" }, { status: 400 });
    }

    const client = new OpenAI({
      baseURL: process.env.TOKENROUTER_BASE_URL || "https://api.tokenrouter.com/v1",
      apiKey: process.env.TOKENROUTER_API_KEY,
    });

    const allTitles = Array.isArray(allPlanItems)
      ? allPlanItems.map((p: PlanItem) => p.title).join(", ")
      : "";

    const systemPrompt = `You are a presentation content writer. Generate content for exactly ONE slide.

Return ONLY valid JSON (no markdown):
{
  "title": "The slide title",
  "layout": "${planItem.layout}",
  "bullets": ["bullet 1", "bullet 2", "bullet 3"],
  "speakerNotes": "Brief speaker notes for this slide"
}

Rules:
- Keep the same layout: "${planItem.layout}"
- Title should be punchy and clear (max 8 words)
- 3-5 bullets for content/data/chart/two_column layouts
- 1-2 bullets for title/quote/closing layouts
- Bullets should be concise (max 15 words each)
- Tone: ${tone || "professional"}
- Audience: ${audience || "general"}
- Full deck topic: ${deckContext}
- All slides in deck: ${allTitles}`;

    let result;

    try {
      const response = await client.chat.completions.create({
        model: "minimax-m3",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate content for slide titled "${planItem.title}". Description: ${planItem.description}`,
          },
        ],
      });

      const raw = response.choices[0]?.message?.content || "";
      let jsonStr = raw.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      result = JSON.parse(jsonStr);
      if (!result.title || !Array.isArray(result.bullets)) throw new Error("Invalid slide format");
    } catch (apiError: any) {
      console.warn("Single slide gen failed, using fallback:", apiError.message);
      result = fallbackSlide(planItem);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Generate single slide error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
