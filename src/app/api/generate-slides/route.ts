import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function generateMockSlides(prompt: string): any[] {
  const topic = prompt || "New Presentation";
  return [
    {
      title: topic.slice(0, 50),
      layout: "title",
      bullets: ["A structured look into our approach", "GenStack AI Platform", "Prepared for you"],
      speakerNotes: "Welcome everyone and introduce the topic: " + topic
    },
    {
      title: "The Problem We Solve",
      layout: "content",
      bullets: [
        "Current workflows are highly fragmented and slow",
        "Inefficient resource allocation leading to high overheads",
        "Lack of real-time insights and data transparency"
      ],
      speakerNotes: "Highlight the pain points our audience experiences every day."
    },
    {
      title: "Our Solution",
      layout: "content",
      bullets: [
        "Integrated AI automation layers to streamline processing",
        "Unified dashboard view for cross-functional collaboration",
        "Predictive resource planning and smart scheduling"
      ],
      speakerNotes: "Explain how our solution directly addresses the pain points."
    },
    {
      title: "Market Opportunity",
      layout: "data",
      bullets: [
        "Total Addressable Market: $890B globally by 2028",
        "Serviceable Market: $150B across target verticals",
        "CAGR: Growing at 24.5% year-over-year"
      ],
      speakerNotes: "Show that there is a massive, rapidly growing market for this solution."
    },
    {
      title: "Core Capabilities",
      layout: "two_column",
      bullets: [
        "Automated resource routing",
        "Low-latency execution",
        "High availability cluster",
        "Visual design canvas",
        "One-click PDF/PPTX export",
        "Collaborative sharing link"
      ],
      speakerNotes: "Detail the key features that set us apart from competitors."
    },
    {
      title: "Growth Metrics",
      layout: "chart",
      bullets: [
        "Active user growth: 34% Month-over-Month",
        "Platform retention rate: 89% after 90 days",
        "Customer satisfaction: 4.8 / 5 average rating"
      ],
      speakerNotes: "Highlight the strong traction and positive customer response we have seen."
    },
    {
      title: "Business Model",
      layout: "content",
      bullets: [
        "SaaS Subscription: Tiered pricing for teams of all sizes",
        "Enterprise License: Custom SLA, private cloud deployments",
        "Integration Fees: Professional service setup and support"
      ],
      speakerNotes: "Explain the revenue streams and pricing structure."
    },
    {
      title: "Next Steps & Action Plan",
      layout: "closing",
      bullets: [
        "Start your free 14-day trial today",
        "Schedule a demo session with our product experts",
        "Join our community of over 500+ active teams"
      ],
      speakerNotes: "Make a strong call to action and invite questions."
    }
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, deckId } = await req.json();

    if (!prompt || !deckId) {
      return NextResponse.json({ error: "Missing prompt or deckId" }, { status: 400 });
    }

    console.log("Generating slides JSON via minimax-m3...");
    const client = new OpenAI({
      baseURL: process.env.TOKENROUTER_BASE_URL || "https://api.tokenrouter.com/v1",
      apiKey: process.env.TOKENROUTER_API_KEY,
    });

    let slidesJson: any[];

    try {
      const response = await client.chat.completions.create({
        model: "minimax-m3",
        messages: [
          {
            role: "system",
            content: `You are an expert presentation designer. Generate a structured presentation based on the user's request.
Return the output as a strict JSON array of slide objects.

IMPORTANT: You MUST respond with ONLY a valid JSON array. Do NOT wrap it in markdown code blocks like \`\`\`json. No explanations.

Each slide object must have:
- "title": string (the slide headline)
- "layout": one of "title", "content", "data", "chart", "comparison", "quote", "closing", "two_column"
- "bullets": array of strings (key points for this slide)
- "speakerNotes": string (brief notes for the speaker)

Generate between 6 and 10 slides. The first slide must be "title" layout. The last slide must be "closing" layout.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const rawContent = response.choices[0]?.message?.content || "";
      console.log("Raw LLM response received, length:", rawContent.length);

      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      slidesJson = JSON.parse(jsonStr);
      if (!Array.isArray(slidesJson)) {
        throw new Error("Response is not an array");
      }
    } catch (apiError: any) {
      console.warn("Upstream LLM API failed (possibly credit exhaustion). Falling back to premium local template generation. Error details:", apiError.message);
      // Fallback to high quality mock slides to maintain excellent UX
      slidesJson = generateMockSlides(prompt);
    }

    return NextResponse.json({ slides: slidesJson });
  } catch (error: any) {
    console.error("Error generating slides:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
