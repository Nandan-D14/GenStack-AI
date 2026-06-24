import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type PlanItem = {
  id: string;
  order: number;
  title: string;
  layout: "title" | "content" | "data" | "chart" | "quote" | "two_column" | "closing";
  description: string;
};

function generateFallbackPlan(prompt: string, slidesCount: number): PlanItem[] {
  const topic = prompt || "Presentation";
  const items: PlanItem[] = [
    { id: "item-0", order: 0, title: topic, layout: "title", description: "Opening title slide introducing the topic" },
    { id: "item-1", order: 1, title: "The Challenge", layout: "content", description: "Define the core problem or opportunity" },
    { id: "item-2", order: 2, title: "Our Approach", layout: "content", description: "How we tackle the challenge" },
    { id: "item-3", order: 3, title: "Key Benefits", layout: "two_column", description: "Primary advantages and value proposition" },
    { id: "item-4", order: 4, title: "Data & Evidence", layout: "data", description: "Supporting statistics and research" },
    { id: "item-5", order: 5, title: "Results & Impact", layout: "chart", description: "Measurable outcomes and metrics" },
    { id: "item-6", order: 6, title: "Next Steps", layout: "closing", description: "Call to action and conclusion" },
  ];
  return items.slice(0, Math.max(3, slidesCount));
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, tone, audience, slidesCount = 8, chatHistory, currentPlan } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const client = new OpenAI({
      baseURL: process.env.TOKENROUTER_BASE_URL || "https://api.tokenrouter.com/v1",
      apiKey: process.env.TOKENROUTER_API_KEY,
    });

    const isRefinement = chatHistory && chatHistory.length > 0 && currentPlan;

    const systemPrompt = `You are an expert presentation strategist. Your job is to create structured presentation plans.

${isRefinement ? `The user has an existing plan and wants to refine it based on their message.` : `Create a presentation plan for the given topic.`}

Return ONLY a valid JSON object (no markdown, no explanation) with exactly these fields:
{
  "message": "A conversational message to the user explaining what you did (2-3 sentences max)",
  "plan": [
    {
      "id": "item-0",
      "order": 0,
      "title": "Slide title here",
      "layout": "title",
      "description": "One sentence describing what this slide covers"
    }
  ]
}

Layout options: "title" (opening slide), "content" (bullet points), "data" (stats/numbers), "chart" (visual data), "quote" (key statement), "two_column" (comparison), "closing" (final slide)

Rules:
- First slide MUST use "title" layout
- Last slide MUST use "closing" layout
- Generate exactly ${slidesCount} slides
- Tone: ${tone || "professional"}
- Audience: ${audience || "general"}
- Each plan item id must be "item-{index}" (0-indexed)`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (isRefinement && currentPlan) {
      messages.push({
        role: "assistant",
        content: `I've created this plan: ${JSON.stringify(currentPlan)}`,
      });
      // Add chat history
      for (const msg of chatHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    } else {
      messages.push({ role: "user", content: `Create a presentation plan about: ${prompt}` });
    }

    let result: { message: string; plan: PlanItem[] };

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

      if (!Array.isArray(result.plan)) throw new Error("Invalid plan format");

      // Normalize IDs and orders
      result.plan = result.plan.map((item: any, i: number) => ({
        ...item,
        id: `item-${Date.now()}-${i}`,
        order: i,
      }));
    } catch (apiError: any) {
      console.warn("Research plan API failed, using fallback:", apiError.message);
      result = {
        message: `I've created a ${slidesCount}-slide plan for "${prompt}". You can edit any slide title or description, reorder them, or ask me to modify the structure.`,
        plan: generateFallbackPlan(prompt, slidesCount),
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Research plan error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
