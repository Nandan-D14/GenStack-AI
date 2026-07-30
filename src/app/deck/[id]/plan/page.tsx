"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Progress, Tooltip, ScrollShadow } from "@heroui/react";
import { Sparkles, ArrowLeft, CheckCircle, Send, Plus, GripVertical, Trash2, Edit3, Loader2, MessageCircle } from "lucide-react";

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
  title: "bg-primary/20 text-primary border-primary/30",
  content: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  data: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  chart: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  quote: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  two_column: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  closing: "bg-rose-500/20 text-rose-400 border-rose-500/30",
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
  const runUpdatePlan = useMutation(api.decks.updatePlan);
  const runUpdateChatHistory = useMutation(api.decks.updateChatHistory);
  const runReplaceAllSlides = useMutation(api.slides.replaceAllSlides);

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
          slidesCount: planItems.length || 10,
        }),
      });

      const data = await res.json();
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

    setPhase("done");
    setGeneratingIndex(-1);
    addMsg("assistant", "All slides generated successfully! Opening editor...");
    setTimeout(() => router.push(`/deck/${id}/editor`), 1200);
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
    <div className="h-screen bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden relative font-sans">
      {/* Top bar (Transparent/Floating) */}
      <header className="absolute top-0 left-0 w-full h-14 flex items-center px-6 gap-4 bg-transparent z-50 pointer-events-none">
        <Button
          isIconOnly
          variant="light"
          className="text-zinc-400 hover:text-white pointer-events-auto"
          onPress={() => router.push("/dashboard")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1" />
      </header>

      {/* Two-panel body */}
      <div className="flex-1 flex overflow-hidden pt-4 pb-4 px-4 gap-4">
        {/* LEFT: Chat panel (Half screen, modern) */}
        <div className="w-1/2 flex flex-col bg-transparent rounded-3xl overflow-hidden relative">
          
          <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-[#09090b]">
             <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-wide text-zinc-100">
                  {(deck as any)?.title || "Planning Agent"}
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                  {isProcessing ? "AI is thinking..." : phase === "discovery" ? "Let's plan your deck" : "Ready to refine"}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollShadow className="flex-1 p-6 space-y-6 bg-[#09090b]">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm text-zinc-400">Loading your AI co-pilot...</p>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-5 py-3.5 text-[14px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-zinc-100 text-zinc-900 rounded-2xl rounded-tr-sm font-medium"
                      : "bg-[#18181b] border border-white/5 text-zinc-200 rounded-2xl rounded-tl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <div className="bg-[#18181b] border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </ScrollShadow>

          {/* Floating Input area */}
          <div className="p-6 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent">
            <div className="relative flex items-center bg-[#18181b] rounded-2xl border border-white/10 shadow-xl focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500 transition-all p-1.5">
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
                    ? "Tell the AI about your presentation goals..."
                    : phase === "planning"
                    ? 'Refine your plan — "Add a ROI slide" or "Make it shorter"'
                    : "Plan is being generated..."
                }
                disabled={isProcessing || phase === "generating" || phase === "done"}
                className="flex-1"
                classNames={{
                  inputWrapper: "bg-transparent shadow-none hover:bg-transparent border-none !cursor-text group-data-[focus=true]:bg-transparent",
                  input: "text-sm text-white placeholder:text-zinc-500",
                }}
              />
              <Button
                isIconOnly
                radius="full"
                color="primary"
                className="bg-blue-600 text-white shadow-md hover:bg-blue-500 transition-colors w-10 h-10 min-w-10 ml-2"
                onPress={handleChatSend}
                disabled={!chatInput.trim() || isProcessing || phase === "generating" || phase === "done"}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-3 text-center tracking-wide font-medium">
              {phase === "discovery" ? "Chat with AI to plan your presentation. Enter to send." : "AI Copilot is active. Enter to send."}
            </p>
          </div>
        </div>

        {/* RIGHT: Plan cards (Slides Sider - margin, rounded, hidden scrollbar) */}
        <div className="w-1/2 flex flex-col bg-[#121214] rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative">
          
          {phase === "generating" && (
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800 z-10">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}

          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#121214] z-10">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Presentation Plan</h2>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                {planItems.length > 0 
                  ? `${planItems.length} slides • Drag to reorder` 
                  : "Chat with AI to generate your plan"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {phase === "planning" && planItems.length > 0 && (
                <Button
                  color="primary"
                  className="bg-white text-black font-semibold shadow-md hover:scale-105 transition-transform"
                  startContent={<CheckCircle className="w-4 h-4" />}
                  onPress={handleApprove}
                >
                  Approve & Generate
                </Button>
              )}
              {phase === "generating" && (
                <div className="flex items-center gap-2 text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-full border border-white/5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-xs font-medium">Generated {completedCount}/{planItems.length}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 [&::-webkit-scrollbar]:hidden">
            {planItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-5 shadow-inner">
                  <Sparkles className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-base font-medium text-zinc-300">Your plan will appear here</p>
                <p className="text-sm mt-2 text-center max-w-xs">Chat with the AI on the left to discuss your goals. Once you're aligned, it will generate a structured slide plan.</p>
              </div>
            ) : (
              <div className="space-y-4 pb-10">
                {planItems.map((item, idx) => {
                  const isDragging = draggedItemIndex === idx;
                  const status = slideStatus[idx];
                  const isGeneratingThis = status === "generating";
                  const isDoneThis = status === "done";
                  const isFailedThis = status === "failed";
                  
                  return (
                    <div
                      key={item.id}
                      draggable={isEditable}
                      onDragStart={() => setDraggedItemIndex(idx)}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                      onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}
                      className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                        isDragging ? "opacity-40 scale-[0.98] border-dashed border-zinc-500" :
                        isGeneratingThis ? "border-blue-500/50 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)] scale-[1.02]" :
                        isDoneThis ? "border-emerald-500/30 bg-emerald-500/5" :
                        isFailedThis ? "border-red-500/30 bg-red-500/5" :
                        "border-white/5 bg-[#18181b] hover:border-white/10 hover:shadow-lg"
                      }`}
                    >
                      {/* Drag Handle & Number */}
                      <div className="flex flex-col items-center gap-2 mt-1">
                        {isEditable && (
                          <div className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-300 transition-colors">
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          isGeneratingThis ? "bg-blue-500 text-white" :
                          isDoneThis ? "bg-emerald-500 text-white" :
                          isFailedThis ? "bg-red-500 text-white" :
                          "bg-zinc-800 text-zinc-400"
                        }`}>
                          {isGeneratingThis ? <Loader2 className="w-3 h-3 animate-spin" /> :
                           isDoneThis ? <CheckCircle className="w-3.5 h-3.5" /> :
                           idx + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${LAYOUT_COLORS[item.layout] || "bg-zinc-900 text-zinc-400 border-zinc-800"}`}>
                            {LAYOUT_LABELS[item.layout] || item.layout}
                          </span>
                          {isEditable && (
                            <Dropdown classNames={{ content: "bg-zinc-900 border border-white/10 min-w-[150px] rounded-xl" }}>
                              <DropdownTrigger>
                                <Button size="sm" variant="light" className="h-6 text-[10px] font-medium text-zinc-400 hover:text-white px-2 min-w-0">
                                  Change Layout
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu 
                                aria-label="Select layout"
                                itemClasses={{ base: "text-zinc-300 data-[hover=true]:bg-zinc-800 data-[hover=true]:text-white rounded-lg py-2" }}
                                onAction={(key) => updateItem(item.id, "layout", key as string)}
                              >
                                {Object.entries(LAYOUT_LABELS).map(([val, label]) => (
                                  <DropdownItem key={val}>{label}</DropdownItem>
                                ))}
                              </DropdownMenu>
                            </Dropdown>
                          )}
                        </div>

                        {isEditable ? (
                          <div className="space-y-2">
                            <Input 
                              variant="underlined"
                              value={item.title}
                              onChange={(e) => updateItem(item.id, "title", e.target.value)}
                              classNames={{
                                input: "text-base font-bold text-white tracking-tight",
                                inputWrapper: "px-0 border-zinc-700 data-[hover=true]:border-zinc-500"
                              }}
                              placeholder="Slide Title"
                            />
                            <Input 
                              variant="underlined"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, "description", e.target.value)}
                              classNames={{
                                input: "text-sm text-zinc-400 font-medium",
                                inputWrapper: "px-0 border-zinc-800 data-[hover=true]:border-zinc-600"
                              }}
                              placeholder="Slide Description"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-base font-bold text-white tracking-tight">{item.title}</p>
                            <p className="text-sm text-zinc-400 font-medium">{item.description}</p>
                          </div>
                        )}
                      </div>

                      {/* Delete */}
                      {isEditable && planItems.length > 2 && (
                        <Button 
                          isIconOnly 
                          variant="light" 
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                          onPress={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}

                {/* Add Slide Button */}
                {isEditable && (
                  <Button
                    variant="bordered"
                    className="w-full h-14 border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-white/5 rounded-2xl font-medium transition-all group"
                    startContent={<Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    onPress={addItem}
                  >
                    Add Custom Slide
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
