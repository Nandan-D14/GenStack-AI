import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { message, currentSlide, allSlides, deckTitle, history = [] } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const client = new OpenAI({
      baseURL: "https://llm.kimchi.dev/openai/v1",
      apiKey: process.env['CASTAI_API_KEY'] || process.env['TOKENROUTER_API_KEY'] || "",
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

    const userContent = `INSTRUCTIONS:\n${systemPrompt}\n\nUSER MESSAGE:\n${message}`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

    // Add chat history (last 6 messages for context)
    for (const msg of history.slice(-6)) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    messages.push({ role: "user", content: userContent });

    let result;
    try {
      const response = await client.chat.completions.create({
        model: "castai_v1_d3e00ce00d65cd1e23389e0fc71d4bd1db9909af3f0699a27bc5d0dac6ddc7d9_1e5d3cbd",
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
      let slideUpdate: any = null;
      let reply = "I understand. Let me help with that. Could you be more specific about what you'd like to change?";
      
      if (currentSlide) {
        let bullets = [...bulletsParsed];
        let title = currentSlide.title;
        let notes = currentSlide.speakerNotes || "";
        let layout = currentSlide.layout;
        
        // 1. Layout Changes
        if (instr.includes("layout") || instr.includes("template") || instr.includes("make it a") || instr.includes("change to") || instr.includes("style")) {
          const layouts = ["title", "content", "two_column", "data", "chart", "quote", "closing"];
          const foundLayout = layouts.find(l => instr.includes(l.replace("_", " ")) || instr.includes(l));
          if (foundLayout) {
            layout = foundLayout;
            reply = `I've updated the layout of this slide to "${foundLayout.replace("_", " ").toUpperCase()}".`;
            slideUpdate = { title, bullets, speakerNotes: notes, layout };
          }
        }
        
        // 2. Title Changes
        if (!slideUpdate && (instr.includes("title") || instr.includes("rename") || instr.includes("headline") || instr.includes("call it") || instr.includes("heading"))) {
          const titleMatch = message.match(/(?:title|headline|heading|called|rename to|call it|change title to|set title to)\s+["']?([^"'\n\r]+)["']?/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1];
            reply = `I've changed the slide title to "${title}".`;
            slideUpdate = { title, bullets, speakerNotes: notes, layout };
          }
        }
        
        // 3. Add Bullet Point
        if (!slideUpdate && (instr.includes("add bullet") || instr.includes("add point") || instr.includes("insert point") || instr.includes("add item") || instr.includes("add "))) {
          const pointMatch = message.match(/(?:add bullet|add point|insert point|add item|add)\s+["']?([^"'\n\r]+)["']?/i);
          if (pointMatch && pointMatch[1]) {
            const newPoint = pointMatch[1];
            bullets.push(newPoint);
            reply = `I've added the bullet point: "${newPoint}" to this slide.`;
            slideUpdate = { title, bullets, speakerNotes: notes, layout };
          }
        }
        
        // 4. Remove Bullet Point
        if (!slideUpdate && (instr.includes("remove bullet") || instr.includes("delete bullet") || instr.includes("remove point") || instr.includes("delete point") || instr.includes("remove ") || instr.includes("delete "))) {
          const pointMatch = message.match(/(?:remove bullet|delete bullet|remove point|delete point|remove|delete)\s+["']?([^"'\n\r]+)["']?/i);
          if (pointMatch && pointMatch[1]) {
            const target = pointMatch[1].toLowerCase();
            const originalLength = bullets.length;
            bullets = bullets.filter(b => !b.toLowerCase().includes(target));
            if (bullets.length < originalLength) {
              reply = `I've removed the matching bullet point from the slide.`;
              slideUpdate = { title, bullets, speakerNotes: notes, layout };
            }
          }
        }
        
        // 5. Shorten/Condense
        if (!slideUpdate && (instr.includes("short") || instr.includes("condense") || instr.includes("summarize") || instr.includes("brief") || instr.includes("concise"))) {
          bullets = bullets.map(b => b.split(/[.!?]/)[0].trim().substring(0, 50) + (b.length > 50 ? "..." : "")).slice(0, 3);
          reply = `I've shortened the bullet points on this slide to make them more concise and readable.`;
          slideUpdate = { title, bullets, speakerNotes: notes, layout };
        }
        
        // 6. Professional Tone
        if (!slideUpdate && (instr.includes("professional") || instr.includes("formal") || instr.includes("business") || instr.includes("corporate"))) {
          bullets = bullets.map(b => 
            b.replace(/\b(stuff|things)\b/gi, "solutions")
             .replace(/\b(good|nice|cool)\b/gi, "optimized")
             .replace(/\b(bad|wrong)\b/gi, "suboptimal")
             .replace(/\b(make|do)\b/gi, "implement")
             .replace(/\b(help)\b/gi, "facilitate")
          );
          reply = `I've refined the slide content to make the tone highly professional and corporate.`;
          slideUpdate = { title, bullets, speakerNotes: notes, layout };
        }
        
        // 7. Write/Draft Speaker Notes
        if (!slideUpdate && (instr.includes("speaker note") || instr.includes("add notes") || instr.includes("draft notes") || instr.includes("write notes"))) {
          notes = `On this slide, we focus on ${title}. The key takeaways here are: ${bullets.join(". ")}. This sets the stage for our next discussion.`;
          reply = `I've generated speaker notes for you to use during your presentation.`;
          slideUpdate = { title, bullets, speakerNotes: notes, layout };
        }
        
        // 8. General request / Rewrite
        if (!slideUpdate) {
          reply = `I've processed your request. Let me rewrite the content to better align with "${message}".`;
          bullets = [
            `Key point about: ${message}`,
            `Optimized structure and flow`,
            `Designed for professional clarity`
          ];
          slideUpdate = { title, bullets, speakerNotes: notes, layout };
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
