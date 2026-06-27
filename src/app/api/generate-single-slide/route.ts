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
      baseURL: "https://llm.kimchi.dev/openai/v1",
      apiKey: process.env['CASTAI_API_KEY'] || process.env['TOKENROUTER_API_KEY'] || "",
    });

    const allTitles = Array.isArray(allPlanItems)
      ? allPlanItems.map((p: PlanItem) => p.title).join(", ")
      : "";

    const systemPrompt = `You are an expert slide creator. Your task is to generate ONE specific slide based on its plan item.

Return ONLY a valid JSON object matching this structure:
{
  "title": "A strong, concise title for this slide",
  "layout": "title" | "content" | "data" | "chart" | "quote" | "two_column" | "closing",
  "bullets": [
    "Array of strings. For content/two_column: 3-5 concise bullet points.",
    "For data: strings like 'Number: Description'",
    "For quote: ['The actual quote text', 'Author name']"
  ],
  "speakerNotes": "2-3 sentences of what the speaker should say for this slide."
}

Context for the entire presentation:
- Topic: ${deckContext}
- Audience: ${audience}
- Tone: ${tone}

This specific slide you must generate:
- Plan item: ${JSON.stringify(planItem)}

Make sure the content matches the plan item's layout and description exactly. Do not use markdown backticks in your output.`;

    const userContent = `Generate the slide JSON as instructed.\n\nINSTRUCTIONS:\n${systemPrompt}`;
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "user", content: userContent },
    ];

    let result;

    try {
      const response = await client.chat.completions.create({
        model: "minimax-m3",
        messages,
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
