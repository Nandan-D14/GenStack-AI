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
  GripVertical
} from "lucide-react";
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
  const [isEditMode, setIsEditMode] = useState(false);
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

  // Export states
  const [isExporting, setIsExporting] = useState(false);

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

  // Convex action for PPTX generation
  const runGeneratePptx = useAction(api.export.generatePptx);

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
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).id === "canvas-bg") {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsPanning(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch(err) {}
  };

  const handleZoomIn = () => setZoom(z => Math.min(3, z + 0.1));
  const handleZoomOut = () => setZoom(z => Math.max(0.1, z - 0.1));
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
    } else if (selectedSlideIndex > draggedSlideIndex && selectedSlideIndex <= dropIdx) {
      setSelectedSlideIndex(selectedSlideIndex - 1);
    } else if (selectedSlideIndex < draggedSlideIndex && selectedSlideIndex >= dropIdx) {
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
        body: JSON.stringify({ prompt, deckId: id }),
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
    setCanvasChatMessages((prev) => [...prev, { role: "user", content: msg }]);
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
              }
            : null,
          allSlides: slides.map((s: any) => ({
            title: s.title,
            layout: s.layout,
          })),
          deckTitle: deck?.title || "",
          history: canvasChatMessages.slice(-6),
        }),
      });

      const data = await res.json();
      const reply =
        data.reply ||
        "I can help with that. What specifically would you like to change?";
      setCanvasChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);

      // Apply slide update if returned
      if (data.slideUpdate && activeSlide) {
        const update: any = {};
        if (data.slideUpdate.title) update.title = data.slideUpdate.title;
        if (Array.isArray(data.slideUpdate.bullets))
          update.content = JSON.stringify(data.slideUpdate.bullets);
        if (data.slideUpdate.speakerNotes)
          update.speakerNotes = data.slideUpdate.speakerNotes;
        if (Object.keys(update).length > 0) {
          await runUpdateSlideContent({ id: activeSlide._id, ...update });
        }
      }
    } catch {
      setCanvasChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, couldn't process that. Try again.",
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
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

  // ─────────────────────────────────────────────
  // RENDER THUMBNAIL LAYOUT MINI-PREVIEW
  // ─────────────────────────────────────────────
  const renderThumbnailPreview = (slide: any) => {
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
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
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
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
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
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
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
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
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
                        contentEditable={isInteractive && isEditMode}
                        suppressContentEditableWarning
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
                      contentEditable={isInteractive && isEditMode}
                      suppressContentEditableWarning
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
          <Tooltip content="Present Fullscreen" delay={500} classNames={{ base: "text-[11px] font-medium" }}>
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
          <Tooltip content="Export Editable PPTX" delay={500} classNames={{ base: "text-[11px] font-medium" }}>
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
                    className={`flex flex-col items-center group ${isDragging ? 'opacity-50 scale-95' : ''} transition-all`}
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
                <Button isIconOnly variant="light" size="sm" className="text-zinc-400 hover:text-zinc-100 min-w-8 w-8 h-8 rounded-md" onPress={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </Tooltip>
              <div className="w-12 text-center text-[12px] font-medium text-zinc-300 select-none">
                {Math.round(zoom * 100)}%
              </div>
              <Tooltip content="Zoom In">
                <Button isIconOnly variant="light" size="sm" className="text-zinc-400 hover:text-zinc-100 min-w-8 w-8 h-8 rounded-md" onPress={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </Tooltip>
              <Divider orientation="vertical" className="h-4 bg-zinc-800 mx-1" />
              <Tooltip content="Reset Zoom">
                <Button isIconOnly variant="light" size="sm" className="text-zinc-400 hover:text-zinc-100 min-w-8 w-8 h-8 rounded-md" onPress={handleResetZoom}>
                  <Maximize className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          )}

          <div 
            id="canvas-bg"
            className={`flex-1 flex items-center justify-center p-8 overflow-hidden ${isPanning ? 'cursor-grabbing' : slides.length > 0 && !showAll ? 'cursor-grab' : ''}`}
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
                  Let AI draft your deck in seconds, or start from scratch and add slides manually.
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
                  willChange: 'transform'
                }}
              >
                {renderSlideContent(
                  activeSlide,
                  getActiveBullets(activeSlide),
                  true,
                )}
              </div>
            )}
          </div>

          {/* BOTTOM CONTROLS PILL BAR */}
          {slides.length > 0 && !showAll && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#18181b] border border-zinc-800 px-4 py-2 rounded-lg flex items-center gap-4 text-zinc-100 shadow-lg z-20">
              {/* Previous Slide */}
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md h-7 w-7 min-w-0 transition-colors"
                disabled={selectedSlideIndex === 0}
                onPress={() => setSelectedSlideIndex((prev) => prev - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              {/* Slide Counter */}
              <span className="text-[12px] font-medium text-zinc-100 select-none min-w-[40px] text-center">
                {selectedSlideIndex + 1}{" "}
                <span className="text-zinc-500 mx-0.5">/</span>{" "}
                {slides.length}
              </span>

              {/* Next Slide */}
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md h-7 w-7 min-w-0 transition-colors"
                disabled={selectedSlideIndex === slides.length - 1}
                onPress={() => setSelectedSlideIndex((prev) => prev + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Divider orientation="vertical" className="bg-zinc-800 h-4" />

              {/* Show All Grid Switch */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider select-none">
                  Grid
                </span>
                <Switch
                  size="sm"
                  color="default"
                  className="p-0"
                  classNames={{ wrapper: "group-data-[selected=true]:bg-blue-500" }}
                  isSelected={showAll}
                  onValueChange={setShowAll}
                />
              </div>

              <Divider orientation="vertical" className="bg-zinc-800 h-4" />

              {/* Edit Mode Toggle */}
              <Button
                size="sm"
                variant="flat"
                className={`h-7 px-3 text-[11px] font-medium rounded-md min-w-0 transition-all ${
                  isEditMode
                    ? "bg-blue-500 text-white"
                    : "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
                startContent={<Edit3 className="w-3.5 h-3.5" />}
                onPress={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? "Editing" : "Edit"}
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: AI Copilot & Slide Settings */}
        {slides.length > 0 && (
          <div className="w-[320px] bg-[#18181b] border-l border-zinc-800 flex flex-col shrink-0">
            {/* Slide Settings Section */}
            <div className="p-5 border-b border-zinc-800 space-y-5 shrink-0">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Slide Settings
              </span>

              {/* Slide title headline */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Slide Headline
                </label>
                <Input
                  size="sm"
                  variant="bordered"
                  className="text-zinc-100"
                  classNames={{
                    inputWrapper:
                      "border-zinc-800 hover:border-zinc-700 focus-within:!border-zinc-500 bg-zinc-900 shadow-sm transition-colors rounded-md h-9",
                    input: "text-[12px] font-medium placeholder:text-zinc-500",
                  }}
                  value={activeSlide?.title || ""}
                  onChange={(e) => handleUpdateSlideTitle(e.target.value)}
                />
              </div>

              {/* Slide layout selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Layout Template
                </label>
                <Dropdown classNames={{ content: "bg-zinc-900 border border-zinc-800 min-w-[200px] rounded-md" }}>
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      variant="bordered"
                      className="w-full justify-between border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-[12px] font-medium text-zinc-100 transition-colors rounded-md h-9"
                    >
                      {activeSlide?.layout
                        ? activeSlide.layout.replace("_", " ").toUpperCase()
                        : "Select Layout"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Slide layouts"
                    itemClasses={{ base: "text-zinc-400 hover:text-zinc-100 data-[hover=true]:bg-zinc-800 data-[hover=true]:text-zinc-100 py-2 rounded-md" }}
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
              </div>

              {/* Bullets Points editor */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Slide Bullets
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {getActiveBullets(activeSlide).map((bullet, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        size="sm"
                        variant="bordered"
                        className="flex-1"
                        classNames={{
                          inputWrapper:
                            "border-zinc-800 hover:border-zinc-700 focus-within:!border-zinc-500 bg-zinc-900 transition-colors min-h-[32px] h-[32px] rounded-md",
                          input: "text-[12px] text-zinc-100",
                        }}
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = getActiveBullets(activeSlide);
                          newBullets[idx] = e.target.value;
                          handleUpdateSlideBullets(newBullets);
                        }}
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-zinc-500 hover:text-red-400 hover:bg-zinc-800 h-8 w-8 min-w-0 transition-colors rounded-md"
                        onPress={() => {
                          const newBullets = getActiveBullets(activeSlide).filter((_, i) => i !== idx);
                          handleUpdateSlideBullets(newBullets);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  className="w-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700 h-8 text-[12px] font-medium transition-colors mt-2 rounded-md"
                  startContent={<Plus className="w-3.5 h-3.5" />}
                  onPress={() => {
                    const newBullets = [...getActiveBullets(activeSlide), "New key point"];
                    handleUpdateSlideBullets(newBullets);
                  }}
                >
                  Add Bullet Point
                </Button>
              </div>

              {/* Speaker notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Speaker Notes
                </label>
                <Textarea
                  size="sm"
                  variant="bordered"
                  placeholder="Notes visible during presentation..."
                  minRows={2}
                  maxRows={4}
                  classNames={{
                    inputWrapper:
                      "border-zinc-800 hover:border-zinc-700 focus-within:!border-zinc-500 bg-zinc-900 transition-colors rounded-md",
                    input: "text-[12px] font-medium text-zinc-100 placeholder:text-zinc-500",
                  }}
                  value={activeSlide?.speakerNotes || ""}
                  onChange={(e) => handleUpdateSlideSpeakerNotes(e.target.value)}
                />
              </div>

              {/* Manual operations row */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/50">
                <Button
                  size="sm"
                  variant="bordered"
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 text-[12px] h-9 font-medium transition-colors rounded-md"
                  startContent={<Copy className="w-3.5 h-3.5" />}
                  onPress={handleDuplicateSlide}
                >
                  Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="bordered"
                  className="border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 text-[12px] h-9 font-medium transition-colors hover:border-red-500/30 rounded-md"
                  startContent={<Trash2 className="w-3.5 h-3.5" />}
                  disabled={slides.length <= 1}
                  onPress={handleDeleteSlide}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* AI Copilot Section */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              <span className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase block">
                AI Copilot
              </span>

              {/* Ask AI to edit */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Ask AI to edit
                </label>
                <Textarea
                  value={aiEditPrompt}
                  onValueChange={setAiEditPrompt}
                  placeholder="e.g. Make the tone more formal, add a slide about pricing..."
                  size="sm"
                  minRows={2}
                  maxRows={4}
                  disabled={isAiEditing}
                  classNames={{
                    inputWrapper:
                      "border-zinc-800 hover:border-zinc-700 focus-within:!border-zinc-500 bg-zinc-900 transition-colors rounded-md",
                    input: "text-[12px] font-medium text-zinc-100 placeholder:text-zinc-500",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAiEditSubmit();
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="w-full bg-white text-black hover:bg-zinc-200 font-medium text-[12px] h-9 transition-colors mt-2 rounded-md"
                  startContent={
                    isAiEditing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )
                  }
                  onPress={handleAiEditSubmit}
                  isLoading={isAiEditing}
                  disabled={!aiEditPrompt.trim() || isAiEditing}
                >
                  {isAiEditing ? "Applying Edit..." : "Apply Edit"}
                </Button>
              </div>

              <Divider className="bg-zinc-800/50" />

              {/* Quick AI actions */}
              <div className="space-y-3">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  AI Shortcuts
                </label>

                <Button
                  size="sm"
                  variant="flat"
                  className="w-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-medium text-[12px] h-9 justify-start transition-colors rounded-md"
                  startContent={<Wand2 className="w-4 h-4" />}
                  onPress={handleRegenerate}
                  isLoading={regenerating}
                >
                  Regenerate Deck
                </Button>

                <div className="flex gap-2">
                  <Dropdown classNames={{ content: "bg-zinc-900 border border-zinc-800 min-w-[150px] rounded-md" }}>
                    <DropdownTrigger>
                      <Button
                        size="sm"
                        variant="bordered"
                        className="flex-1 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-[12px] h-9 justify-start transition-colors rounded-md"
                        startContent={<Type className="w-4 h-4" />}
                      >
                        Change Tone
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Change tone actions"
                      itemClasses={{ base: "text-zinc-400 hover:text-zinc-100 data-[hover=true]:bg-zinc-800 data-[hover=true]:text-zinc-100 py-2 rounded-md" }}
                      onAction={(key) => handleToneChange(key as string)}
                    >
                      <DropdownItem key="formal">Formal</DropdownItem>
                      <DropdownItem key="persuasive">Persuasive</DropdownItem>
                      <DropdownItem key="casual">Casual</DropdownItem>
                      <DropdownItem key="technical">Technical</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>

                  <Dropdown classNames={{ content: "bg-zinc-900 border border-zinc-800 min-w-[150px] rounded-md" }}>
                    <DropdownTrigger>
                      <Button
                        size="sm"
                        variant="bordered"
                        className="flex-1 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 text-[12px] h-9 justify-start transition-colors rounded-md"
                        startContent={<LayoutGrid className="w-4 h-4" />}
                      >
                        Length
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Expand or shorten actions"
                      itemClasses={{ base: "text-zinc-400 hover:text-zinc-100 data-[hover=true]:bg-zinc-800 data-[hover=true]:text-zinc-100 py-2 rounded-md" }}
                      onAction={(key) => handleLengthChange(key as string)}
                    >
                      <DropdownItem key="expand">Expand</DropdownItem>
                      <DropdownItem key="shorten">Shorten</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────
          FULLSCREEN PRESENTATION PLAYER MODE
          ───────────────────────────────────────────── */}
      {isFullscreen && slides.length > 0 && (
        <div className="fixed inset-0 z-50 bg-[#0F1011] flex flex-col justify-center items-center select-none cursor-none">
          <div className="w-[90vw] aspect-video bg-[#121314] rounded-2xl shadow-2xl relative border border-white/10 overflow-hidden flex flex-col justify-center">
            {renderSlideContent(
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
      <button
        onClick={() => setIsChatOpen((prev) => !prev)}
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-50 transition-all duration-200 ${
          isChatOpen
            ? "bg-surface-container border border-border text-primary"
            : "bg-primary text-on-primary hover:opacity-90"
        }`}
      >
        <span className="material-symbols-outlined text-[22px]">
          {isChatOpen ? "close" : "chat"}
        </span>
      </button>

      {/* Chat panel */}
      {isChatOpen && (
        <div
          className="fixed bottom-20 right-6 w-80 bg-[#0d0e0f] border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          style={{ height: "420px" }}
        >
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-surface-container-low/60 flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[14px]">
                smart_toy
              </span>
            </div>
            <div className="flex-1">
              <p className="font-label-md text-label-md text-primary font-semibold">
                Slide Assistant
              </p>
              <p className="font-label-sm text-[10px] text-on-surface-variant">
                {activeSlide
                  ? `Slide: ${activeSlide.title.slice(0, 28)}${activeSlide.title.length > 28 ? "..." : ""}`
                  : "No slide selected"}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {canvasChatMessages.length === 0 && (
              <div className="text-center text-on-surface-variant py-6">
                <span className="material-symbols-outlined text-[32px] block mb-2 opacity-30">
                  forum
                </span>
                <p className="font-body-sm text-[12px]">
                  Ask me to edit, improve,
                  <br />
                  or explain the current slide.
                </p>
              </div>
            )}
            {canvasChatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-1.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="material-symbols-outlined text-primary text-[10px]">
                      auto_awesome
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-on-primary rounded-tr-sm"
                      : "bg-surface-container text-on-surface rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-[10px]">
                    auto_awesome
                  </span>
                </div>
                <div className="bg-surface-container rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <div
                        key={d}
                        className="w-1 h-1 rounded-full bg-on-surface-variant animate-bounce"
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
          <div className="p-2.5 border-t border-border flex-shrink-0">
            <div className="flex gap-1.5 bg-surface-container rounded-xl border border-border/40 px-3 py-2">
              <input
                type="text"
                value={canvasChatInput}
                onChange={(e) => setCanvasChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCanvasChat();
                }}
                placeholder="Make it more concise..."
                disabled={isChatLoading}
                className="flex-1 bg-transparent border-none outline-none text-[12px] text-primary placeholder:text-on-surface-variant/50 min-w-0"
              />
              <button
                onClick={handleCanvasChat}
                disabled={!canvasChatInput.trim() || isChatLoading}
                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center disabled:opacity-30 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-on-primary text-[13px]">
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
