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
  const cleanTitle = topic.length > 40 ? topic.slice(0, 40) + "..." : topic;
  const items: PlanItem[] = [
    { id: "item-0", order: 0, title: cleanTitle, layout: "title", description: `Opening title slide introducing the core concepts of ${cleanTitle}` },
    { id: "item-1", order: 1, title: `The Challenge of ${cleanTitle}`, layout: "content", description: `Identify the main pain points, market challenges, or theoretical problems concerning ${cleanTitle}` },
    { id: "item-2", order: 2, title: "Key Mechanisms", layout: "two_column", description: `Break down the core components, workflows, or pillars supporting ${cleanTitle}` },
    { id: "item-3", order: 3, title: `Data & Metrics on ${cleanTitle}`, layout: "data", description: `Examine the statistical evidence, growth trends, and quantitative impact of ${cleanTitle}` },
    { id: "item-4", order: 4, title: "Comparative Analysis", layout: "two_column", description: `Compare traditional practices with optimized strategies under ${cleanTitle}` },
    { id: "item-5", order: 5, title: "Performance Trajectory", layout: "chart", description: "Visualize the phase-wise development or historical growth chart" },
    { id: "item-6", order: 6, title: "Strategic Roadmap", layout: "content", description: `Detail the concrete next steps and implementation phases for ${cleanTitle}` },
    { id: "item-7", order: 7, title: "Next Steps & Action Plan", layout: "closing", description: "Summarize call-to-actions, opening up for Q&A on this roadmap" },
  ];
  return items.slice(0, Math.max(3, slidesCount)).map((item, idx) => ({
    ...item,
    id: `item-${Date.now()}-${idx}`,
    order: idx,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, tone, audience, slidesCount = 8, chatHistory, currentPlan } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const client = new OpenAI({
      baseURL: "https://llm.kimchi.dev/openai/v1",
      apiKey: process.env['CASTAI_API_KEY'] || process.env['TOKENROUTER_API_KEY'] || "",
    });

    const isRefinement = chatHistory && chatHistory.length > 0 && currentPlan;

    const systemPrompt = `You are an expert presentation strategist. Your job is to create highly structured, topic-specific presentation plans.
Do not use generic titles (like "Introduction", "The Problem", "Conclusion"). Every slide title and description MUST be deeply relevant to the requested topic: "${prompt}".

Return ONLY a valid JSON object (no markdown, no explanation) with exactly these fields:
{
  "message": "A conversational message explaining what you did, referencing the specific topic (2-3 sentences max)",
  "plan": [
    {
      "id": "item-0",
      "order": 0,
      "title": "Slide title specific to ${prompt}",
      "layout": "title",
      "description": "One sentence describing specifically what key sub-topic or research point this slide covers"
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

    let userContent = `Create a presentation plan about: ${prompt}\n\nINSTRUCTIONS:\n${systemPrompt}`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

    if (isRefinement && currentPlan) {
      userContent = `I previously created this plan: ${JSON.stringify(currentPlan)}\n\nNow, refine it based on this new request: ${prompt}\n\nINSTRUCTIONS:\n${systemPrompt}`;
      // Add chat history
      for (const msg of chatHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }
    messages.push({ role: "user", content: userContent });

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
