import { NextRequest, NextResponse } from "next/server";
import { getAIClient, extractJson } from "@/server/ai";

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
    {
      id: "item-0", order: 0,
      title: cleanTitle,
      layout: "title",
      description: `Opening title slide that frames the central thesis of "${cleanTitle}" — establishing credibility and previewing the narrative arc for the audience.`,
    },
    {
      id: "item-1", order: 1,
      title: `Why ${cleanTitle} Matters Now`,
      layout: "content",
      description: `Hook the audience by surfacing the urgent pain points and missed opportunities surrounding ${cleanTitle}. Present 3-4 concrete symptoms the audience recognises from their own experience.`,
    },
    {
      id: "item-2", order: 2,
      title: `Root Causes & Landscape`,
      layout: "two_column",
      description: `Diagnose the underlying structural or market forces driving the problem. Left column covers internal organisational challenges; right column maps external pressures such as competition, regulation, and technology shifts related to ${cleanTitle}.`,
    },
    {
      id: "item-3", order: 3,
      title: `Evidence & Key Metrics`,
      layout: "data",
      description: `Present quantitative proof — market size, adoption rates, cost benchmarks, or performance data — that validates the significance of ${cleanTitle} and the cost of inaction.`,
    },
    {
      id: "item-4", order: 4,
      title: `The Proposed Solution`,
      layout: "content",
      description: `Introduce the recommended strategy, framework, or product for ${cleanTitle}. Detail its core pillars, how each pillar addresses a specific root cause identified earlier, and why this approach outperforms alternatives.`,
    },
    {
      id: "item-5", order: 5,
      title: `Proof of Impact`,
      layout: "chart",
      description: `Visualise the projected or historical impact trajectory: Phase 1 (pilot/proof-of-concept), Phase 2 (scaled rollout), Phase 3 (optimisation). Each phase includes concrete KPIs tied to ${cleanTitle}.`,
    },
    {
      id: "item-6", order: 6,
      title: `Expert Perspective`,
      layout: "quote",
      description: `Feature a compelling endorsement or thought-leadership quote from an industry authority that reinforces the credibility and timeliness of the ${cleanTitle} initiative.`,
    },
    {
      id: "item-7", order: 7,
      title: `Call to Action & Next Steps`,
      layout: "closing",
      description: `Close with a clear, time-bound call to action: immediate next steps, owners, and milestones. Restate the single most compelling reason the audience should act on ${cleanTitle} today, then open for Q&A.`,
    },
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

    const { client, model } = getAIClient();

    const isRefinement = chatHistory && chatHistory.length > 0 && currentPlan;

    const systemMessage = `You are an expert presentation strategist who designs compelling narrative arcs. Your job is to create highly structured, topic-specific presentation plans.

NARRATIVE ARC — Every plan MUST follow this progression:
1. Hook: Open with a striking fact, question, or bold claim that seizes attention.
2. Problem: Clearly define the pain point, gap, or challenge the audience cares about.
3. Evidence: Present data, research, or real-world examples that prove the problem is significant.
4. Solution: Introduce the recommended strategy, framework, product, or approach.
5. Proof: Show measurable results, case studies, projections, or testimonials that validate the solution.
6. Call-to-Action: Close with specific, time-bound next steps the audience should take immediately.

RULES:
- Do NOT use generic titles like "Introduction", "The Problem", "Conclusion". Every slide title and description MUST be deeply relevant to the requested topic.
- First slide MUST use "title" layout. Last slide MUST use "closing" layout.
- Generate exactly ${slidesCount} slides.
- Tone: ${tone || "professional"}
- Audience: ${audience || "general"}
- Each plan item id must be "item-{index}" (0-indexed).

Layout options: "title" (opening slide), "content" (bullet points), "data" (stats/numbers), "chart" (visual data), "quote" (key statement), "two_column" (comparison), "closing" (final slide)

Return ONLY a valid JSON object (no markdown, no explanation) with exactly these fields:
{
  "message": "A conversational message explaining what you did, referencing the specific topic (2-3 sentences max)",
  "plan": [
    {
      "id": "item-0",
      "order": 0,
      "title": "Slide title specific to the topic",
      "layout": "title",
      "description": "One sentence describing specifically what key sub-topic or research point this slide covers"
    }
  ]
}`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemMessage },
    ];

    if (isRefinement && currentPlan) {
      // Add chat history
      for (const msg of chatHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
      messages.push({
        role: "user",
        content: `I previously created this plan: ${JSON.stringify(currentPlan)}\n\nNow, refine it based on this new request: ${prompt}`,
      });
    } else {
      messages.push({
        role: "user",
        content: `Create a presentation plan about: ${prompt}`,
      });
    }

    let result: { message: string; plan: PlanItem[] };

    const MAX_ATTEMPTS = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages,
        });

        const raw = response.choices[0]?.message?.content || "";
        result = extractJson(raw);

        if (!Array.isArray(result.plan)) throw new Error("Invalid plan format");

        // Normalize IDs and orders
        result.plan = result.plan.map((item: any, i: number) => ({
          ...item,
          id: `item-${Date.now()}-${i}`,
          order: i,
        }));

        return NextResponse.json(result);
      } catch (err: any) {
        lastError = err;
        console.warn(`Research plan attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    // All retries exhausted — use fallback plan generator
    console.warn("All LLM retries exhausted, using fallback plan generator.");
    result = {
      message: `I've created a ${slidesCount}-slide plan for "${prompt}". You can edit any slide title or description, reorder them, or ask me to modify the structure.`,
      plan: generateFallbackPlan(prompt, slidesCount),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Research plan error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
