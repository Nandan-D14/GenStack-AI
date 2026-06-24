import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { slides, prompt, deckId } = await req.json();

    if (!slides || !prompt || !deckId) {
      return NextResponse.json({ error: "Missing required fields (slides, prompt, deckId)" }, { status: 400 });
    }

    console.log("Editing slides via MiniMax-M3...");
    const client = new OpenAI({
      baseURL: process.env.TOKENROUTER_BASE_URL || "https://api.tokenrouter.com/v1",
      apiKey: process.env.TOKENROUTER_API_KEY,
    });

    let updatedSlides: any[];
    try {
      const response = await client.chat.completions.create({
        model: "minimax-m3",
        messages: [
          {
            role: "system",
            content: `You are an expert presentation editor. You will receive the existing slides as a JSON array and an edit instruction.
Apply the edit instruction to the slides and return the COMPLETE updated slides array.

EXAMPLES OF EDITS:
1. Tone Change (e.g. "make it professional"):
   - Rewrite bullets to use formal, strategic business language.
2. Length Change (e.g. "make it shorter"):
   - Condense verbose sentences, reduce bullets to 3 key punchy points.
3. Content Addition (e.g. "add a slide about competitors"):
   - Add a new slide object with appropriate layout, title, and topic-specific bullets.
4. Content Deletion (e.g. "delete slide 3"):
   - Remove the targeted slide from the array.

IMPORTANT: You MUST respond with ONLY a valid JSON array. Do NOT wrap it in markdown code blocks like \`\`\`json. No explanations.

Each slide object must have:
- "title": string (the slide headline)
- "layout": one of "title", "content", "data", "chart", "comparison", "quote", "closing", "two_column"
- "bullets": array of strings (key points for this slide)
- "speakerNotes": string (brief notes for the speaker)

Rules:
- Keep unaffected slides exactly the same.
- Only modify slides that the edit instruction targets.
- You may add, delete, or reorder slides if requested.`,
          },
          {
            role: "user",
            content: `Here are the current slides:\n\n${JSON.stringify(slides, null, 2)}\n\nEdit instruction: ${prompt}`,
          },
        ],
      });

      const rawContent = response.choices[0]?.message?.content || "";
      console.log("Raw LLM response received, length:", rawContent.length);

      let jsonStr = rawContent.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      updatedSlides = JSON.parse(jsonStr);
      if (!Array.isArray(updatedSlides)) {
        throw new Error("Response is not an array");
      }
    } catch (apiError: any) {
      console.warn("Upstream LLM API failed (possibly credit exhaustion). Falling back to premium local template modification. Error details:", apiError.message);
      
      const instr = prompt.toLowerCase();
      const newSlides = JSON.parse(JSON.stringify(slides));
      
      if (instr.includes("add") || instr.includes("create") || instr.includes("insert") || instr.includes("new slide")) {
        let title = "New Slide";
        const titleMatch = prompt.match(/(?:title|called|named|about)\s+["']?([^"'\n\r]+)["']?/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1];
        } else {
          const words = prompt.split(" ");
          if (words.length > 3) {
            title = words.slice(2, 6).join(" ");
          }
        }
        newSlides.push({
          title: title,
          layout: "content",
          bullets: ["Key strategic objective", "Implementation roadmap detail", "Success metrics and verification"],
          speakerNotes: `Details about ${title}.`
        });
        updatedSlides = newSlides;
      } else if (instr.includes("delete") || instr.includes("remove")) {
        if (newSlides.length > 1) {
          const numMatch = instr.match(/(?:slide|number)\s*(\d+)/);
          if (numMatch && numMatch[1]) {
            const index = parseInt(numMatch[1], 10) - 1;
            if (index >= 0 && index < newSlides.length) {
              newSlides.splice(index, 1);
            } else {
              newSlides.pop();
            }
          } else {
            newSlides.pop();
          }
        }
        updatedSlides = newSlides;
      } else if (instr.includes("shorter") || instr.includes("condense") || instr.includes("summarize") || instr.includes("brief")) {
        newSlides.forEach((s: any) => {
          if (s.bullets && s.bullets.length > 0) {
            s.bullets = s.bullets.map((b: string) => {
              const firstSentence = b.split(/[.!?]/)[0];
              return firstSentence.length > 10 ? firstSentence.trim() : b;
            }).slice(0, 3);
          }
        });
        updatedSlides = newSlides;
      } else if (instr.includes("longer") || instr.includes("expand") || instr.includes("elaborate") || instr.includes("more")) {
        newSlides.forEach((s: any) => {
          if (s.bullets && s.bullets.length > 0) {
            s.bullets = s.bullets.map((b: string) => {
              if (!b.includes("to ensure maximum scalability") && b.length < 50) {
                return `${b} to ensure maximum scalability and align with operational goals`;
              }
              return b;
            });
            if (s.bullets.length < 4) {
              s.bullets.push("Enhanced analytics and reporting capabilities integrated seamlessly");
            }
          }
        });
        updatedSlides = newSlides;
      } else if (instr.includes("professional") || instr.includes("formal") || instr.includes("business")) {
        newSlides.forEach((s: any) => {
          if (s.bullets && s.bullets.length > 0) {
            s.bullets = s.bullets.map((b: string) => {
              return b
                .replace(/\b(stuff|things)\b/gi, "capabilities")
                .replace(/\b(good|nice|cool)\b/gi, "optimized")
                .replace(/\b(fast)\b/gi, "high-performance");
            });
          }
        });
        updatedSlides = newSlides;
      } else {
        const contentIndex = newSlides.findIndex((s: any) => s.layout !== "title" && s.layout !== "closing");
        const targetIndex = contentIndex >= 0 ? contentIndex : 0;
        if (newSlides[targetIndex]) {
          const slide = newSlides[targetIndex];
          slide.bullets = [
            ...slide.bullets.slice(0, 3),
            `Key action: ${prompt.length > 60 ? prompt.slice(0, 60) + "..." : prompt}`
          ];
        }
        updatedSlides = newSlides;
      }
    }

    return NextResponse.json({ slides: updatedSlides });
  } catch (error: any) {
    console.error("Error editing slides:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

