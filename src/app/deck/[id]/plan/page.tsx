"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

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
    "researching" | "planning" | "generating" | "done"
  >("researching");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState(-1);
  const [hasStartedResearch, setHasStartedResearch] = useState(false);
  const [generationMode, setGenerationMode] =
    useState<GenerationMode>("custom");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const deck = useQuery(api.decks.getById, id ? { id: id as any } : "skip");
  const runUpdatePlan = useMutation(api.decks.updatePlan);
  const runReplaceAllSlides = useMutation(api.slides.replaceAllSlides);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isProcessing]);

  // Auto-start research when deck loads
  useEffect(() => {
    if (!deck || hasStartedResearch) return;
    setHasStartedResearch(true);

    setGenerationMode(
      (deck as any).generationMode === "template" ? "template" : "custom",
    );

    if (deck.planItems) {
      try {
        const saved = JSON.parse(deck.planItems as string);
        if (Array.isArray(saved) && saved.length > 0) {
          setPlanItems(saved);
          setPhase("planning");
          addMsg(
            "assistant",
            "I've loaded your saved plan. You can edit any slide, chat to refine, or approve when ready.",
          );
          return;
        }
      } catch {}
    }
    startResearch();
  }, [deck]);

  const addMsg = (role: "user" | "assistant", content: string) => {
    setChatMessages((prev) => [...prev, { role, content }]);
  };

  const startResearch = async () => {
    setIsProcessing(true);
    addMsg(
      "assistant",
      `Researching "${(deck as any)?.title || "your topic"}" and building a tailored presentation plan...`,
    );

    try {
      const res = await fetch("/api/research-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: (deck as any)?.title || "",
          tone: (deck as any)?.tone || "professional",
          audience: (deck as any)?.audience || "general audience",
          slidesCount: 8,
          deckId: id,
        }),
      });

      const data = await res.json();
      if (data.message) addMsg("assistant", data.message);
      if (Array.isArray(data.plan) && data.plan.length > 0) {
        setPlanItems(data.plan);
        await runUpdatePlan({
          id: id as any,
          planItems: JSON.stringify(data.plan),
          planStatus: "planning",
          generationMode,
        });
      }
      setPhase("planning");
    } catch {
      addMsg(
        "assistant",
        "Research encountered an issue. Using a default structure — you can edit it freely.",
      );
      setPhase("planning");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChatSend = async () => {
    const msg = chatInput.trim();
    if (!msg || isProcessing) return;
    setChatInput("");
    addMsg("user", msg);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/research-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: (deck as any)?.title || "",
          tone: (deck as any)?.tone || "professional",
          audience: (deck as any)?.audience || "general",
          slidesCount: planItems.length || 8,
          deckId: id,
          chatHistory: [...chatMessages, { role: "user", content: msg }],
          currentPlan: planItems,
        }),
      });

      const data = await res.json();
      if (data.message) addMsg("assistant", data.message);
      if (Array.isArray(data.plan) && data.plan.length > 0) {
        setPlanItems(data.plan);
        await runUpdatePlan({
          id: id as any,
          planItems: JSON.stringify(data.plan),
          planStatus: "planning",
          generationMode,
        });
      }
    } catch {
      addMsg("assistant", "Couldn't process that request. Please try again.");
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleApprove = async () => {
    if (planItems.length === 0 || phase !== "planning") return;
    setPhase("generating");
    addMsg(
      "assistant",
      `Plan approved! Generating ${planItems.length} slides in ${generationMode === "template" ? "Thesys template" : "custom"} mode...`,
    );

    await runUpdatePlan({
      id: id as any,
      planItems: JSON.stringify(planItems),
      planStatus: "generating",
      generationMode,
    });

    const generatedSlides: any[] = [];

    for (let i = 0; i < planItems.length; i++) {
      setGeneratingIndex(i);
      try {
        const endpoint =
          generationMode === "template"
            ? "/api/generate-c1-single-slide"
            : "/api/generate-single-slide";
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
        generatedSlides.push({
          title: slideData.title || planItems[i].title,
          layout: slideData.layout || planItems[i].layout,
          bullets: Array.isArray(slideData.bullets)
            ? slideData.bullets
            : [planItems[i].description],
          speakerNotes: slideData.speakerNotes || "",
          c1Dsl: slideData.c1Dsl || undefined,
        });
      } catch {
        generatedSlides.push({
          title: planItems[i].title,
          layout: planItems[i].layout,
          bullets: [planItems[i].description],
          speakerNotes: "",
        });
      }
    }

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

  const moveItem = (itemId: string, dir: "up" | "down") => {
    setPlanItems((prev) => {
      const idx = prev.findIndex((i) => i.id === itemId);
      const target = dir === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((item, i) => ({ ...item, order: i }));
    });
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
    planItems.length > 0 && generatingIndex >= 0
      ? Math.round(((generatingIndex + 1) / planItems.length) * 100)
      : 0;

  return (
    <div className="h-screen bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b border-zinc-800 flex items-center px-4 gap-3 bg-zinc-950/60 backdrop-blur-md flex-shrink-0">
        <Link
          href="/dashboard"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <span className="material-symbols-outlined text-zinc-100 text-[14px]">
              auto_awesome
            </span>
          </div>
          <div>
            <h1 className="text-sm text-zinc-100 font-semibold leading-none">
              {(deck as any)?.title || "Planning..."}
            </h1>
            <p className="text-[11px] text-zinc-400 leading-none mt-1">
              AI Research &amp; Plan
            </p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Progress during generation */}
        {phase === "generating" && (
          <div className="flex items-center gap-3">
            <div className="w-40 bg-zinc-900 rounded-full h-1.5 border border-zinc-800">
              <div
                className="bg-white h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400 whitespace-nowrap">
              {generatingIndex + 1} / {planItems.length} slides
            </span>
          </div>
        )}

        {/* Approve button */}
        {phase === "planning" && planItems.length > 0 && (
          <button
            onClick={handleApprove}
            className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">
              check_circle
            </span>
            Approve &amp; Generate
          </button>
        )}

        {phase === "done" && (
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="material-symbols-outlined text-[18px]">
              check_circle
            </span>
            <span className="text-xs">
              Done! Redirecting...
            </span>
          </div>
        )}
      </header>

      {/* Two-panel body */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Chat panel */}
        <div className="w-[480px] flex-shrink-0 border-r border-zinc-800 flex flex-col bg-[#09090b]">
          {/* Agent header */}
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-100 text-[16px]">
                  smart_toy
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-100 font-semibold">
                  Research Agent
                </p>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${isProcessing ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`}
                  />
                  <p className="text-[11px] text-zinc-400">
                    {isProcessing ? "Thinking..." : "Ready"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin mb-2" />
                <p className="text-xs">
                  Starting research...
                </p>
              </div>
            )}

            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="material-symbols-outlined text-zinc-100 text-[12px]">
                      auto_awesome
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-white text-black rounded-2xl rounded-tr-sm font-medium"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm"
                  }`}
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isProcessing && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-zinc-100 text-[12px]">
                    auto_awesome
                  </span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-zinc-800">
            <div className="flex gap-2 bg-zinc-900 rounded-xl border border-zinc-800 px-3 py-2">
              <textarea
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
                  phase === "planning"
                    ? 'Try: "Add a ROI slide" or "Make it 6 slides"'
                    : "Plan is being generated..."
                }
                disabled={
                  isProcessing || phase === "generating" || phase === "done"
                }
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-zinc-100 placeholder:text-zinc-500 resize-none min-h-[28px] max-h-[80px] self-center"
              />
              <button
                onClick={handleChatSend}
                disabled={
                  !chatInput.trim() ||
                  isProcessing ||
                  phase === "generating" ||
                  phase === "done"
                }
                className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 flex-shrink-0 self-end"
              >
                <span className="material-symbols-outlined text-black text-[16px]">
                  send
                </span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1.5 text-center">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </div>

        {/* RIGHT: Plan cards */}
        <div className="flex-1 overflow-y-auto bg-[#09090b]">
          <div className="max-w-2xl mx-auto px-6 py-6">
            {planItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px] opacity-40 animate-pulse">
                    article
                  </span>
                </div>
                <p className="text-sm font-medium">
                  Plan is being researched...
                </p>
                <p className="text-xs opacity-60 mt-1">
                  This usually takes a few seconds
                </p>
              </div>
            ) : (
              <>
                {/* Plan header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl text-zinc-100 font-bold tracking-tight">
                      Presentation Plan
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {planItems.length} slides
                      {isEditable && " · Click any field to edit"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {phase === "generating" && generatingIndex >= 0 && (
                      <div className="flex items-center gap-2 text-zinc-400">
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">
                          Generating...
                        </span>
                      </div>
                    )}
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setGenerationMode("custom")}
                        disabled={!isEditable}
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          generationMode === "custom"
                            ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                            : "text-zinc-400 hover:text-zinc-200"
                        } disabled:opacity-60`}
                      >
                        Custom
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenerationMode("template")}
                        disabled={!isEditable}
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          generationMode === "template"
                            ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50"
                            : "text-zinc-400 hover:text-zinc-200"
                        } disabled:opacity-60`}
                      >
                        Template
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plan items */}
                <div className="space-y-2.5">
                  {planItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`group relative rounded-xl border p-4 transition-all duration-200 ${
                        generatingIndex === idx
                          ? "border-white bg-zinc-900/50 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                          : "border-zinc-800 bg-[#18181b] hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Slide number */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-sm border ${
                            generatingIndex === idx
                              ? "bg-white text-black border-white"
                              : "bg-zinc-900 text-zinc-400 border-zinc-800"
                          }`}
                        >
                          {generatingIndex === idx ? (
                            <span className="material-symbols-outlined text-[14px]">
                              autorenew
                            </span>
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Type badge + layout selector */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${LAYOUT_COLORS[item.layout] || "bg-zinc-900 text-zinc-400 border-zinc-800"}`}
                            >
                              {LAYOUT_LABELS[item.layout] || item.layout}
                            </span>
                            {isEditable && (
                              <select
                                value={item.layout}
                                onChange={(e) =>
                                  updateItem(item.id, "layout", e.target.value)
                                }
                                className="text-[11px] bg-zinc-900 border border-zinc-800/80 rounded-md px-2 py-0.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700 cursor-pointer"
                              >
                                {Object.entries(LAYOUT_LABELS).map(
                                  ([val, label]) => (
                                    <option key={val} value={val}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            )}
                          </div>

                          {/* Title */}
                          {isEditable ? (
                            <input
                              value={item.title}
                              onChange={(e) =>
                                updateItem(item.id, "title", e.target.value)
                              }
                              className="w-full bg-transparent border-none outline-none text-sm text-zinc-100 font-semibold focus:ring-1 focus:ring-zinc-700 rounded px-1 py-0.5 -ml-1 transition-all"
                              placeholder="Slide title..."
                            />
                          ) : (
                            <p className="text-sm text-zinc-100 font-semibold px-1">
                              {item.title}
                            </p>
                          )}

                          {/* Description */}
                          {isEditable ? (
                            <input
                              value={item.description}
                              onChange={(e) =>
                                updateItem(
                                  item.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-transparent border-none outline-none text-xs text-zinc-400 focus:ring-1 focus:ring-zinc-800 rounded px-1 py-0.5 -ml-1"
                              placeholder="What should this slide cover?"
                            />
                          ) : (
                            <p className="text-xs text-zinc-400 px-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {isEditable && (
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => moveItem(item.id, "up")}
                              disabled={idx === 0}
                              className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                arrow_upward
                              </span>
                            </button>
                            <button
                              onClick={() => moveItem(item.id, "down")}
                              disabled={idx === planItems.length - 1}
                              className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-zinc-100 disabled:opacity-20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                arrow_downward
                              </span>
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              disabled={planItems.length <= 2}
                              className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-red-400 disabled:opacity-20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                delete
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add slide button */}
                  {isEditable && (
                    <button
                      onClick={addItem}
                      className="w-full py-3 border border-dashed border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all flex items-center justify-center gap-2 text-xs font-medium"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                      Add Slide
                    </button>
                  )}
                </div>

                {/* Bottom approve CTA */}
                {isEditable && planItems.length > 0 && (
                  <div className="mt-8 p-4 bg-[#18181b] border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-100 font-semibold">
                        Ready to generate?
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {generationMode === "template"
                          ? "Each slide becomes a separate Thesys artifact"
                          : "Each slide will be crafted by your custom renderer"}
                      </p>
                    </div>
                    <button
                      onClick={handleApprove}
                      className="bg-white text-black hover:bg-zinc-200 px-5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        rocket_launch
                      </span>
                      Generate Slides
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
