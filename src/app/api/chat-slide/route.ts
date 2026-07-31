import { NextRequest, NextResponse } from "next/server";
import { generateStructured, type ChatTurn } from "@/server/generate";
import { ChatSlideResponseSchema } from "@/server/schemas";
import { chatSlideSystem } from "@/server/prompts";



export async function POST(req: NextRequest) {
  try {
    const {
      message,
      currentSlide,
      allSlides,
      deckTitle,
      history = [],
      skill = null,
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

    const systemPrompt = chatSlideSystem({
      deckTitle: deckTitle || "Presentation",
      totalSlides: Array.isArray(allSlides) ? allSlides.length : 0,
      currentSlideContext,
      skill: skill || null,
    });

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
