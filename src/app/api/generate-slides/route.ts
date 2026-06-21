import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { prompt, deckId } = await req.json();

    if (!prompt || !deckId) {
      return NextResponse.json({ error: "Missing prompt or deckId" }, { status: 400 });
    }

    console.log("1. Generating outline via TokenRouter's MiniMax-M3...");
    const tokenRouterClient = new OpenAI({
      baseURL: process.env.TOKENROUTER_BASE_URL || "https://api.tokenrouter.com/v1",
      apiKey: process.env.TOKENROUTER_API_KEY,
    });

    const minimaxResponse = await tokenRouterClient.chat.completions.create({
      model: "MiniMax-M3",
      messages: [
        {
          role: "system",
          content: `You are an expert presentation structure generator.
Generate a structured, slide-by-slide text presentation based on the user's request.
For each slide, specify:
1. Slide Title
2. Suggested Layout (e.g. title, content, data, chart, comparison, quote, closing)
3. Bullet points and key content details.

Make the presentation detailed, professional, and well-organized so that the slide visualizer can build beautiful slides.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const minimaxContent = minimaxResponse.choices[0]?.message?.content || "";
    console.log("TokenRouter outline generation complete.");

    console.log("2. Visualizing slides via Thesys C1 Artifact API...");
    const thesysClient = new OpenAI({
      baseURL: "https://api.thesys.dev/v1/artifact",
      apiKey: process.env.THESYS_API_KEY,
    });

    const response = await thesysClient.chat.completions.create({
      model: "c1/artifact/v-dev",
      messages: [
        {
          role: "system",
          content: "You are a professional presentation designer. Convert the provided structured presentation content into a beautiful slide deck using appropriate C1 slide templates.",
        },
        {
          role: "user",
          content: minimaxContent,
        },
      ],
      metadata: {
        thesys: JSON.stringify({
          c1_artifact_type: "slides",
          id: deckId,
        }),
      },
      stream: true,
    });

    // Create a ReadableStream to stream the response chunks back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error generating slides:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
