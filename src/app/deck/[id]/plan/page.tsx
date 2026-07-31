"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Sparkles, ArrowLeft, CheckCircle, Send, Plus, GripVertical, Trash2, Loader2, MessageCircle } from "lucide-react";
import { ChatBubble, Chip, ThinkingTrace, TaskRow, ContextCard } from "@/components/ui";

type PlanItem = {
  id: string;
  order: number;
  title: string;
  layout:
    | "title"
    | "content"
    | "data"
    | "chart"
    | "quote"
    | "two_column"
    | "closing";
  description: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GenerationMode = "custom" | "template";

const LAYOUT_LABELS: Record<string, string> = {
  title: "Title",
  content: "Content",
  data: "Data",
  chart: "Chart",
  quote: "Quote",
  two_column: "Two Col",
  closing: "Closing",
};

const LAYOUT_COLORS: Record<string, string> = {
  title: "bg-gs-accent-soft text-gs-accent-text border-gs-accent/30",
  content: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  data: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  chart: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  quote: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  two_column: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  closing: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

export default function PlanPage() {
  const { id } = useParams();
  const router = useRouter();

  const [phase, setPhase] = useState<
    "discovery" | "planning" | "generating" | "done"
  >("discovery");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState(-1);
  const [slideStatus, setSlideStatus] = useState<
    Record<number, "queued" | "generating" | "done" | "failed">
  >({});
  const [completedCount, setCompletedCount] = useState(0);
  const [hasStartedResearch, setHasStartedResearch] = useState(false);
  const [generationMode, setGenerationMode] =
    useState<GenerationMode>("custom");

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const deck = useQuery(api.decks.getById, id ? { id: id as any } : "skip");
  const memory = useQuery(api.memory.getMine);
  const runUpdatePlan = useMutation(api.decks.updatePlan);
  const runUpdateChatHistory = useMutation(api.decks.updateChatHistory);
  const runReplaceAllSlides = useMutation(api.slides.replaceAllSlides);
  const runUpsertMemory = useMutation(api.memory.upsert);
  const runSearch = useAction(api.rag.search);

  // Retrieve top-k relevant source chunks (RAG) for a query, formatted for prompts.
  const retrieveContext = async (queryText: string): Promise<string | null> => {
    try {
      const chunks = await runSearch({ deckId: id as any, query: queryText, k: 4 });
      if (!chunks || chunks.length === 0) return null;
      return chunks
        .map((c: any, i: number) => `[${i + 1}] (${c.source}) ${c.text}`)
        .join("\n\n");
    } catch {
      return null;
    }
  };

  const [chatSummary, setChatSummary] = useState<string>("");

  // Build a compact, human-readable memory string for the AI from the user's
  // long-term memory record (brand voice notes + preferences).
  const memoryString = useMemo(() => {
    if (!memory) return "";
    const parts: string[] = [];
    if ((memory as any).notes) parts.push((memory as any).notes);
    try {
      const prefs = (memory as any).preferences
        ? JSON.parse((memory as any).preferences)
        : null;
      if (prefs) {
        if (prefs.tone) parts.push(`Preferred tone: ${prefs.tone}`);
        if (prefs.audience) parts.push(`Usual audience: ${prefs.audience}`);
      }
    } catch {}
    return parts.join("\n");
  }, [memory]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isProcessing]);

  // Initialize conversation when deck loads
  useEffect(() => {
    if (!deck || hasStartedResearch) return;
    setHasStartedResearch(true);

    setGenerationMode(
      (deck as any).generationMode === "template" ? "template" : "custom",
    );
    setChatSummary((deck as any).chatSummary || "");

    let loadedPlan = false;
    if (deck.planItems) {
      try {
        const saved = JSON.parse(deck.planItems as string);
        if (Array.isArray(saved) && saved.length > 0) {
          setPlanItems(saved);
          setPhase("planning");
          loadedPlan = true;
        }
      } catch {}
    }

    if (deck.chatHistory) {
      try {
        const savedChat = JSON.parse(deck.chatHistory as string);
        if (Array.isArray(savedChat) && savedChat.length > 0) {
          setChatMessages(savedChat);
          if (!loadedPlan) setPhase("discovery");
          return;
        }
      } catch {}
    }

    if (loadedPlan) {
      addMsg(
        "assistant",
        "I've loaded your saved plan. You can edit any slide, chat to refine, or approve when ready.",
      );
    } else {
      // Discovery phase — greet the user and ask clarifying questions
      setPhase("discovery");
      const title = (deck as any)?.title || "your presentation";
      addMsg(
        "assistant",
        `Great topic — "${title}"! 🎯\n\nBefore I build your slide plan, I'd love to understand your goals:\n\n• Who's your target audience? (investors, team, clients, conference?)\n• What's the ONE key takeaway you want them to remember?\n• Any specific data, stories, or examples to include?\n\nJust tell me in your own words and I'll craft the perfect structure.`,
      );
    }
  }, [deck]);

  const addMsg = (role: "user" | "assistant", content: string) => {
    setChatMessages((prev) => {
      const next = [...prev, { role, content }];
      runUpdateChatHistory({ id: id as any, chatHistory: JSON.stringify(next) }).catch(console.error);
      return next;
    });
  };

  const handleChatSend = async () => {
    const msg = chatInput.trim();
    if (!msg || isProcessing) return;
    setChatInput("");
    addMsg("user", msg);
    setIsProcessing(true);

    try {
      const contextChunks = await retrieveContext(msg);
      const res = await fetch("/api/plan-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          chatHistory: [...chatMessages, { role: "user", content: msg }],
          currentPlan: planItems.length > 0 ? planItems : null,
          deckTitle: (deck as any)?.title || "",
          tone: (deck as any)?.tone || "professional",
          audience: (deck as any)?.audience || "general",
          slidesCount: planItems.length || (deck as any)?.slidesCount || 10,
          skill: (deck as any)?.designSkill || null,
          userMemory: memoryString || null,
          chatSummary: chatSummary || null,
          contextChunks: contextChunks || null,
        }),
      });

      const data = await res.json();
      if (typeof data.summary === "string") setChatSummary(data.summary);
      if (data.message) addMsg("assistant", data.message);

      // If the AI returned a plan (created or updated), apply it
      if (data.plan && Array.isArray(data.plan) && data.plan.length > 0) {
        setPlanItems(data.plan);
        setPhase("planning");
        await runUpdatePlan({
          id: id as any,
          planItems: JSON.stringify(data.plan),
          planStatus: "planning",
          generationMode,
        });
      }
    } catch {
      addMsg("assistant", "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleApprove = async () => {
    if (planItems.length === 0 || phase !== "planning") return;
    setPhase("generating");
    setCompletedCount(0);
    setSlideStatus(
      Object.fromEntries(planItems.map((_, i) => [i, "queued" as const])),
    );
    addMsg(
      "assistant",
      `Plan approved! Generating ${planItems.length} slides in parallel (${generationMode === "template" ? "Thesys template" : "custom"} mode)...`,
    );

    await runUpdatePlan({
      id: id as any,
      planItems: JSON.stringify(planItems),
      planStatus: "generating",
      generationMode,
    });

    const endpoint =
      generationMode === "template"
        ? "/api/generate-c1-single-slide"
        : "/api/generate-single-slide";

    // Results are written by index so the deck order is preserved even though
    // slides finish out of order.
    const generatedSlides: any[] = new Array(planItems.length);

    const generateOne = async (i: number) => {
      setSlideStatus((s) => ({ ...s, [i]: "generating" }));
      setGeneratingIndex(i);

      const contextChunks = await retrieveContext(
        `${planItems[i].title} ${planItems[i].description}`,
      );

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planItem: planItems[i],
              deckContext: (deck as any)?.title || "",
              tone: (deck as any)?.tone || "professional",
              audience: (deck as any)?.audience || "general",
              allPlanItems: planItems,
              deckId: id,
              skill: (deck as any)?.designSkill || null,
              userMemory: memoryString || null,
              contextChunks: contextChunks || null,
            }),
          });
          const slideData = await res.json();
          if (slideData.error) throw new Error(slideData.error);

          generatedSlides[i] = {
            title: slideData.title || planItems[i].title,
            layout: slideData.layout || planItems[i].layout,
            bullets: Array.isArray(slideData.bullets)
              ? slideData.bullets
              : [planItems[i].description],
            speakerNotes: slideData.speakerNotes || "",
            c1Dsl: slideData.c1Dsl || undefined,
          };
          setSlideStatus((s) => ({ ...s, [i]: "done" }));
          setCompletedCount((c) => c + 1);
          return;
        } catch {
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }

      // All retries failed — insert an editable placeholder.
      generatedSlides[i] = {
        title: planItems[i].title,
        layout: planItems[i].layout,
        bullets: [planItems[i].description, "Edit this slide manually in the editor"],
        speakerNotes: "",
      };
      setSlideStatus((s) => ({ ...s, [i]: "failed" }));
      setCompletedCount((c) => c + 1);
      addMsg(
        "assistant",
        `⚠️ Slide ${i + 1} couldn't be generated after retries. You can edit it in the editor.`,
      );
    };

    // Bounded-concurrency pool: generate several slides at once instead of
    // serially, so an N-slide deck no longer takes N x (per-slide latency).
    const CONCURRENCY = 4;
    const queue = planItems.map((_, i) => i);
    let cursor = 0;
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, queue.length) },
      async () => {
        while (cursor < queue.length) {
          const i = queue[cursor++];
          await generateOne(i);
        }
      },
    );
    await Promise.all(workers);

    await runReplaceAllSlides({ deckId: id as any, slides: generatedSlides });
    await runUpdatePlan({
      id: id as any,
      planItems: JSON.stringify(planItems),
      planStatus: "done",
      generationMode,
    });

    // Persist long-term preferences so future decks remember tone/audience.
    try {
      await runUpsertMemory({
        preferences: JSON.stringify({
          tone: (deck as any)?.tone || "professional",
          audience: (deck as any)?.audience || "general",
          lastTopic: (deck as any)?.title || "",
        }),
      });
    } catch {}

    setPhase("done");
    setGeneratingIndex(-1);
    addMsg("assistant", "All slides generated successfully! Opening editor...");
    const deckId = (deck as any)?._id || id;
    setTimeout(() => router.push(`/deck/${deckId}/editor`), 1200);
  };

  const updateItem = (itemId: string, field: keyof PlanItem, value: string) => {
    setPlanItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    );
  };

  const deleteItem = (itemId: string) => {
    setPlanItems((prev) =>
      prev
        .filter((i) => i.id !== itemId)
        .map((item, idx) => ({ ...item, order: idx })),
    );
  };

  const handleDrop = (dropIdx: number) => {
    if (draggedItemIndex === null || draggedItemIndex === dropIdx) return;
    setPlanItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(draggedItemIndex, 1);
      next.splice(dropIdx, 0, removed);
      return next.map((item, i) => ({ ...item, order: i }));
    });
    setDraggedItemIndex(null);
  };

  const addItem = () => {
    const newItem: PlanItem = {
      id: `item-${Date.now()}`,
      order: planItems.length,
      title: "New Slide",
      layout: "content",
      description: "Describe what this slide should cover",
    };
    setPlanItems((prev) => [...prev, newItem]);
  };

  const isEditable = phase === "planning";
  const progressPct =
    planItems.length > 0 && phase === "generating"
      ? Math.round((completedCount / planItems.length) * 100)
      : 0;

  return (
    <div className="h-screen bg-gs-bg text-gs-text flex flex-col overflow-hidden font-sans">
      <header className="h-12 shrink-0 border-b border-gs-border px-4 flex items-center gap-3 bg-gs-bg/90 backdrop-blur-md z-20">
        <Button
          isIconOnly
          variant="light"
          className="text-gs-secondary hover:text-gs-text min-w-8 w-8 h-8"
          onPress={() => router.push("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold truncate">
            {(deck as any)?.title || "Planning Agent"}
          </h1>
        </div>
        <Chip tone={isProcessing ? "warning" : "success"}>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isProcessing ? "bg-amber-400 animate-gs-pulse" : "bg-emerald-400"
            }`}
          />
          {isProcessing
            ? "Thinking"
            : phase === "generating"
              ? "Generating"
              : phase === "discovery"
                ? "Discovery"
                : "Planning"}
        </Chip>
      </header>

      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* Chat */}
        <div className="w-1/2 flex flex-col gs-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-gs-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-gs-accent-soft border border-gs-accent/30 flex items-center justify-center">
              <Sparkles className="text-gs-accent w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Planning agent</p>
              <p className="text-[11px] text-gs-muted truncate">
                {phase === "discovery"
                  ? "Align on goals, then generate a slide plan"
                  : "Refine the plan or approve to generate slides"}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gs-muted">
                <MessageCircle className="w-6 h-6 mb-3 text-gs-accent" />
                <p className="text-sm">Loading your AI co-pilot…</p>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <ChatBubble key={i} role={msg.role}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </ChatBubble>
            ))}

            {isProcessing && (
              <ThinkingTrace title="Agent thinking">
                Retrieving memory & RAG context → drafting next response…
              </ThinkingTrace>
            )}

            {memoryString && phase !== "generating" && (
              <ContextCard source="User memory" text={memoryString} />
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-gs-border bg-gs-elevated">
            <div className="flex items-center gap-2 rounded-md border border-gs-border bg-gs-surface-2 p-1.5 focus-within:border-gs-accent/50 focus-within:ring-1 focus-within:ring-gs-accent/30">
              <Input
                ref={inputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSend();
                  }
                }}
                placeholder={
                  phase === "discovery"
                    ? "Tell the AI about your presentation goals…"
                    : phase === "planning"
                      ? 'Refine — e.g. "Add an ROI slide"'
                      : "Generation in progress…"
                }
                disabled={isProcessing || phase === "generating" || phase === "done"}
                className="flex-1"
                classNames={{
                  inputWrapper:
                    "bg-transparent shadow-none border-none hover:bg-transparent group-data-[focus=true]:bg-transparent",
                  input: "text-sm text-gs-text placeholder:text-gs-muted",
                }}
              />
              <Button
                isIconOnly
                className="bg-gs-accent text-white w-9 h-9 min-w-9 rounded-md"
                onPress={handleChatSend}
                disabled={
                  !chatInput.trim() ||
                  isProcessing ||
                  phase === "generating" ||
                  phase === "done"
                }
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Plan / tasks */}
        <div className="w-1/2 flex flex-col gs-panel overflow-hidden relative">
          {phase === "generating" && (
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gs-surface-3 z-10">
              <div
                className="h-full bg-gs-accent transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          <div className="px-4 py-3 border-b border-gs-border flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Presentation plan</h2>
              <p className="text-[11px] text-gs-muted mt-0.5">
                {planItems.length > 0
                  ? `${planItems.length} slides · drag to reorder`
                  : "Chat to generate a structured plan"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {phase === "planning" && planItems.length > 0 && (
                <Button
                  className="bg-gs-accent text-white font-medium rounded-md h-8 text-xs"
                  startContent={<CheckCircle className="w-3.5 h-3.5" />}
                  onPress={handleApprove}
                >
                  Approve & generate
                </Button>
              )}
              {phase === "generating" && (
                <Chip tone="accent">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {completedCount}/{planItems.length}
                </Chip>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4">
            {phase === "generating" && planItems.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-medium text-gs-muted uppercase tracking-wide mb-2">
                  Generation tasks
                </p>
                {planItems.map((item, idx) => (
                  <TaskRow
                    key={`task-${item.id}`}
                    index={idx}
                    title={item.title}
                    subtitle={LAYOUT_LABELS[item.layout]}
                    status={slideStatus[idx] || "queued"}
                  />
                ))}
              </div>
            )}

            {planItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gs-muted px-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-gs-surface-2 border border-gs-border flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-gs-muted" />
                </div>
                <p className="text-sm font-medium text-gs-secondary">Your plan will appear here</p>
                <p className="text-xs mt-2 max-w-xs leading-relaxed">
                  Align with the agent on goals. It will propose layouts you can approve before generation.
                </p>
              </div>
            ) : phase !== "generating" ? (
              <div className="space-y-2.5 pb-8">
                {planItems.map((item, idx) => {
                  const isDragging = draggedItemIndex === idx;
                  return (
                    <div
                      key={item.id}
                      draggable={isEditable}
                      onDragStart={() => setDraggedItemIndex(idx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(idx);
                      }}
                      className={`group relative flex items-start gap-3 p-3.5 rounded-lg border transition-colors ${
                        isDragging
                          ? "opacity-40 border-dashed border-gs-border-strong"
                          : "border-gs-border bg-gs-surface-2 hover:border-gs-border-strong"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 mt-0.5">
                        {isEditable && (
                          <div className="cursor-grab active:cursor-grabbing text-gs-muted hover:text-gs-secondary">
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}
                        <span className="w-6 h-6 rounded-md bg-gs-surface-3 text-gs-secondary flex items-center justify-center text-[11px] font-semibold font-mono">
                          {idx + 1}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                              LAYOUT_COLORS[item.layout] ||
                              "bg-gs-surface text-gs-muted border-gs-border"
                            }`}
                          >
                            {LAYOUT_LABELS[item.layout] || item.layout}
                          </span>
                          {isEditable && (
                            <Dropdown
                              classNames={{
                                content:
                                  "bg-gs-surface-2 border border-gs-border min-w-[150px] rounded-lg",
                              }}
                            >
                              <DropdownTrigger>
                                <Button
                                  size="sm"
                                  variant="light"
                                  className="h-6 text-[10px] text-gs-muted hover:text-gs-text px-2 min-w-0"
                                >
                                  Layout
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Select layout"
                                itemClasses={{
                                  base: "text-gs-secondary data-[hover=true]:bg-gs-hover data-[hover=true]:text-gs-text rounded-md py-1.5",
                                }}
                                onAction={(key) =>
                                  updateItem(item.id, "layout", key as string)
                                }
                              >
                                {Object.entries(LAYOUT_LABELS).map(([val, label]) => (
                                  <DropdownItem key={val}>{label}</DropdownItem>
                                ))}
                              </DropdownMenu>
                            </Dropdown>
                          )}
                        </div>

                        {isEditable ? (
                          <div className="space-y-1.5">
                            <Input
                              variant="underlined"
                              value={item.title}
                              onChange={(e) =>
                                updateItem(item.id, "title", e.target.value)
                              }
                              classNames={{
                                input: "text-sm font-semibold text-gs-text",
                                inputWrapper:
                                  "px-0 border-gs-border data-[hover=true]:border-gs-border-strong",
                              }}
                              placeholder="Slide title"
                            />
                            <Input
                              variant="underlined"
                              value={item.description}
                              onChange={(e) =>
                                updateItem(item.id, "description", e.target.value)
                              }
                              classNames={{
                                input: "text-xs text-gs-secondary",
                                inputWrapper:
                                  "px-0 border-gs-border data-[hover=true]:border-gs-border-strong",
                              }}
                              placeholder="Slide description"
                            />
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-gs-text">{item.title}</p>
                            <p className="text-xs text-gs-secondary">{item.description}</p>
                          </div>
                        )}
                      </div>

                      {isEditable && planItems.length > 2 && (
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 text-gs-muted hover:text-gs-danger"
                          onPress={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}

                {isEditable && (
                  <Button
                    variant="bordered"
                    className="w-full h-11 border-dashed border-gs-border text-gs-secondary hover:text-gs-text hover:border-gs-border-strong rounded-lg text-sm"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={addItem}
                  >
                    Add slide
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
