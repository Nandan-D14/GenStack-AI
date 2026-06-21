import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { c1Response, prompt, deckId } = await req.json();

    if (!c1Response || !prompt || !deckId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("Editing slides via C1 Artifact API...");
    const thesysClient = new OpenAI({
      baseURL: "https://api.thesys.dev/v1/artifact",
      apiKey: process.env.THESYS_API_KEY,
    });

    const response = await thesysClient.chat.completions.create({
      model: "c1/artifact/v-dev",
      messages: [
        {
          role: "system",
          content: "You are a professional presentation designer. Modify the existing slides according to the user's instructions while keeping the styling consistent and keeping unaffected slides intact.",
        },
        {
          role: "assistant",
          content: c1Response,
        },
        {
          role: "user",
          content: prompt,
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
          console.error("Streaming error during edit:", err);
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
    console.error("Error editing slides:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
