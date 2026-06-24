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
${bulletsParsed.map((b, idx) => `- ${b}`).join("\n")}
Speaker Notes: ${currentSlide.speakerNotes || "None"}`
      : "No slide selected";

    const systemPrompt = `You are a helpful, professional, and friendly AI assistant inside a presentation editor.
Answer the user's questions about their presentation and suggest specific content or layout improvements.

Context:
- Deck title: ${deckTitle || "Presentation"}
- Total slides: ${Array.isArray(allSlides) ? allSlides.length : 0}
- ${currentSlideContext}

Capabilities:
1. Answer general presentation design or topic questions.
2. Provide suggestions on presentation structure.
3. If the user asks to edit, change, rewrite, format, or update the current slide, perform the edits and return a slideUpdate object in your JSON response.

Return ONLY valid JSON:
{
  "reply": "Your conversational, professional response (1-2 sentences)",
  "slideUpdate": null
}

OR if updating the current slide:
{
  "reply": "A brief, friendly explanation of what you updated (1-2 sentences)",
  "slideUpdate": {
    "title": "New title (or null to keep current)",
    "bullets": ["bullet 1", "bullet 2"] or null to keep current,
    "speakerNotes": "New speaker notes or null to keep current"
  }
}`;

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
    } catch (apiError: any) {
      console.warn("Chat slide LLM failed, using fallback:", apiError.message);
      
      const instr = message.toLowerCase();
      let slideUpdate = null;
      let reply = "I understand. Let me help with that. Could you be more specific about what you'd like to change?";
      
      if (currentSlide) {
        let bullets = [...bulletsParsed];
        let title = currentSlide.title;
        let notes = currentSlide.speakerNotes || "";
        
        if (instr.includes("short") || instr.includes("condense") || instr.includes("summarize") || instr.includes("brief")) {
          bullets = bullets.map(b => b.split(/[.!?]/)[0].trim()).slice(0, 3);
          reply = `I've shortened the bullets on your slide "${title}" to make it cleaner and more readable.`;
          slideUpdate = { title, bullets, speakerNotes: notes };
        } else if (instr.includes("professional") || instr.includes("formal") || instr.includes("business")) {
          bullets = bullets.map(b => b.replace(/\b(stuff|things)\b/gi, "capabilities").replace(/\b(good|nice|cool)\b/gi, "optimized"));
          reply = `I've updated the tone of the slide "${title}" to be more professional.`;
          slideUpdate = { title, bullets, speakerNotes: notes };
        } else if (instr.includes("title") || instr.includes("rename") || instr.includes("called")) {
          const titleMatch = message.match(/(?:title|called|named|rename to)\s+["']?([^"'\n\r]+)["']?/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1];
            reply = `I've changed the slide title to "${title}".`;
            slideUpdate = { title, bullets, speakerNotes: notes };
          }
        }
      }
      
      result = { reply, slideUpdate };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Chat slide error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
