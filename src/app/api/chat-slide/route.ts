import { NextRequest, NextResponse } from "next/server";
import { generateStructured, type ChatTurn } from "@/server/generate";
import { ChatSlideResponseSchema } from "@/server/schemas";



export async function POST(req: NextRequest) {
  try {
    const {
      message,
      currentSlide,
      allSlides,
      deckTitle,
      history = [],
    } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // Parse current slide bullets
    let bulletsParsed: string[] = [];
    if (currentSlide && currentSlide.content) {
      try {
        const parsed = JSON.parse(currentSlide.content);
        if (Array.isArray(parsed)) {
          bulletsParsed = parsed;
        } else {
          bulletsParsed = [currentSlide.content];
        }
      } catch {
        bulletsParsed = [currentSlide.content];
      }
    }

    const currentSlideContext = currentSlide
      ? `Current slide: "${currentSlide.title}" (layout: ${currentSlide.layout})
Bullets/Content:
${bulletsParsed.map((b: string) => `- ${b}`).join("\n")}
Speaker Notes: ${currentSlide.speakerNotes || "None"}`
      : "No slide selected";

    const systemPrompt = `You are a helpful, professional AI assistant inside a presentation editor called GenStack AI.
You help users improve their slides through natural conversation.

Context:
- Deck title: "${deckTitle || "Presentation"}"
- Total slides: ${Array.isArray(allSlides) ? allSlides.length : 0}
- ${currentSlideContext}

Your capabilities:
1. Answer questions about presentation design, structure, and content strategy
2. Suggest improvements to the current slide's content, layout, or messaging
3. When asked to edit/change/rewrite/update the current slide, make the changes directly

Response format — return ONLY valid JSON:

For conversational responses (no edits):
{
  "reply": "Your helpful, natural response (1-3 sentences)",
  "slideUpdate": null
}

For slide edits:
{
  "reply": "Brief explanation of what you changed and why (1-2 sentences)",
  "slideUpdate": {
    "title": "New title or null to keep current",
    "bullets": ["bullet 1", "bullet 2"] or null to keep current,
    "speakerNotes": "New notes or null to keep current",
    "layout": "New layout or null to keep current"
  }
}

Quality rules for slide edits:
- Every bullet must be 8+ words with specific, substantive content
- For "data" layout, bullets must use "NUMBER: Description" format
- For "quote" layout, exactly 2 bullets: ["Quote text", "— Author"]
- Never use filler phrases like "Key point about..."
- Match the presentation's tone and audience`;

    // Build messages with proper roles
    const messages: ChatTurn[] = [{ role: "system", content: systemPrompt }];

    // Add recent chat history (last 6 messages)
    for (const msg of history.slice(-6)) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: message });

    try {
      const result = await generateStructured({
        task: "chat-slide",
        schema: ChatSlideResponseSchema,
        schemaName: "ChatSlideResponse",
        messages,
        maxRetries: 2,
      });

      return NextResponse.json({
        reply: result.reply,
        slideUpdate: result.slideUpdate ?? null,
      });
    } catch (err: any) {
      console.error("Chat slide failed after retries:", err?.message);
      return NextResponse.json({
        reply:
          "I'm having trouble processing that right now. Could you try rephrasing your request?",
        slideUpdate: null,
      });
    }
  } catch (error: any) {
    console.error("Chat slide error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 }
    );
  }
}
