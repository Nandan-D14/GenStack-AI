"use client";

import {
  Button,
  Divider,
  Textarea,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge,
  Switch,
  Tooltip,
} from "@heroui/react";
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  Type,
  Send,
  Loader2,
  Play,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Edit3,
  LayoutGrid,
  FileDown,
  Eye,
  CheckCircle,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  Maximize,
  GripVertical,
  FileText,
} from "lucide-react";
import { C1Component } from "@thesysai/genui-sdk";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function EditorPage() {
  const { id } = useParams();
  const router = useRouter();

  // Selected slide index
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);

  // UI state toggles
  const [isEditMode, setIsEditMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // AI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState("");
  const [aiEditPrompt, setAiEditPrompt] = useState("");
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generateStarted, setGenerateStarted] = useState(false);

  // Canvas chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [canvasChatMessages, setCanvasChatMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [canvasChatInput, setCanvasChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const canvasChatEndRef = useRef<HTMLDivElement>(null);
  const canvasChatInputRef = useRef<HTMLTextAreaElement>(null);

  // Export states
  const [isExporting, setIsExporting] = useState(false);

  // Custom states for in-slide editing & right-click
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideIndex: number } | null>(null);

  // Close context menu on window click
  useEffect(() => {
    const handleCloseContextMenu = () => setContextMenu(null);
    window.addEventListener("click", handleCloseContextMenu);
    return () => window.removeEventListener("click", handleCloseContextMenu);
  }, []);

  // Convex Queries and Mutations
  const deck = useQuery(api.decks.getById, id ? { id: id as any } : "skip");
  const slides = deck?.slides || [];
  const activeSlide = slides[selectedSlideIndex];

  const runReplaceAllSlides = useMutation(api.slides.replaceAllSlides);
  const runCreateSlide = useMutation(api.slides.createSlide);
  const runUpdateSlideContent = useMutation(api.slides.updateSlideContent);
  const runDeleteSlide = useMutation(api.slides.deleteSlide);
  const runDuplicateSlide = useMutation(api.slides.duplicateSlide);
  const runUpdateSlideOrders = useMutation(api.slides.updateSlideOrders);
  const runUpdateC1Data = useMutation(api.decks.updateC1Data);
  const runUpdateChatHistory = useMutation(api.decks.updateEditorChatHistory);

  // Convex action for PPTX generation
  const runGeneratePptx = useAction(api.export.generatePptx);

  // Load chat history from deck
  const [hasLoadedChat, setHasLoadedChat] = useState(false);
  useEffect(() => {
    if (!deck || hasLoadedChat) return;
    const editorChat = (deck as any).editorChatHistory;
    if (editorChat) {
      try {
        const savedChat = JSON.parse(editorChat);
        if (Array.isArray(savedChat)) {
          setCanvasChatMessages(savedChat);
        }
      } catch (err) {
        console.error("Failed to parse chat history:", err);
      }
    }
    setHasLoadedChat(true);
  }, [deck, hasLoadedChat]);

  // Ensure selected slide is within bounds
  useEffect(() => {
    if (slides.length > 0 && selectedSlideIndex >= slides.length) {
      setSelectedSlideIndex(slides.length - 1);
    }
  }, [slides, selectedSlideIndex]);

  // Canvas View State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Drag and drop state
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(
    null,
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).id === "canvas-bg") {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsPanning(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan((p) => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleZoomIn = () => setZoom((z) => Math.min(3, z + 0.1));
  const handleZoomOut = () => setZoom((z) => Math.max(0.1, z - 0.1));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleSlideDrop = async (dropIdx: number) => {
    if (draggedSlideIndex === null || draggedSlideIndex === dropIdx) return;
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedSlideIndex, 1);
    newSlides.splice(dropIdx, 0, removed);

    // Optimistically update if you want, but Convex will push updates
    const updates = newSlides.map((s, idx) => ({ id: s._id, order: idx }));
    await runUpdateSlideOrders({ slides: updates });
    if (selectedSlideIndex === draggedSlideIndex) {
      setSelectedSlideIndex(dropIdx);
    } else if (
      selectedSlideIndex > draggedSlideIndex &&
      selectedSlideIndex <= dropIdx
    ) {
      setSelectedSlideIndex(selectedSlideIndex - 1);
    } else if (
      selectedSlideIndex < draggedSlideIndex &&
      selectedSlideIndex >= dropIdx
    ) {
      setSelectedSlideIndex(selectedSlideIndex + 1);
    }
    setDraggedSlideIndex(null);
  };

  // ─────────────────────────────────────────────
  // BACKWARD COMPATIBILITY: Migrate c1Response to slides table
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (deck && slides.length === 0 && deck.c1Response) {
      try {
        let rawResponse = deck.c1Response.trim();
        const firstBracket = rawResponse.indexOf("[");
        const lastBracket = rawResponse.lastIndexOf("]");
        if (
          firstBracket !== -1 &&
          lastBracket !== -1 &&
          lastBracket > firstBracket
        ) {
          rawResponse = rawResponse.substring(firstBracket, lastBracket + 1);
        }
        const parsed = JSON.parse(rawResponse);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("Migrating c1Response to individual slides...");
          runReplaceAllSlides({
            deckId: id as any,
            slides: parsed.map((s: any) => ({
              title: s.title || "",
              layout: s.layout || "content",
              bullets: Array.isArray(s.bullets) ? s.bullets : [],
              speakerNotes: s.speakerNotes || "",
            })),
          });
        }
      } catch (e) {
        console.error("Migration failed to parse c1Response:", e);
      }
    }
  }, [deck, slides, id, runReplaceAllSlides]);

  // Auto-generate on ?generate=true
  useEffect(() => {
    if (typeof window !== "undefined" && deck) {
      const searchParams = new URLSearchParams(window.location.search);
      const shouldGenerate = searchParams.get("generate") === "true";
      if (
        shouldGenerate &&
        slides.length === 0 &&
        !deck.c1Response &&
        !generateStarted &&
        !isGenerating
      ) {
        setGenerateStarted(true);
        // Clean URL query params
        window.history.replaceState({}, "", `/deck/${id}/editor`);
        triggerAiGeneration(deck.title);
      }
    }
  }, [deck, slides, generateStarted, isGenerating]);

  // Fullscreen keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === "Escape") {
          setIsFullscreen(false);
        } else if (e.key === "ArrowRight" || e.key === "Space") {
          if (selectedSlideIndex < slides.length - 1) {
            setSelectedSlideIndex((prev) => prev + 1);
          }
        } else if (e.key === "ArrowLeft") {
          if (selectedSlideIndex > 0) {
            setSelectedSlideIndex((prev) => prev - 1);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, selectedSlideIndex, slides.length]);

  // ─────────────────────────────────────────────
  // AI ACTIONS
  // ─────────────────────────────────────────────
  const triggerAiGeneration = async (prompt: string) => {
    if (!id) return;
    setIsGenerating(true);
    setGenerateStatus("Generating presentation with AI...");

    try {
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          deckId: id,
          tone: (deck as any)?.tone || "professional",
          audience: (deck as any)?.audience || "general",
          slidesCount: (deck as any)?.slidesCount || 7,
          skill: (deck as any)?.designSkill || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Generation failed (${response.status})`,
        );
      }

      const data = await response.json();
      const generatedSlides = data.slides;

      if (!Array.isArray(generatedSlides) || generatedSlides.length === 0) {
        throw new Error("AI returned invalid or empty slides array");
      }

      setGenerateStatus("Saving presentation...");
      // Save directly to slides table
      await runReplaceAllSlides({
        deckId: id as any,
        slides: generatedSlides,
      });

      // Keep stringified copy in c1Response as backup
      await runUpdateC1Data({
        id: id as any,
        c1Response: JSON.stringify(generatedSlides),
      });

      setGenerateStatus("Done!");
      setSelectedSlideIndex(0);
    } catch (error: any) {
      console.error("AI generation error:", error);
      alert(`AI Generation Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerateStatus(""), 2000);
    }
  };

  const triggerAiEdit = async (editPrompt: string) => {
    if (!id || slides.length === 0) return;
    setIsAiEditing(true);

    try {
      const sanitizedSlides = slides.map((s: any) => {
        let bullets: string[] = [];
        try {
          bullets = JSON.parse(s.content || "[]");
        } catch {
          bullets = [];
        }
        return {
          title: s.title || "",
          layout: s.layout || "content",
          bullets,
          speakerNotes: s.speakerNotes || "",
        };
      });

      const response = await fetch("/api/edit-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slides: sanitizedSlides,
          prompt: editPrompt,
          deckId: id,
          skill: (deck as any)?.designSkill || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Edit failed (${response.status})`);
      }

      const data = await response.json();
      const updatedSlides = data.slides;

      if (!Array.isArray(updatedSlides) || updatedSlides.length === 0) {
        throw new Error("AI returned invalid or empty slides array");
      }

      await runReplaceAllSlides({
        deckId: id as any,
        slides: updatedSlides,
      });

      await runUpdateC1Data({
        id: id as any,
        c1Response: JSON.stringify(updatedSlides),
      });

      setAiEditPrompt("");
    } catch (error: any) {
      console.error("AI edit error:", error);
      alert(`AI Edit Error: ${error.message}`);
    } finally {
      setIsAiEditing(false);
    }
  };

  const handleAiEditSubmit = () => {
    if (!aiEditPrompt.trim() || isAiEditing) return;
    triggerAiEdit(aiEditPrompt.trim());
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await triggerAiEdit(
        "Regenerate the presentation with fresh, improved content. Keep the same topic but make the content more compelling and detailed.",
      );
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  };

  const handleToneChange = async (selectedTone: string) => {
    setRegenerating(true);
    try {
      await triggerAiEdit(
        `Change the tone of the presentation to be more ${selectedTone}. Adjust the wording accordingly.`,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  };

  const handleLengthChange = async (selectedLength: string) => {
    setRegenerating(true);
    try {
      const instruction =
        selectedLength === "expand"
          ? "Expand the presentation slides with more detail and additional points."
          : "Shorten the presentation slides to be more concise, keeping only the most important points.";
      await triggerAiEdit(instruction);
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  };

  // ─────────────────────────────────────────────
  // SLIDE MANUAL OPERATIONS
  // ─────────────────────────────────────────────
  const handleUpdateSlideTitle = async (newTitle: string) => {
    if (!activeSlide) return;
    await runUpdateSlideContent({
      id: activeSlide._id,
      title: newTitle,
    });
  };

  const handleUpdateSlideLayout = async (newLayout: string) => {
    if (!activeSlide) return;
    await runUpdateSlideContent({
      id: activeSlide._id,
      layout: newLayout,
    });
  };

  const handleUpdateSlideBullets = async (newBullets: string[]) => {
    if (!activeSlide) return;
    await runUpdateSlideContent({
      id: activeSlide._id,
      content: JSON.stringify(newBullets),
    });
  };

  const handleUpdateSlideSpeakerNotes = async (newNotes: string) => {
    if (!activeSlide) return;
    await runUpdateSlideContent({
      id: activeSlide._id,
      speakerNotes: newNotes,
    });
  };

  const handleAddSlide = async () => {
    if (!id) return;
    const nextOrder =
      slides.length > 0 ? slides[slides.length - 1].order + 1 : 0;
    await runCreateSlide({
      deckId: id as any,
      title: "New Slide Title",
      layout: "content",
      order: nextOrder,
    });
    setSelectedSlideIndex(slides.length);
  };

  const handleDuplicateSlide = async () => {
    if (!activeSlide) return;
    await runDuplicateSlide({ id: activeSlide._id });
    setSelectedSlideIndex((prev) => prev + 1);
  };

  const handleDeleteSlide = async () => {
    if (!activeSlide || slides.length <= 1) return;
    const prevIndex = selectedSlideIndex;
    await runDeleteSlide({ id: activeSlide._id });
    if (prevIndex >= slides.length - 1) {
      setSelectedSlideIndex(slides.length - 2);
    }
  };

  const handleMoveSlide = async (direction: "up" | "down") => {
    if (!activeSlide || slides.length <= 1) return;
    const currentIndex = selectedSlideIndex;
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= slides.length) return;

    // Swap orders
    const currentSlide = slides[currentIndex];
    const targetSlide = slides[targetIndex];

    const tempOrder = currentSlide.order;
    await runUpdateSlideOrders({
      slides: [
        { id: currentSlide._id, order: targetSlide.order },
        { id: targetSlide._id, order: tempOrder },
      ],
    });

    setSelectedSlideIndex(targetIndex);
  };

  // ─────────────────────────────────────────────
  // PPTX EXPORT HANDLER
  // ─────────────────────────────────────────────
  const handlePptxExport = async () => {
    if (!id) return;
    setIsExporting(true);
    try {
      const result = await runGeneratePptx({ deckId: id as any });
      if (result && result.downloadUrl) {
        const a = document.createElement("a");
        a.href = result.downloadUrl;
        a.download = result.fileName || `${deck?.title || "presentation"}.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        throw new Error("No download URL returned");
      }
    } catch (error: any) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // ─────────────────────────────────────────────
  // CANVAS CHATBOT
  // ─────────────────────────────────────────────
  useEffect(() => {
    canvasChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [canvasChatMessages]);

  const handleCanvasChat = async () => {
    const msg = canvasChatInput.trim();
    if (!msg || isChatLoading) return;
    setCanvasChatInput("");
    
    const nextMessages = [...canvasChatMessages, { role: "user" as const, content: msg }];
    setCanvasChatMessages(nextMessages);
    runUpdateChatHistory({ id: id as any, editorChatHistory: JSON.stringify(nextMessages) }).catch(console.error);
    
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          currentSlide: activeSlide
            ? {
                title: activeSlide.title,
                layout: activeSlide.layout,
                content: activeSlide.content,
                speakerNotes: activeSlide.speakerNotes || "",
              }
            : null,
          allSlides: slides.map((s: any) => ({
            title: s.title,
            layout: s.layout,
          })),
          deckTitle: deck?.title || "",
          history: nextMessages.slice(-6),
          skill: (deck as any)?.designSkill || null,
        }),
      });

      const data = await res.json();
      const reply =
        data.reply ||
        "I can help with that. What specifically would you like to change?";
      
      const finalMessages = [
        ...nextMessages,
        { role: "assistant" as const, content: reply },
      ];
      setCanvasChatMessages(finalMessages);
      runUpdateChatHistory({ id: id as any, editorChatHistory: JSON.stringify(finalMessages) }).catch(console.error);

      // Apply slide update if returned
      if (data.slideUpdate && activeSlide) {
        const update: any = {};
        if (data.slideUpdate.title) update.title = data.slideUpdate.title;
        if (Array.isArray(data.slideUpdate.bullets))
          update.content = JSON.stringify(data.slideUpdate.bullets);
        if (data.slideUpdate.speakerNotes)
          update.speakerNotes = data.slideUpdate.speakerNotes;
        if (data.slideUpdate.layout)
          update.layout = data.slideUpdate.layout;
        if (Object.keys(update).length > 0) {
          await runUpdateSlideContent({ id: activeSlide._id, ...update });
        }
      }
    } catch {
      const finalMessages = [
        ...nextMessages,
        {
          role: "assistant" as const,
          content: "Sorry, couldn't process that. Try again.",
        },
      ];
      setCanvasChatMessages(finalMessages);
      runUpdateChatHistory({ id: id as any, editorChatHistory: JSON.stringify(finalMessages) }).catch(console.error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSuggestedPrompt = (promptText: string) => {
    setCanvasChatInput(promptText);
    setTimeout(() => {
      canvasChatInputRef.current?.focus();
    }, 50);
  };

  // Helper to parse slide bullets safely
  const getActiveBullets = (slide: any): string[] => {
    if (!slide) return [];
    try {
      const parsed = JSON.parse(slide.content || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Keyboard helper for in-slide bullet list navigation/editing
  const handleBulletKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    idx: number,
    bullets: string[],
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newBullets = [...bullets];
      newBullets.splice(idx + 1, 0, "");
      handleUpdateSlideBullets(newBullets);
      setTimeout(() => {
        const nextEl = document.querySelector(`[data-bullet-idx="${idx + 1}"]`) as HTMLElement;
        if (nextEl) {
          nextEl.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(nextEl);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 80);
    } else if (e.key === "Backspace" && e.currentTarget.innerText.trim() === "") {
      e.preventDefault();
      const newBullets = bullets.filter((_, i) => i !== idx);
      handleUpdateSlideBullets(newBullets);
      setTimeout(() => {
        const prevEl = document.querySelector(`[data-bullet-idx="${idx - 1}"]`) as HTMLElement;
        if (prevEl) {
          prevEl.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(prevEl);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        } else {
          const titleEl = document.querySelector(`[data-slide-title="true"]`) as HTMLElement;
          titleEl?.focus();
        }
      }, 80);
    }
  };

  const renderCanvasSlide = (
    slide: any,
    bullets: string[],
    isInteractive: boolean,
  ) => {
    if (slide?.c1Dsl) {
      return (
        <div className="w-full h-full bg-[#0F1011] text-white overflow-hidden [&_*]:max-w-full">
          <C1Component c1Response={slide.c1Dsl} isStreaming={false} />
        </div>
      );
    }

    return renderSlideContent(slide, bullets, isInteractive);
  };

  // ─────────────────────────────────────────────
  // RENDER THUMBNAIL LAYOUT MINI-PREVIEW
  // ─────────────────────────────────────────────
  const renderThumbnailPreview = (slide: any) => {
    if (slide?.c1Dsl) {
      return (
        <div className="w-full h-full bg-[#151617] flex flex-col justify-center items-center p-2 text-center select-none rounded border border-white/[0.04]">
          <div className="px-2 py-1 rounded-full bg-[#7170FF]/20 border border-[#7170FF]/30 text-[#A9A8FF] text-[10px] font-semibold mb-2">
            C1
          </div>
          <div className="w-4/5 h-1.5 bg-white/30 rounded mb-1" />
          <div className="w-3/5 h-1 bg-white/15 rounded" />
        </div>
      );
    }

    switch (slide.layout) {
      case "title":
        return (
          <div className="w-full h-full bg-[#151617] flex flex-col justify-center items-center p-2 text-center select-none rounded border border-white/[0.04]">
            <div className="w-4/5 h-2 bg-white/40 rounded mb-1" />
            <div className="w-3/5 h-1 bg-white/20 rounded" />
          </div>
        );
      case "closing":
        return (
          <div className="w-full h-full bg-[#151617] flex flex-col justify-center items-center p-2 text-center select-none rounded border border-white/[0.04]">
            <div className="w-3/5 h-2 bg-white/45 rounded mb-2" />
            <div className="flex gap-1 justify-center w-full">
              <div className="w-1/4 h-1 bg-white/20 rounded" />
              <div className="w-1/4 h-1 bg-white/20 rounded" />
              <div className="w-1/4 h-1 bg-white/20 rounded" />
            </div>
          </div>
        );
      case "quote":
        return (
          <div className="w-full h-full bg-[#151617] flex flex-col justify-center items-center p-2 text-center select-none rounded border border-white/[0.04]">
            <div className="w-4/5 h-1 bg-white/10 rounded mb-1" />
            <div className="w-3/4 h-2 bg-white/35 rounded italic mb-1" />
            <div className="w-4/5 h-1 bg-white/10 rounded" />
          </div>
        );
      case "data":
        return (
          <div className="w-full h-full bg-[#151617] flex flex-col justify-between p-2 select-none rounded border border-white/[0.04]">
            <div className="w-1/2 h-1 bg-white/35 rounded" />
            <div className="flex gap-1 my-1 w-full justify-between">
              <div className="w-[30%] h-3 bg-white/15 rounded" />
              <div className="w-[30%] h-3 bg-white/15 rounded" />
              <div className="w-[30%] h-3 bg-white/15 rounded" />
            </div>
          </div>
        );
      case "chart":
        return (
          <div className="w-full h-full bg-[#151617] flex p-2 select-none gap-2 rounded border border-white/[0.04]">
            <div className="flex-1 flex flex-col justify-center gap-1">
              <div className="w-full h-1 bg-white/35 rounded" />
              <div className="w-4/5 h-1 bg-white/15 rounded" />
              <div className="w-3/4 h-1 bg-white/15 rounded" />
            </div>
            <div className="w-1/2 h-full flex items-end gap-1 bg-white/5 p-1 rounded-sm">
              <div className="w-1/3 h-2/5 bg-[#7170FF]/50 rounded-sm" />
              <div className="w-1/3 h-4/5 bg-[#7170FF]/80 rounded-sm" />
              <div className="w-1/3 h-3/5 bg-[#7170FF]/60 rounded-sm" />
            </div>
          </div>
        );
      case "two_column":
        return (
          <div className="w-full h-full bg-[#151617] flex flex-col justify-between p-2 select-none rounded border border-white/[0.04]">
            <div className="w-1/2 h-1 bg-white/35 rounded mb-1" />
            <div className="flex gap-2 flex-1">
              <div className="flex-1 flex flex-col gap-1">
                <div className="w-full h-1 bg-white/15 rounded" />
                <div className="w-4/5 h-1 bg-white/15 rounded" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="w-full h-1 bg-white/15 rounded" />
                <div className="w-4/5 h-1 bg-white/15 rounded" />
              </div>
            </div>
          </div>
        );
      default: // content
        return (
          <div className="w-full h-full bg-[#151617] flex flex-col justify-between p-2 select-none rounded border border-white/[0.04]">
            <div className="w-1/2 h-1.5 bg-white/35 rounded mb-1" />
            <div className="flex-1 flex flex-col gap-1">
              <div className="w-full h-1 bg-white/15 rounded" />
              <div className="w-11/12 h-1 bg-white/15 rounded" />
              <div className="w-4/5 h-1 bg-white/15 rounded" />
            </div>
          </div>
        );
    }
  };

  // ─────────────────────────────────────────────
  // RENDER CANVAS LAYOUTS
  // ─────────────────────────────────────────────
  const renderSlideContent = (
    slide: any,
    bullets: string[],
    isInteractive: boolean,
  ) => {
    if (!slide) return null;

    switch (slide.layout) {
      case "title":
        return (
          <div className="w-full h-full flex flex-col justify-center items-center text-center px-8 relative bg-gradient-to-br from-[#121314] to-[#1E1F22]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(113,112,255,0.06)_0%,transparent_70%)] pointer-events-none" />
            <div className="relative z-10 space-y-6 max-w-3xl">
              <h1
                data-slide-title="true"
                contentEditable={isInteractive && isEditMode}
                suppressContentEditableWarning
                onBlur={(e) =>
                  handleUpdateSlideTitle(e.currentTarget.innerText)
                }
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-1 rounded"
              >
                {slide.title}
              </h1>
              <div className="w-24 h-1 bg-[#7170FF] mx-auto rounded-full" />
              {bullets.length > 0 && (
                <p className="text-default-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                  {bullets.join(" • ")}
                </p>
              )}
            </div>
          </div>
        );

      case "closing":
        return (
          <div className="w-full h-full flex flex-col justify-center items-center text-center px-8 relative bg-gradient-to-br from-[#0F1011] to-[#151618]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(113,112,255,0.08)_0%,transparent_75%)] pointer-events-none" />
            <div className="relative z-10 space-y-8 max-w-3xl">
              <h1
                data-slide-title="true"
                contentEditable={isInteractive && isEditMode}
                suppressContentEditableWarning
                onBlur={(e) =>
                  handleUpdateSlideTitle(e.currentTarget.innerText)
                }
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-1 rounded"
              >
                {slide.title}
              </h1>
              <div className="w-20 h-1 bg-[#7170FF] mx-auto rounded-full" />
              {bullets.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center items-center mt-6">
                  {bullets.map((bullet, idx) => (
                    <span
                      key={idx}
                      data-bullet-idx={idx}
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
                      onKeyDown={(e) => handleBulletKeyDown(e, idx, bullets)}
                      onBlur={(e) => {
                        const newBullets = [...bullets];
                        newBullets[idx] = e.currentTarget.innerText;
                        handleUpdateSlideBullets(newBullets);
                      }}
                      className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-full text-default-300 text-sm md:text-base focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50"
                    >
                      {bullet}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "quote":
        return (
          <div className="w-full h-full flex flex-col justify-center items-center px-16 relative bg-[#121314]">
            <div className="relative z-10 text-center space-y-6 max-w-4xl">
              <span className="text-7xl font-serif text-[#7170FF]/40 select-none block h-6 leading-none -mt-4">
                “
              </span>
              <blockquote
                data-slide-title="true"
                contentEditable={isInteractive && isEditMode}
                suppressContentEditableWarning
                onBlur={(e) =>
                  handleUpdateSlideTitle(e.currentTarget.innerText)
                }
                className="text-xl md:text-2xl lg:text-3xl italic text-white/90 font-serif leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-1 rounded"
              >
                {slide.title}
              </blockquote>
              {bullets.length > 0 && (
                <div className="flex flex-col items-center mt-6">
                  <div className="w-10 h-[1px] bg-white/20 mb-3" />
                  {bullets.map((bullet, idx) => (
                    <cite
                      key={idx}
                      data-bullet-idx={idx}
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
                      onKeyDown={(e) => handleBulletKeyDown(e, idx, bullets)}
                      onBlur={(e) => {
                        const newBullets = [...bullets];
                        newBullets[idx] = e.currentTarget.innerText;
                        handleUpdateSlideBullets(newBullets);
                      }}
                      className="text-default-400 font-medium text-sm md:text-base not-italic focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-0.5 rounded"
                    >
                      {bullet}
                    </cite>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "data":
        return (
          <div className="w-full h-full flex flex-col justify-between px-10 py-8 bg-[#121314]">
            <h2
              data-slide-title="true"
              contentEditable={isInteractive && isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateSlideTitle(e.currentTarget.innerText)}
              className="text-2xl md:text-3xl font-bold text-white tracking-tight border-b border-white/10 pb-4 focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-1 rounded"
            >
              {slide.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-auto pt-4">
              {bullets.map((bullet, idx) => {
                // Parse number: label
                let stat = "Stat";
                let label = bullet;
                const colonIdx = bullet.indexOf(":");
                if (colonIdx !== -1) {
                  stat = bullet.substring(0, colonIdx).trim();
                  label = bullet.substring(colonIdx + 1).trim();
                } else {
                  const words = bullet.split(" ");
                  if (words.length > 1 && /^[0-9$%+-]+/.test(words[0])) {
                    stat = words[0];
                    label = words.slice(1).join(" ");
                  }
                }

                return (
                  <div
                    key={idx}
                    className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl flex flex-col justify-center items-center text-center transition-all duration-300 hover:bg-white/[0.04] hover:border-white/20 shadow-md"
                  >
                    <span
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newBullets = [...bullets];
                        newBullets[idx] =
                          e.currentTarget.innerText +
                          (colonIdx !== -1 ? ": " + label : "");
                        handleUpdateSlideBullets(newBullets);
                      }}
                      className="text-3xl md:text-4xl font-extrabold text-[#7170FF] tracking-tight focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-0.5 rounded"
                    >
                      {stat}
                    </span>
                    <span
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const newBullets = [...bullets];
                        newBullets[idx] =
                          stat +
                          (colonIdx !== -1
                            ? ": " + e.currentTarget.innerText
                            : " " + e.currentTarget.innerText);
                        handleUpdateSlideBullets(newBullets);
                      }}
                      className="text-default-400 text-xs md:text-sm font-medium mt-2 leading-snug focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-0.5 rounded"
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "chart":
        return (
          <div className="w-full h-full flex flex-col justify-between px-10 py-8 bg-[#121314]">
            <h2
              data-slide-title="true"
              contentEditable={isInteractive && isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateSlideTitle(e.currentTarget.innerText)}
              className="text-2xl md:text-3xl font-bold text-white tracking-tight border-b border-white/10 pb-4 focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-1 rounded"
            >
              {slide.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto pt-4 items-center">
              {/* Left side bullets */}
              <div className="space-y-4">
                <ul className="list-disc pl-5 text-default-300 space-y-3 text-sm md:text-base leading-relaxed">
                  {bullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      data-bullet-idx={idx}
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
                      onKeyDown={(e) => handleBulletKeyDown(e, idx, bullets)}
                      onBlur={(e) => {
                        const newBullets = [...bullets];
                        newBullets[idx] = e.currentTarget.innerText;
                        handleUpdateSlideBullets(newBullets);
                      }}
                      className="focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-1 py-0.5 rounded"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              {/* Right side chart mockup */}
              <div className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl flex flex-col justify-center h-48 md:h-56 relative overflow-hidden shadow-inner">
                <div className="flex items-end justify-between h-4/5 gap-3 pt-6 border-b border-white/10 pb-2">
                  <div className="w-full flex items-end justify-around h-full gap-2">
                    <div className="w-1/4 bg-[#7170FF]/40 hover:bg-[#7170FF]/60 transition-all rounded-t-lg h-[40%] flex justify-center items-start pt-1 text-[10px] text-white/50">
                      Q1
                    </div>
                    <div className="w-1/4 bg-[#7170FF]/60 hover:bg-[#7170FF]/80 transition-all rounded-t-lg h-[70%] flex justify-center items-start pt-1 text-[10px] text-white/70">
                      Q2
                    </div>
                    <div className="w-1/4 bg-[#7170FF]/80 hover:bg-[#7170FF]/100 transition-all rounded-t-lg h-[90%] flex justify-center items-start pt-1 text-[10px] text-white font-semibold">
                      Q3
                    </div>
                    <div className="w-1/4 bg-[#7170FF]/50 hover:bg-[#7170FF]/70 transition-all rounded-t-lg h-[55%] flex justify-center items-start pt-1 text-[10px] text-white/50">
                      Q4
                    </div>
                  </div>
                </div>
                <div className="text-center text-xs text-default-400 mt-2 font-medium">
                  Quarterly Growth Metrics
                </div>
              </div>
            </div>
          </div>
        );

      case "two_column":
        const halfLength = Math.ceil(bullets.length / 2);
        const col1 = bullets.slice(0, halfLength);
        const col2 = bullets.slice(halfLength);

        return (
          <div className="w-full h-full flex flex-col justify-between px-10 py-8 bg-[#121314]">
            <h2
              data-slide-title="true"
              contentEditable={isInteractive && isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateSlideTitle(e.currentTarget.innerText)}
              className="text-2xl md:text-3xl font-bold text-white tracking-tight border-b border-white/10 pb-4 focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-1 rounded"
            >
              {slide.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-auto pt-4">
              <div className="space-y-4">
                <ul className="list-disc pl-5 text-default-300 space-y-3 text-sm md:text-base leading-relaxed">
                  {col1.map((bullet, idx) => (
                    <li
                      key={idx}
                      data-bullet-idx={idx}
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
                      onKeyDown={(e) => handleBulletKeyDown(e, idx, bullets)}
                      onBlur={(e) => {
                        const newBullets = [...bullets];
                        newBullets[idx] = e.currentTarget.innerText;
                        handleUpdateSlideBullets(newBullets);
                      }}
                      className="focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-1 py-0.5 rounded"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <ul className="list-disc pl-5 text-default-300 space-y-3 text-sm md:text-base leading-relaxed">
                  {col2.map((bullet, idx) => {
                    const actualIdx = halfLength + idx;
                    return (
                      <li
                        key={idx}
                        data-bullet-idx={actualIdx}
                        contentEditable={isInteractive && isEditMode}
                        suppressContentEditableWarning
                        onKeyDown={(e) => handleBulletKeyDown(e, actualIdx, bullets)}
                        onBlur={(e) => {
                          const newBullets = [...bullets];
                          newBullets[actualIdx] = e.currentTarget.innerText;
                          handleUpdateSlideBullets(newBullets);
                        }}
                        className="focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-1 py-0.5 rounded"
                      >
                        {bullet}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        );

      default: // content
        return (
          <div className="w-full h-full flex flex-col justify-between px-10 py-8 bg-[#121314]">
            <h2
              data-slide-title="true"
              contentEditable={isInteractive && isEditMode}
              suppressContentEditableWarning
              onBlur={(e) => handleUpdateSlideTitle(e.currentTarget.innerText)}
              className="text-2xl md:text-3xl font-bold text-white tracking-tight border-b border-white/10 pb-4 focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-2 py-1 rounded"
            >
              {slide.title}
            </h2>
            <div className="my-auto pt-4">
              {bullets.length > 0 && (
                <ul className="list-decimal pl-6 text-default-300 space-y-4 text-sm md:text-base lg:text-lg leading-relaxed max-w-4xl">
                  {bullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      data-bullet-idx={idx}
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
                      onKeyDown={(e) => handleBulletKeyDown(e, idx, bullets)}
                      onBlur={(e) => {
                        const newBullets = [...bullets];
                        newBullets[idx] = e.currentTarget.innerText;
                        handleUpdateSlideBullets(newBullets);
                      }}
                      className="pl-2 focus:outline-none focus:ring-1 focus:ring-[#7170FF]/50 px-1 py-0.5 rounded"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-zinc-100 font-sans">
      {/* ─────────────────────────────────────────────
          HEADER (Clean SaaS Dark)
          ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 h-14 bg-transparent shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
            onPress={() => router.push("/dashboard")}
          >
            <X className="w-4 h-4" />
          </Button>
          <span className="text-zinc-100 text-[14px] font-medium tracking-wide truncate max-w-md ml-2">
            {deck?.title || "Loading presentation..."}
          </span>
          {isGenerating && (
            <div className="flex items-center gap-2 ml-4 bg-zinc-800 px-3 py-1 rounded-md">
              <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin" />
              <span className="text-[11px] text-zinc-400 font-medium tracking-wide">
                {generateStatus}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Present fullscreen button */}
          <Tooltip
            content="Present Fullscreen"
            delay={500}
            classNames={{ base: "text-[11px] font-medium" }}
          >
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 rounded-md w-8 h-8 min-w-0 transition-colors"
              onPress={() => setIsFullscreen(true)}
              disabled={slides.length === 0}
            >
              <Play className="w-4 h-4 ml-0.5" />
            </Button>
          </Tooltip>

          {/* Export PPTX button */}
          <Tooltip
            content="Export Editable PPTX"
            delay={500}
            classNames={{ base: "text-[11px] font-medium" }}
          >
            <Button
              isIconOnly
              variant="flat"
              size="sm"
              className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 rounded-md w-8 h-8 min-w-0 transition-colors ml-1"
              onPress={handlePptxExport}
              isLoading={isExporting}
              disabled={slides.length === 0}
            >
              {!isExporting && <Download className="w-4 h-4" />}
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          EDITOR BODY
          ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR: Slide thumbnails */}
        <div className="w-[260px] bg-transparent flex flex-col shrink-0 select-none pl-4 pb-4 pt-2">
          <div className="flex-1 flex flex-col bg-[#121214] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-3 flex items-center justify-between shrink-0 bg-[#121214] z-10">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Slides
              </span>
              <Button
                size="sm"
                variant="flat"
                className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 h-7 px-3 font-medium text-[11px] min-w-0 rounded-md transition-colors"
                startContent={<Plus className="w-3.5 h-3.5" />}
                onPress={handleAddSlide}
              >
                Add
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 scrollbar-none">
              {slides.length === 0 ? (
                <div className="text-center py-8 text-[12px] text-zinc-500">
                  No slides
                </div>
              ) : (
                slides.map((slide, idx) => {
                  const isSelected = idx === selectedSlideIndex;
                  const isDragging = idx === draggedSlideIndex;
                  return (
                    <div
                      key={slide._id}
                      className={`flex flex-col items-center group ${isDragging ? "opacity-50 scale-95" : ""} transition-all`}
                      draggable
                      onDragStart={() => setDraggedSlideIndex(idx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleSlideDrop(idx);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          slideIndex: idx,
                        });
                      }}
                    >
                      <div className="w-full flex items-center gap-2 relative group/slide">
                        <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover/slide:opacity-100 transition-opacity absolute -left-2 text-zinc-500 hover:text-zinc-300 z-10 bg-[#121214] rounded shadow-sm py-1">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSlideIndex(idx);
                            setShowAll(false);
                          }}
                          className={`w-full aspect-video rounded-xl overflow-hidden transition-all duration-300 border-[2px] text-left relative ${
                            isSelected
                              ? "border-zinc-300 shadow-sm scale-[1.02]"
                              : "border-[#1e1e21] hover:border-zinc-600 opacity-80 hover:opacity-100 bg-[#09090b]"
                          }`}
                        >
                          {renderThumbnailPreview(slide)}
                        </button>
                      </div>
                      <span
                        className={`text-[16px] mt-3 font-medium transition-colors duration-200 ${
                          isSelected
                            ? "text-white"
                            : "text-zinc-300 group-hover:text-white"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* CENTER AREA: Widescreen slide player canvas */}
        <div className="flex-1 flex flex-col bg-[#09090b] relative overflow-hidden">
          {/* Zoom Toolbar Overlay */}
          {slides.length > 0 && !showAll && (
            <div className="absolute top-6 right-6 z-10 flex items-center bg-zinc-900 border border-zinc-800 rounded-md shadow-sm overflow-hidden p-1 gap-1">
              <Tooltip content="Zoom Out">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  className="text-zinc-400 hover:text-zinc-100 min-w-8 w-8 h-8 rounded-md"
                  onPress={handleZoomOut}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </Tooltip>
              <div className="w-12 text-center text-[12px] font-medium text-zinc-300 select-none">
                {Math.round(zoom * 100)}%
              </div>
              <Tooltip content="Zoom In">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  className="text-zinc-400 hover:text-zinc-100 min-w-8 w-8 h-8 rounded-md"
                  onPress={handleZoomIn}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Divider
                orientation="vertical"
                className="h-4 bg-zinc-800 mx-1"
              />
              <Tooltip content="Reset Zoom">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  className="text-zinc-400 hover:text-zinc-100 min-w-8 w-8 h-8 rounded-md"
                  onPress={handleResetZoom}
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          )}

          <div
            id="canvas-bg"
            className={`flex-1 flex items-center justify-center p-8 overflow-hidden ${isPanning ? "cursor-grabbing" : slides.length > 0 && !showAll ? "cursor-grab" : ""}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {isGenerating ? (
              <div className="text-center py-12 pointer-events-none">
                <Loader2 className="w-8 h-8 text-zinc-400 mx-auto mb-4 animate-spin" />
                <p className="text-[14px] text-zinc-300 font-medium">
                  Generating with AI...
                </p>
                <p className="text-[12px] text-zinc-500 mt-1">
                  {generateStatus}
                </p>
              </div>
            ) : slides.length === 0 ? (
              <div className="text-center py-12 bg-[#18181b] rounded-xl border border-zinc-800 shadow-sm p-10 max-w-md w-full pointer-events-none">
                <p className="text-[16px] text-zinc-100 font-medium tracking-tight mb-2">
                  Start building slides
                </p>
                <p className="text-[13px] text-zinc-400 leading-relaxed mb-6">
                  Let AI draft your deck in seconds, or start from scratch and
                  add slides manually.
                </p>
                <div className="flex flex-col gap-3 mt-4 pointer-events-auto">
                  <Button
                    size="md"
                    className="bg-white text-black hover:bg-zinc-200 font-medium w-full rounded-md h-10 transition-colors"
                    startContent={<Sparkles className="w-4 h-4" />}
                    onPress={() =>
                      deck?.title && triggerAiGeneration(deck.title)
                    }
                    isLoading={isGenerating}
                  >
                    Generate with AI Copilot
                  </Button>
                  <Button
                    variant="bordered"
                    size="md"
                    className="border-zinc-800 text-zinc-300 w-full hover:bg-zinc-800 hover:text-zinc-100 rounded-md h-10 font-medium transition-colors"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={handleAddSlide}
                  >
                    Create blank slide
                  </Button>
                </div>
              </div>
            ) : showAll ? (
              /* GRID VIEW OF ALL SLIDES */
              <div className="w-full h-full max-w-5xl overflow-y-auto p-4 scrollbar-none pointer-events-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {slides.map((slide, idx) => (
                    <div key={slide._id} className="flex flex-col items-center">
                      <button
                        onClick={() => {
                          setSelectedSlideIndex(idx);
                          setShowAll(false);
                        }}
                        className={`w-full aspect-video rounded-md overflow-hidden border transition-all hover:scale-[1.02] ${
                          idx === selectedSlideIndex
                            ? "border-blue-500 shadow-sm"
                            : "border-zinc-800 hover:border-zinc-700"
                        }`}
                      >
                        {renderThumbnailPreview(slide)}
                      </button>
                      <span className="text-[11px] text-zinc-500 mt-2 font-medium">
                        Slide {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* SINGLE SLIDE CANVAS */
              <div
                className="w-full max-w-[960px] aspect-video bg-[#18181b] rounded-lg border border-zinc-800 shadow-md relative overflow-hidden flex flex-col justify-center pointer-events-auto origin-center transition-transform"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  willChange: "transform",
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    slideIndex: selectedSlideIndex,
                  });
                }}
              >
                {renderCanvasSlide(
                  activeSlide,
                  getActiveBullets(activeSlide),
                  true,
                )}
              </div>
            )}

            {/* SPEAKER NOTES COLLAPSIBLE PANEL */}
            {showSpeakerNotes && activeSlide && !showAll && (
              <div className="w-full max-w-[960px] mt-4 bg-[#121214] border border-zinc-800/80 rounded-xl p-4 z-10 animate-in slide-in-from-bottom duration-150 shadow-lg pointer-events-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Speaker Notes (Slide {selectedSlideIndex + 1})
                    </span>
                  </div>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    className="text-zinc-500 hover:text-zinc-200 h-6 w-6 min-w-0"
                    onPress={() => setShowSpeakerNotes(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea
                  size="sm"
                  variant="bordered"
                  placeholder="Write notes to guide your presentation here..."
                  minRows={2}
                  maxRows={4}
                  classNames={{
                    inputWrapper: "border-zinc-800 hover:border-zinc-700 focus-within:!border-zinc-500 bg-[#09090b] transition-colors rounded-lg",
                    input: "text-[12px] font-medium text-zinc-200 placeholder:text-zinc-500 leading-relaxed",
                  }}
                  value={activeSlide?.speakerNotes || ""}
                  onChange={(e) => handleUpdateSlideSpeakerNotes(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* BOTTOM CONTROLS PILL BAR */}
          {slides.length > 0 && !showAll && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#18181b]/95 backdrop-blur-md border border-zinc-800 px-5 py-2.5 rounded-xl flex items-center gap-4 text-zinc-100 shadow-2xl z-20 select-none">
              {/* Previous Slide */}
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg h-8 w-8 min-w-0 transition-colors"
                disabled={selectedSlideIndex === 0}
                onPress={() => setSelectedSlideIndex((prev) => prev - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Slide Counter */}
              <span className="text-[12px] font-semibold text-zinc-200 select-none min-w-[40px] text-center">
                {selectedSlideIndex + 1}{" "}
                <span className="text-zinc-600 mx-0.5">/</span> {slides.length}
              </span>

              {/* Next Slide */}
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg h-8 w-8 min-w-0 transition-colors"
                disabled={selectedSlideIndex === slides.length - 1}
                onPress={() => setSelectedSlideIndex((prev) => prev + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Divider orientation="vertical" className="bg-zinc-800 h-5" />

              {/* Layout Dropdown Trigger */}
              <Dropdown
                classNames={{
                  content: "bg-zinc-900 border border-zinc-800 min-w-[180px] rounded-lg shadow-xl",
                }}
              >
                <DropdownTrigger>
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 h-8 px-3 text-[11px] font-medium rounded-lg transition-colors"
                    startContent={<LayoutGrid className="w-3.5 h-3.5" />}
                  >
                    Layout: {activeSlide?.layout ? activeSlide.layout.replace("_", " ").toUpperCase() : "SELECT"}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Slide layouts"
                  itemClasses={{
                    base: "text-zinc-400 hover:text-zinc-100 data-[hover=true]:bg-zinc-800 data-[hover=true]:text-zinc-100 py-1.5 px-3 rounded-lg text-xs",
                  }}
                  onAction={(key) => handleUpdateSlideLayout(key as string)}
                >
                  <DropdownItem key="title">Title Slide</DropdownItem>
                  <DropdownItem key="content">Content List</DropdownItem>
                  <DropdownItem key="two_column">Two Columns</DropdownItem>
                  <DropdownItem key="data">Data Metrics</DropdownItem>
                  <DropdownItem key="chart">Metrics + Chart</DropdownItem>
                  <DropdownItem key="quote">Quote Slide</DropdownItem>
                  <DropdownItem key="closing">Closing / CTA</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              {/* Speaker Notes Toggle Button */}
              <Button
                size="sm"
                variant="flat"
                className={`h-8 px-3 text-[11px] font-medium rounded-lg transition-all ${
                  showSpeakerNotes
                    ? "bg-[#7170FF] text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
                }`}
                startContent={<FileText className="w-3.5 h-3.5" />}
                onPress={() => setShowSpeakerNotes(!showSpeakerNotes)}
              >
                Notes
              </Button>

              <Divider orientation="vertical" className="bg-zinc-800 h-5" />

              {/* Quick Operations (Duplicate/Delete) */}
              <div className="flex items-center gap-1">
                <Tooltip content="Duplicate Slide" classNames={{ base: "text-[10px]" }}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-8 w-8 min-w-0 rounded-lg transition-colors"
                    onPress={handleDuplicateSlide}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip content="Delete Slide" classNames={{ base: "text-[10px]" }}>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="text-zinc-400 hover:text-red-400 hover:bg-zinc-800 h-8 w-8 min-w-0 rounded-lg transition-colors"
                    disabled={slides.length <= 1}
                    onPress={handleDeleteSlide}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </Tooltip>
              </div>

              <Divider orientation="vertical" className="bg-zinc-800 h-5" />

              {/* AI Tools Dropdown */}
              <Dropdown
                classNames={{
                  content: "bg-zinc-900 border border-zinc-800 min-w-[160px] rounded-lg shadow-xl",
                }}
              >
                <DropdownTrigger>
                  <Button
                    size="sm"
                    variant="flat"
                    className="bg-[#7170FF]/15 text-[#A9A8FF] border border-[#7170FF]/25 hover:bg-[#7170FF]/25 h-8 px-3 text-[11px] font-semibold rounded-lg transition-colors"
                    startContent={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    AI Edit
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="AI Shortcuts"
                  itemClasses={{
                    base: "text-zinc-400 hover:text-zinc-100 data-[hover=true]:bg-zinc-800 data-[hover=true]:text-zinc-100 py-1.5 px-3 rounded-lg text-xs",
                  }}
                >
                  <DropdownItem key="regen" startContent={<Wand2 className="w-3.5 h-3.5" />} onPress={handleRegenerate}>
                    Regenerate Deck
                  </DropdownItem>
                  <DropdownItem key="tone_formal" onPress={() => handleToneChange("formal")}>
                    Tone: Formal
                  </DropdownItem>
                  <DropdownItem key="tone_casual" onPress={() => handleToneChange("casual")}>
                    Tone: Casual
                  </DropdownItem>
                  <DropdownItem key="len_expand" onPress={() => handleLengthChange("expand")}>
                    Length: Expand
                  </DropdownItem>
                  <DropdownItem key="len_shorten" onPress={() => handleLengthChange("shorten")}>
                    Length: Shorten
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Divider orientation="vertical" className="bg-zinc-800 h-5" />

              {/* Grid view switcher */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider select-none">
                  Grid
                </span>
                <Switch
                  size="sm"
                  color="default"
                  className="p-0"
                  classNames={{
                    wrapper: "group-data-[selected=true]:bg-blue-500",
                  }}
                  isSelected={showAll}
                  onValueChange={setShowAll}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          className="fixed bg-zinc-950/95 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-[100] min-w-[200px] backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleAddSlide();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-350 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Slide
          </button>
          
          <button
            onClick={() => {
              setSelectedSlideIndex(contextMenu.slideIndex);
              handleDuplicateSlide();
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-350 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate Slide
          </button>
          
          <button
            onClick={() => {
              setSelectedSlideIndex(contextMenu.slideIndex);
              handleDeleteSlide();
              setContextMenu(null);
            }}
            disabled={slides.length <= 1}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center gap-2 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Slide
          </button>
          
          <Divider className="my-1.5 bg-zinc-800/80" />
          
          <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Reorder
          </div>
          
          <button
            onClick={() => {
              setSelectedSlideIndex(contextMenu.slideIndex);
              handleMoveSlide("up");
              setContextMenu(null);
            }}
            disabled={contextMenu.slideIndex === 0}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-350 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="rotate-90 w-3.5 h-3.5" />
            Move Up
          </button>
          
          <button
            onClick={() => {
              setSelectedSlideIndex(contextMenu.slideIndex);
              handleMoveSlide("down");
              setContextMenu(null);
            }}
            disabled={contextMenu.slideIndex === slides.length - 1}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-350 hover:text-white hover:bg-zinc-900 flex items-center gap-2 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="rotate-90 w-3.5 h-3.5" />
            Move Down
          </button>
          
          <Divider className="my-1.5 bg-zinc-800/80" />
          
          <div className="px-3 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Change Layout
          </div>
          
          {[
            { key: "title", label: "Title Slide" },
            { key: "content", label: "Content List" },
            { key: "two_column", label: "Two Columns" },
            { key: "data", label: "Data Metrics" },
            { key: "chart", label: "Metrics + Chart" },
            { key: "quote", label: "Quote Slide" },
            { key: "closing", label: "Closing / CTA" },
          ].map((l) => (
            <button
              key={l.key}
              onClick={() => {
                setSelectedSlideIndex(contextMenu.slideIndex);
                handleUpdateSlideLayout(l.key);
                setContextMenu(null);
              }}
              className={`w-full text-left px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-between ${
                slides[contextMenu.slideIndex]?.layout === l.key
                  ? "text-blue-400 bg-blue-950/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              {l.label}
              {slides[contextMenu.slideIndex]?.layout === l.key && (
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          FULLSCREEN PRESENTATION PLAYER MODE
          ───────────────────────────────────────────── */}
      {isFullscreen && slides.length > 0 && (
        <div className="fixed inset-0 z-50 bg-[#0F1011] flex flex-col justify-center items-center select-none cursor-none">
          <div className="w-[90vw] aspect-video bg-[#121314] rounded-2xl shadow-2xl relative border border-white/10 overflow-hidden flex flex-col justify-center">
            {renderCanvasSlide(
              slides[selectedSlideIndex],
              getActiveBullets(slides[selectedSlideIndex]),
              false,
            )}
          </div>

          {/* Invisible click targets for fullscreen navigation */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (selectedSlideIndex > 0)
                setSelectedSlideIndex((prev) => prev - 1);
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (selectedSlideIndex < slides.length - 1)
                setSelectedSlideIndex((prev) => prev + 1);
            }}
          />

          {/* Fullscreen HUD bottom navigation bar */}
          <div className="absolute bottom-6 bg-[#121314]/90 backdrop-blur border border-white/10 px-4 py-2 rounded-full flex items-center gap-4 text-white shadow-xl z-20">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="text-white hover:bg-white/10 rounded-full h-7 w-7 min-w-0"
              disabled={selectedSlideIndex === 0}
              onPress={() => setSelectedSlideIndex((prev) => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold text-white select-none">
              {selectedSlideIndex + 1} <span className="text-white/40">/</span>{" "}
              {slides.length}
            </span>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              className="text-white hover:bg-white/10 rounded-full h-7 w-7 min-w-0"
              disabled={selectedSlideIndex === slides.length - 1}
              onPress={() => setSelectedSlideIndex((prev) => prev + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Divider orientation="vertical" className="bg-white/10 h-4" />
            <Button
              size="sm"
              variant="light"
              className="text-white hover:bg-white/10 h-7 px-3 text-xs font-semibold rounded-full min-w-0"
              startContent={<X className="w-3.5 h-3.5" />}
              onPress={() => setIsFullscreen(false)}
            >
              Exit Show
            </Button>
          </div>
        </div>
      )}

      {/* ── CANVAS CHATBOT ─────────────────────────────── */}
      {/* Floating button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 transition-all z-40 border border-zinc-200"
        >
          <span className="material-symbols-outlined text-[24px]">
            chat
          </span>
        </button>
      )}

      {/* Chat panel */}
      {isChatOpen && (
        <div className="fixed top-0 right-0 h-screen w-[50vw] max-w-[700px] min-w-[450px] bg-[#09090b]/90 backdrop-blur-lg border-l border-zinc-800/80 shadow-2xl z-50 flex flex-col transition-transform duration-300">
          {/* Panel header */}
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-100 text-[18px]">
                  smart_toy
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  AI Slide Assistant
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {activeSlide
                    ? `Editing Slide ${selectedSlideIndex + 1}: ${activeSlide.title.slice(0, 24)}${activeSlide.title.length > 24 ? "..." : ""}`
                    : "No slide selected"}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsChatOpen(false)}
              className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {canvasChatMessages.length === 0 && (
              <div className="flex flex-col justify-center h-full px-4 text-center space-y-6">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-zinc-100 text-[24px]">
                      auto_awesome
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-200">
                    GenStack Copilot
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-2 leading-relaxed">
                    Ask me to rewrite content, make speaker notes, format data, change slide layouts, or perform direct slide modifications.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-w-md mx-auto w-full pt-2">
                  {[
                    { label: "Shorten content", icon: "vertical_align_center", text: "Make the current slide content much more concise." },
                    { label: "Improve tone", icon: "workspace_premium", text: "Make the tone of this slide highly professional." },
                    { label: "Draft speaker notes", icon: "notes", text: "Create detailed speaker notes for this slide." },
                    { label: "Change title", icon: "edit", text: "Suggest a punchier and more catchy title for this slide." },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleSuggestedPrompt(chip.text)}
                      className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-left transition-all hover:border-zinc-700 flex flex-col space-y-1"
                    >
                      <div className="flex items-center gap-1.5 text-zinc-200">
                        <span className="material-symbols-outlined text-[14px] text-zinc-400">
                          {chip.icon}
                        </span>
                        <span className="text-[11px] font-semibold">{chip.label}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 leading-normal">
                        {chip.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {canvasChatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="material-symbols-outlined text-zinc-100 text-[12px]">
                      auto_awesome
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-white text-black rounded-tr-sm font-medium text-[13px] leading-relaxed shadow-sm"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm text-[13px] leading-relaxed"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  
                  {/* Subtle confirmation when slide updates are applied */}
                  {msg.role === "assistant" && msg.content.toLowerCase().includes("update") && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-850 text-[10px] text-emerald-400 font-medium">
                      <span className="material-symbols-outlined text-[12px]">
                        check_circle
                      </span>
                      Changes applied directly to active slide
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isChatLoading && (
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-zinc-100 text-[12px]">
                    auto_awesome
                  </span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((d) => (
                      <div
                        key={d}
                        className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={canvasChatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-zinc-800 bg-[#09090b] flex-shrink-0">
            <div className="flex gap-2 bg-zinc-900 rounded-xl border border-zinc-800 px-3.5 py-2.5">
              <textarea
                ref={canvasChatInputRef}
                value={canvasChatInput}
                onChange={(e) => setCanvasChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCanvasChat();
                  }
                }}
                placeholder="Ask AI to edit this slide..."
                disabled={isChatLoading}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-zinc-100 placeholder:text-zinc-500 resize-none min-h-[24px] max-h-[80px] self-center focus:ring-0"
              />
              <button
                onClick={handleCanvasChat}
                disabled={!canvasChatInput.trim() || isChatLoading}
                className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center disabled:opacity-30 flex-shrink-0 hover:bg-zinc-200 transition-colors self-end"
              >
                <span className="material-symbols-outlined text-black text-[16px]">
                  send
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
