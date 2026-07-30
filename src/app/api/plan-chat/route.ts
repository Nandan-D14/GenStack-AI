import { NextRequest, NextResponse } from "next/server";
import { generateStructured, type ChatTurn } from "@/server/generate";
import { PlanChatResponseSchema, type PlanItem } from "@/server/schemas";
import { planChatSystem } from "@/server/prompts";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function normalizePlan(plan: any[]): PlanItem[] {
  return plan.map((item: any, i: number) => ({
    ...item,
    id: `item-${Date.now()}-${i}`,
    order: i,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      chatHistory = [],
      currentPlan = null,
      deckTitle = "",
      tone = "professional",
      audience = "general",
      slidesCount = 10,
      skill = null,
    } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const hasPlan =
      currentPlan && Array.isArray(currentPlan) && currentPlan.length > 0;
    const isFirstMessage = chatHistory.length === 0;
    const priorUserMessages = chatHistory.filter(
      (m: ChatMessage) => m.role === "user",
    ).length;

    const systemPrompt = planChatSystem({
      deckTitle,
      tone,
      audience,
      slidesCount,
      isFirstMessage,
      priorUserMessages,
      skill,
    });

    const messages: ChatTurn[] = [{ role: "system", content: systemPrompt }];

    // Add chat history (last 20 messages for good context)
    const recentHistory = chatHistory.slice(-20);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    let userContent = message;
    if (hasPlan) {
      userContent += `\n\n[Current plan has ${currentPlan.length} slides: ${currentPlan
        .map((p: PlanItem) => `"${p.title}" (${p.layout})`)
        .join(", ")}]`;
    }
    messages.push({ role: "user", content: userContent });

    try {
      const parsed = await generateStructured({
        task: "plan-chat",
        schema: PlanChatResponseSchema,
        schemaName: "PlanChatResponse",
        messages,
        maxRetries: 2,
      });

      const plan = parsed.plan ? normalizePlan(parsed.plan) : null;
      let action = parsed.action || (plan ? "plan_create" : "chat");
      if (!["chat", "plan_create", "plan_update"].includes(action)) {
        action = plan ? "plan_create" : "chat";
      }

      return NextResponse.json({ message: parsed.message, plan, action });
    } catch (err: any) {
      console.error("Plan chat failed after retries:", err?.message);
      return NextResponse.json({
        message:
          "I'm having trouble connecting right now. Could you try sending your message again in a moment?",
        plan: null,
        action: "chat",
      });
    }
  } catch (error: any) {
    console.error("Plan chat error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 },
    );
  }
}
