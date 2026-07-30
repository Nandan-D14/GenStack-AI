import { NextRequest, NextResponse } from "next/server";
import { generateStructured } from "@/server/generate";
import { PlanChatResponseSchema, type PlanItem } from "@/server/schemas";

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
    } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const hasPlan = currentPlan && Array.isArray(currentPlan) && currentPlan.length > 0;
    const isFirstMessage = chatHistory.length === 0;
    const priorUserMessages = chatHistory.filter((m: ChatMessage) => m.role === "user").length;

    const systemPrompt = `You are an expert presentation strategist and co-pilot inside GenStack AI. You help users plan powerful presentations through natural conversation.

## YOUR PERSONALITY
- Enthusiastic but professional
- Ask smart, targeted questions
- Give specific, actionable advice
- Reference the actual topic in every response — never be generic

## CONVERSATION RULES

### When there is NO existing plan:
${isFirstMessage ? `This is the user's FIRST message. They just created a deck titled "${deckTitle}". 
- Acknowledge their topic with genuine enthusiasm (1 sentence)
- Ask 2-3 SHORT, specific questions to understand their needs:
  * Who exactly is the audience? (investors, team, clients, students?)
  * What's the ONE thing they want the audience to remember?
  * Any specific data, stories, or examples they want included?
- Set action to "chat" — do NOT create a plan yet` : `The user has been chatting but no plan exists yet.
- If you now have enough context (audience, goal, key points), CREATE the plan. Set action to "plan_create".
- If you still need clarity, ask ONE more focused question. Set action to "chat".
- After ${priorUserMessages} user messages, you should have enough context — lean toward creating the plan.`}

### When a plan ALREADY exists:
- If the user asks to CHANGE specific slides (add, remove, reorder, rename, change layout, modify description), update the plan accordingly. Set action to "plan_update".
- If the user asks a QUESTION about presentation strategy, content ideas, or feedback — just answer conversationally. Set action to "chat".
- If the user says something like "looks good", "approve", "done", "let's generate", "perfect" — tell them to click the "Approve & Generate" button. Set action to "chat".

## PLAN CREATION GUIDELINES
When creating or updating a plan:
- Follow this narrative arc: Hook → Problem/Challenge → Evidence/Data → Solution/Approach → Proof/Traction → Call to Action
- Generate ${slidesCount} slides
- First slide MUST be "title" layout
- Last slide MUST be "closing" layout
- Every slide title must be SPECIFIC to "${deckTitle}" — never use generic titles like "Introduction" or "The Problem"
- Each description must explain the specific sub-topic, data point, or argument for that slide

## LAYOUT OPTIONS
- "title": Opening hero slide
- "content": Standard bullet points (3-5 key points)
- "data": Statistics and metrics (bullets should use "Number: Description" format)
- "chart": Timeline or growth visualization
- "quote": Key quote or expert statement
- "two_column": Side-by-side comparison
- "closing": Final call-to-action / summary

## RESPONSE FORMAT
Return ONLY valid JSON — no markdown, no explanation outside the JSON:
{
  "message": "Your conversational response (2-4 sentences, natural and helpful)",
  "plan": null,
  "action": "chat"
}

OR when creating/updating a plan:
{
  "message": "Brief explanation of the plan you created or changes you made",
  "plan": [
    {
      "id": "item-0",
      "order": 0,
      "title": "Topic-specific slide title",
      "layout": "title",
      "description": "Detailed description of what this specific slide covers"
    }
  ],
  "action": "plan_create" or "plan_update"
}`;

    // Build the messages array
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add chat history (last 20 messages for good context)
    const recentHistory = chatHistory.slice(-20);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Build user message with context
    let userContent = message;
    if (hasPlan) {
      userContent += `\n\n[Current plan has ${currentPlan.length} slides: ${currentPlan.map((p: PlanItem) => `"${p.title}" (${p.layout})`).join(", ")}]`;
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

      return NextResponse.json({
        message: parsed.message,
        plan,
        action,
      });
    } catch (err: any) {
      // All retries failed — return a graceful chat response
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
      { status: 500 }
    );
  }
}
