import { NextRequest, NextResponse } from "next/server";
import { getAIClient, extractJson } from "@/server/ai";



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
    const { prompt, deckId, tone, audience } = await req.json();

    if (!prompt || !deckId) {
      return NextResponse.json(
        { error: "Missing prompt or deckId" },
        { status: 400 }
      );
    }

    const { client, model } = getAIClient();

    const slidesCount = 7;

    const systemPrompt = `You are an expert presentation designer. Create exactly ${slidesCount} slides for a professional presentation.

CONTENT QUALITY RULES:
- Every bullet point must contain SPECIFIC, substantive information — no filler
- Content must be deeply relevant to the topic, not generic
- Use concrete examples, real data formats, and actionable language

LAYOUT-SPECIFIC RULES:
- "title": 1-2 bullets as subtitle (the value proposition or tagline)
- "content": 4-5 substantive key points, each 8-15 words
- "two_column": 6 bullets — first 3 for left column, last 3 for right column  
- "data": Bullets MUST be "NUMBER: Description" format (e.g., "$4.2B: Market size by 2027")
- "chart": Bullets as timeline phases with metrics (e.g., "Phase 1: Launch with 50 pilot users, 12% adoption")
- "quote": EXACTLY 2 bullets: ["The actual quote text", "— Author Name, Title"]
- "closing": 3 specific action items or key takeaways

STRUCTURE:
- First slide: "title" layout
- Last slide: "closing" layout
- Tone: ${tone || "professional"}
- Audience: ${audience || "general"}

Return ONLY a valid JSON object. No markdown, no explanation:
{
  "slides": [
    {
      "title": "Specific Slide Title",
      "layout": "title|content|data|chart|quote|two_column|closing",
      "bullets": ["bullet 1", "bullet 2"],
      "speakerNotes": "Natural-sounding 2-3 sentence script"
    }
  ]
}`;

    // Retry up to 3 times
    let lastError = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Generate a ${slidesCount}-slide presentation about: "${prompt}"`,
            },
          ],
        });

        const rawContent = response.choices[0]?.message?.content || "";
        const parsed = extractJson(rawContent);

        let slidesJson: any[];
        if (Array.isArray(parsed)) {
          slidesJson = parsed;
        } else if (parsed && Array.isArray(parsed.slides)) {
          slidesJson = parsed.slides;
        } else {
          throw new Error("Response does not contain a slides array");
        }

        return NextResponse.json({ slides: slidesJson });
      } catch (err: any) {
        lastError = err.message;
        console.warn(
          `Slide generation attempt ${attempt + 1} failed:`,
          lastError
        );
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    // All retries failed — use high-quality fallback
    console.warn("All LLM retries exhausted, using fallback slides.");
    return NextResponse.json({
      slides: generateFallbackSlides(prompt, tone, audience),
    });
  } catch (error: any) {
    console.error("Error generating slides:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
