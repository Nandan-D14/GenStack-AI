import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { message, currentSlide, allSlides, deckTitle, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const client = new OpenAI({
      baseURL: process.env.TOKENROUTER_BASE_URL || "https://api.tokenrouter.com/v1",
      apiKey: process.env.TOKENROUTER_API_KEY,
    });

    const currentSlideContext = currentSlide
      ? `Current slide: "${currentSlide.title}" (layout: ${currentSlide.layout})\nContent: ${currentSlide.content}`
      : "No slide selected";

    const systemPrompt = `You are an AI assistant inside a presentation editor. Help the user edit and improve their presentation.

Context:
- Deck title: ${deckTitle || "Presentation"}
- Total slides: ${Array.isArray(allSlides) ? allSlides.length : 0}
- ${currentSlideContext}

You can:
1. Answer questions about the presentation
2. Suggest improvements
3. If the user asks to edit/change/update the current slide, include a slideUpdate in your response

Return ONLY valid JSON:
{
  "reply": "Your helpful response to the user",
  "slideUpdate": null
}

OR if updating the current slide:
{
  "reply": "Explanation of what you changed",
  "slideUpdate": {
    "title": "New title (or null to keep current)",
    "bullets": ["bullet 1", "bullet 2"] or null to keep current,
    "speakerNotes": "New speaker notes or null to keep current"
  }
}

Keep replies concise (2-3 sentences). Only include slideUpdate when the user explicitly asks to change/edit/update/regenerate the slide.`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add chat history (last 6 messages for context)
    for (const msg of history.slice(-6)) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: message });

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
    } catch {
      result = {
        reply: "I understand. Let me help with that. Could you be more specific about what you'd like to change?",
        slideUpdate: null,
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Chat slide error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
