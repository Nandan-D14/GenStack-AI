import OpenAI from "openai"

/**
 * Robustly extracts a JSON object or array from LLM output that may contain
 * surrounding conversational text, markdown fences, or other non-JSON content.
 */
export function extractJson(raw: string): any {
  const text = raw.trim();

  // 1. Direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // 2. Strip markdown fences
  if (text.startsWith("```")) {
    const stripped = text
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
    try {
      return JSON.parse(stripped);
    } catch {}
  }

  // 3. Find JSON object in text (first { to matching })
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  // 4. Find JSON array in text (first [ to matching ])
  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(text.slice(firstBracket, lastBracket + 1));
    } catch {}
  }

  throw new Error(
    `Could not extract valid JSON from response: "${text.slice(0, 120)}..."`
  );
}

export function getAIClient(): { client: any; model: string } {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const nvidiaBase = process.env.NVIDIA_BASE_URL;
  const nvidiaModel = process.env.NVIDIA_MODEL || "minimaxai/minimax-m3";

  if (nvidiaKey && nvidiaBase) {
    // Custom wrapper that mimics OpenAI client behavior using native fetch
    const client = {
      baseURL: nvidiaBase,
      chat: {
        completions: {
          create: async (params: any) => {
            const endpoint = `${nvidiaBase}/chat/completions`;
            const res = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${nvidiaKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: params.model,
                messages: params.messages,
                temperature: params.temperature ?? 1.0,
                top_p: params.top_p ?? 0.95,
                max_tokens: params.max_tokens ?? 4000,
                response_format: params.response_format,
              }),
            });

            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`Nvidia API error (${res.status}): ${errText}`);
            }

            const data = await res.json();
            return data;
          }
        }
      }
    };

    return {
      client,
      model: nvidiaModel,
    };
  }

  const apiKey = process.env.CASTAI_API_KEY || process.env.TOKENROUTER_API_KEY || "";
  const baseURL = "https://llm.kimchi.dev/openai/v1";
  const modelName = "minimax-m3";

  return {
    client: new OpenAI({
      apiKey,
      baseURL,
    }),
    model: modelName,
  };
}

const { client: openai, model: modelName } = getAIClient();

const MOCK_OUTLINE = (prompt: string) => ({
  title: "AI-Generated Deck",
  objective: `Presentation about: ${prompt}`,
  slides: [
    { title: "Title Slide", layout: "title", bullets: [], visualSuggestion: "none", speakerNotes: "Welcome the audience." },
    { title: "The Problem", layout: "content", bullets: ["Key challenge one", "Key challenge two", "Key challenge three"], visualSuggestion: "icon", speakerNotes: "Describe the problem in detail." },
    { title: "The Solution", layout: "content", bullets: ["Our approach", "How it works", "Key benefits"], visualSuggestion: "diagram", speakerNotes: "Present the solution clearly." },
    { title: "Market Opportunity", layout: "data", bullets: ["$X billion market", "Growing at Y% CAGR", "Z million target users"], visualSuggestion: "chart", speakerNotes: "Show the market size and growth." },
    { title: "Business Model", layout: "content", bullets: ["Revenue streams", "Pricing strategy", "Unit economics"], visualSuggestion: "none", speakerNotes: "Explain how you make money." },
    { title: "Traction & Metrics", layout: "data", bullets: ["A users", "B revenue", "C growth rate"], visualSuggestion: "chart", speakerNotes: "Show real numbers and traction." },
    { title: "Team", layout: "content", bullets: ["Founder background", "Key team members", "Advisory board"], visualSuggestion: "none", speakerNotes: "Introduce the team." },
    { title: "The Ask", layout: "closing", bullets: ["Funding amount", "Use of funds", "Next milestones"], visualSuggestion: "none", speakerNotes: "Make the ask and close strong." },
  ],
});

export async function generateDeckOutline(prompt: string, deckId: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: `You are a presentation strategist. Given a user brief, create a deck outline as JSON. Rules: generate a compelling title; define a clear objective; structure into 3-5 sections; each section has 2-5 slides; total 8-15 slides; follow story arc: Hook -> Problem -> Solution -> Proof -> Call to Action. Return JSON: { title, objective, slides: [{ title, layout, bullets: [], visualSuggestion, speakerNotes }] }.`,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content || "{}"
    return JSON.parse(content)
  } catch (error) {
    console.error("TokenRouter generation failed, falling back to mock data:", error);
    return MOCK_OUTLINE(prompt);
  }
}

export async function generateSlideContent(
  title: string,
  tone?: string,
  length?: string
) {
  try {
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        {
          role: "system",
          content: `You are a slide copywriter. Generate slide content. Rules: headline: max 8 words, punchy; supporting points: 3-5 bullets, max 12 words each; speaker notes: 30-60 seconds of speaking content. Match tone: ${tone || "formal"}. Length: ${length || "same"}. Return JSON: { bullets: [], speakerNotes }.`,
        },
        { role: "user", content: title },
      ],
      response_format: { type: "json_object" },
    })

    const content = completion.choices[0]?.message?.content || "{}"
    return JSON.parse(content)
  } catch (error) {
    console.error("TokenRouter slide content generation failed, falling back to mock:", error);
    return {
      bullets: ["Key point one", "Key point two", "Key point three"],
      speakerNotes: `Speak about ${title} for 30-45 seconds.`,
    }
  }
}

