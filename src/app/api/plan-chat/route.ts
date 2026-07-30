import { NextRequest, NextResponse } from "next/server";
import {
  generateStructured,
  summarizeConversation,
  type ChatTurn,
} from "@/server/generate";
import { PlanChatResponseSchema, type PlanItem } from "@/server/schemas";
import { planChatSystem } from "@/server/prompts";

// Keep this many recent turns verbatim; older turns get compacted into a summary.
const RECENT_TURNS = 8;
const COMPACT_THRESHOLD = 16;

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
      userMemory = null,
      chatSummary = null,
      contextChunks = null,
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

    // Short-term memory compaction: summarize older turns when the chat is long,
    // and only send the most recent turns verbatim.
    let summary: string = chatSummary || "";
    let history: ChatMessage[] = chatHistory;
    if (chatHistory.length > COMPACT_THRESHOLD) {
      const older = chatHistory.slice(0, -RECENT_TURNS);
      history = chatHistory.slice(-RECENT_TURNS);
      summary = await summarizeConversation(
        older.map((m: ChatMessage) => ({ role: m.role, content: m.content })),
        chatSummary || undefined,
      );
    }

    const systemPrompt = planChatSystem({
      deckTitle,
      tone,
      audience,
      slidesCount,
      isFirstMessage,
      priorUserMessages,
      skill,
      memory: userMemory,
      summary,
      contextChunks,
    });

    const messages: ChatTurn[] = [{ role: "system", content: systemPrompt }];

    for (const msg of history) {
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

      return NextResponse.json({ message: parsed.message, plan, action, summary });
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
