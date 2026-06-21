"use client";

import { Button, Card, CardBody, Chip, Tooltip, Divider, Badge, Avatar, AvatarGroup, Input, Textarea, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { ArrowLeft, ArrowRight, Undo2, Redo2, Download, Share2, Sparkles, Lock, Unlock, Copy, Trash2, Image, LayoutTemplate, Type, MessageSquare, Plus, ChevronLeft, ChevronRight, Monitor, Wand2, Zap, BarChart3, Lightbulb, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const layoutIcons: Record<string, any> = { title: Lightbulb, content: Type, data: BarChart3, chart: TrendingUp, diagram: Zap, comparison: Users, quote: MessageSquare, closing: Monitor, two_column: LayoutTemplate };

export default function EditorPage() {
  const { id } = useParams();
  const [selectedSlide, setSelectedSlide] = useState(1);
  const [regenerating, setRegenerating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [speakerNotes, setSpeakerNotes] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const deck = useQuery(api.decks.getById, id ? { id: id as any } : "skip");
  const slides = deck?.slides || [];
  const currentSlide = slides[selectedSlide - 1] || slides[0];

  useEffect(() => {
    if (currentSlide) {
      setEditTitle(currentSlide.title || "");
      const parsedBullets = (() => {
        try {
          return currentSlide.content ? JSON.parse(currentSlide.content) : [];
        } catch (e) {
          return [];
        }
      })();
      setEditContent(Array.isArray(parsedBullets) ? parsedBullets.map((b: string) => `- ${b}`).join("\n") : "");
      setSpeakerNotes(currentSlide.speakerNotes || "");
    }
  }, [currentSlide?._id, currentSlide?.title, currentSlide?.content, currentSlide?.speakerNotes]);

  const bullets = editContent
    .split("\n")
    .map((b: string) => b.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  const runRegenerateSlide = useMutation(api.slides.regenerateSlide);
  const updateSlide = useMutation(api.slides.updateSlideContent);
  const runDeleteSlide = useMutation(api.slides.deleteSlide);
  const runDuplicateSlide = useMutation(api.slides.duplicateSlide);
  const runCreateSlide = useMutation(api.slides.createSlide);

  const handleRegenerate = async () => {
    if (!currentSlide || currentSlide.isLocked) return;
    setRegenerating(true);
    try {
      await runRegenerateSlide({ slideId: currentSlide._id });
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  };

  const handleToneChange = async (selectedTone: string) => {
    if (!currentSlide || currentSlide.isLocked) return;
    setRegenerating(true);
    try {
      await runRegenerateSlide({ slideId: currentSlide._id, tone: selectedTone });
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  };

  const handleLengthChange = async (selectedLength: string) => {
    if (!currentSlide || currentSlide.isLocked) return;
    setRegenerating(true);
    try {
      await runRegenerateSlide({ slideId: currentSlide._id, length: selectedLength });
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  };

  const saveTitle = async () => {
    if (!currentSlide || editTitle === currentSlide.title) return;
    await updateSlide({ id: currentSlide._id, title: editTitle });
  };

  const saveContent = async () => {
    if (!currentSlide) return;
    const parsedBullets = editContent
      .split("\n")
      .map((b: string) => b.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean);
    const serialized = JSON.stringify(parsedBullets);
    if (serialized === currentSlide.content) return;
    await updateSlide({ id: currentSlide._id, content: serialized });
  };

  const handleToggleLock = async () => {
    if (!currentSlide) return;
    await updateSlide({ id: currentSlide._id, isLocked: !currentSlide.isLocked });
  };

  const handleLayoutChange = async (newLayout: string) => {
    if (!currentSlide) return;
    await updateSlide({ id: currentSlide._id, layout: newLayout });
  };

  const handleDuplicate = async () => {
    if (!currentSlide) return;
    await runDuplicateSlide({ id: currentSlide._id });
    setSelectedSlide(selectedSlide + 1);
  };

  const handleDelete = async () => {
    if (!currentSlide || slides.length <= 1) return;
    await runDeleteSlide({ id: currentSlide._id });
    setSelectedSlide(Math.max(1, selectedSlide - 1));
  };

  const handleAddSlide = async () => {
    if (!deck) return;
    const maxOrder = slides.reduce((max: number, s: any) => Math.max(max, s.order), -1);
    await runCreateSlide({
      deckId: deck._id,
      title: "New Slide",
      layout: "content",
      order: maxOrder + 1,
    });
    setSelectedSlide(slides.length + 1);
  };

  const handleSaveNotes = async () => {
    if (!currentSlide) return;
    await updateSlide({ id: currentSlide._id, speakerNotes });
    onClose();
  };

  const handlePresent = () => {
    if (canvasRef.current) {
      canvasRef.current.requestFullscreen().catch((err) => {
        console.error("Error entering fullscreen mode", err);
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-divider bg-content1/80">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-default-400 hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <Input variant="flat" defaultValue={deck?.title || "Loading..."} className="w-64" size="sm" />
          <Badge color="primary" variant="flat" className="bg-primary/20 text-primary">Draft</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button isIconOnly variant="light" size="sm"><Undo2 className="w-4 h-4 text-default-400" /></Button>
          <Button isIconOnly variant="light" size="sm"><Redo2 className="w-4 h-4 text-default-400" /></Button>
          <Divider orientation="vertical" className="h-6 bg-default-200" />
          <AvatarGroup size="sm" isBordered max={3}>
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=editor-1" className="w-6 h-6" />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=editor-2" className="w-6 h-6" />
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=editor-3" className="w-6 h-6" />
          </AvatarGroup>
          <Divider orientation="vertical" className="h-6 bg-default-200" />
          <Button variant="flat" size="sm" startContent={<Share2 className="w-4 h-4" />}>Share</Button>
          <Button as={Link} href={`/deck/${id}/export`} color="primary" size="sm" startContent={<Download className="w-4 h-4" />}>Export</Button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-content1 border-r border-divider flex flex-col">
          <div className="p-3 border-b border-divider flex items-center justify-between">
            <span className="text-xs font-medium text-default-400">Slides</span>
            <Button isIconOnly size="sm" variant="light" onPress={handleAddSlide}><Plus className="w-3.5 h-3.5 text-default-400" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {slides.map((slide: any, idx: number) => {
              const Icon = layoutIcons[slide.layout] || Type;
              const isActive = idx + 1 === selectedSlide;
              return (
                <div key={slide._id} onClick={() => setSelectedSlide(idx + 1)} className={`relative p-2.5 rounded-xl cursor-pointer transition-all duration-200 border ${isActive ? "bg-[#7170FF]/15 border-[#7170FF]/40 shadow-sm" : "bg-[#0F1011] border-white/[0.06] hover:border-white/[0.15]"}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs text-default-400 w-3">{idx + 1}</span>
                    <div className="w-9 h-6 bg-[#151617] rounded border border-white/[0.05] flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-default-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate font-medium">{slide.title || "Untitled Slide"}</p>
                      <p className="text-[10px] text-default-500 capitalize">{slide.layout ? slide.layout.replace("_", " ") : "content"}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {slide.isLocked && <Lock className="w-3 h-3 text-warning" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center p-8 bg-[#08090A]">
            <div ref={canvasRef} className="w-full max-w-4xl aspect-video bg-[#0F1011] rounded-2xl border border-white/[0.08] shadow-2xl p-12 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#7170FF]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <div className="w-6 h-6 bg-[#7170FF] rounded-md flex items-center justify-center shadow-md shadow-[#7170FF]/25">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-default-400 font-semibold tracking-wide">GenStack AI</span>
              </div>
              <div className="absolute bottom-6 right-6 text-xs text-default-400 font-mono tracking-wider">{selectedSlide} / {slides.length}</div>
              <div className="relative z-10 w-full">
                {currentSlide?.layout === "title" && (
                  <div className="text-center max-w-3xl mx-auto py-4 animate-fade-in">
                    <Chip className="bg-[#7170FF]/15 text-[#7170FF] border border-[#7170FF]/30 mb-6 font-semibold tracking-wide rounded-full" size="sm">
                      {deck?.type ? deck.type.toUpperCase() : "PRESENTATION"}
                    </Chip>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white leading-tight mb-5 bg-clip-text text-transparent bg-gradient-to-b from-white to-default-300">
                      {editTitle}
                    </h1>
                    {bullets[0] && (
                      <p className="text-lg text-default-400 font-normal leading-relaxed max-w-2xl mx-auto">
                        {bullets[0]}
                      </p>
                    )}
                    {bullets.length > 1 && (
                      <div className="mt-8 flex justify-center gap-3 flex-wrap">
                        {bullets.slice(1).map((bullet: string, i: number) => (
                          <div key={i} className="px-4 py-2 bg-[#151617] border border-white/[0.06] rounded-xl text-sm text-default-300 shadow-md">
                            {bullet}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {(currentSlide?.layout === "content" || currentSlide?.layout === "title_content") && (
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-semibold text-white tracking-tight mb-8 border-l-3 border-[#7170FF] pl-4 leading-none">
                      {editTitle}
                    </h2>
                    <div className="space-y-4">
                      {bullets.map((bullet: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7170FF] mt-2.5 shrink-0" />
                          <p className="text-lg text-default-300 leading-relaxed font-normal">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {currentSlide?.layout === "two_column" && (
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-semibold text-white tracking-tight mb-8 border-l-3 border-[#7170FF] pl-4 leading-none">
                      {editTitle}
                    </h2>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        {bullets.slice(0, Math.ceil(bullets.length / 2)).map((bullet: string, i: number) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#7170FF] mt-2.5 shrink-0" />
                            <p className="text-base text-default-300 leading-relaxed">{bullet}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        {bullets.slice(Math.ceil(bullets.length / 2)).map((bullet: string, i: number) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#7170FF] mt-2.5 shrink-0" />
                            <p className="text-base text-default-300 leading-relaxed">{bullet}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {currentSlide?.layout === "comparison" && (
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-semibold text-white tracking-tight mb-8 text-center">
                      {editTitle}
                    </h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-[#151617] rounded-xl border border-white/[0.06] shadow-lg">
                        <h3 className="text-lg font-semibold text-[#7170FF] mb-4">
                          {bullets[0]?.split(/:\s*|--\s*|-\s*/)[0] || "Option A"}
                        </h3>
                        <div className="space-y-3">
                          {bullets.slice(1, Math.ceil(bullets.length / 2) + 1).map((bullet: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-default-300">
                              <div className="w-1 h-1 rounded-full bg-[#7170FF] mt-2 shrink-0" />
                              <p>{bullet.replace(/^[^:-]+[:--]\s*/, "")}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-6 bg-[#151617] rounded-xl border border-white/[0.06] shadow-lg">
                        <h3 className="text-lg font-semibold text-success mb-4">
                          {bullets[Math.ceil(bullets.length / 2) + 1]?.split(/:\s*|--\s*|-\s*/)[0] || "Option B"}
                        </h3>
                        <div className="space-y-3">
                          {bullets.slice(Math.ceil(bullets.length / 2) + 2).map((bullet: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-default-300">
                              <div className="w-1 h-1 rounded-full bg-success mt-2 shrink-0" />
                              <p>{bullet.replace(/^[^:-]+[:--]\s*/, "")}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {currentSlide?.layout === "quote" && (
                  <div className="max-w-3xl mx-auto py-6 text-center relative">
                    <span className="text-8xl font-serif text-[#7170FF]/25 absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none select-none">“</span>
                    <h2 className="text-2xl md:text-3xl font-medium italic text-[#F7F8F8] leading-relaxed relative z-10">
                      {editTitle || bullets[0]}
                    </h2>
                    {bullets.length > 0 && (
                      <p className="text-base text-[#A1A5AE] mt-6 tracking-wide font-medium">
                        — {bullets[bullets.length - 1]}
                      </p>
                    )}
                  </div>
                )}
                {currentSlide?.layout === "data" && (
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-semibold text-white tracking-tight mb-8">
                      {editTitle}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {bullets.map((bullet: string, i: number) => {
                        const parts = bullet.split(/:\s*|--\s*|-\s*/);
                        const metric = parts[0]?.trim();
                        const description = parts.slice(1).join(": ")?.trim();

                        if (description) {
                          return (
                            <div key={i} className="p-6 bg-[#151617] rounded-xl border border-white/[0.06] shadow-lg flex flex-col justify-between">
                              <p className="text-3xl font-semibold text-[#7170FF] tracking-tight">{metric}</p>
                              <p className="text-sm text-default-400 mt-4 leading-relaxed font-normal">{description}</p>
                            </div>
                          );
                        } else {
                          return (
                            <div key={i} className="p-6 bg-[#151617] rounded-xl border border-white/[0.06] shadow-lg flex items-center justify-center text-center">
                              <p className="text-base text-default-300 font-medium">{bullet}</p>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}
                {currentSlide?.layout === "chart" && (
                  <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-semibold text-white tracking-tight mb-8">
                      {editTitle}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4">
                        {bullets.map((bullet: string, i: number) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#7170FF] mt-2 shrink-0" />
                            <p className="text-base text-default-300 leading-relaxed">{bullet}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-[#151617] rounded-2xl border border-white/[0.06] p-6 shadow-xl flex flex-col items-center justify-center">
                        <div className="h-40 w-full flex items-end gap-3 px-2 border-b border-white/[0.08] pb-2">
                          {[55, 75, 90, 110, 140, 180, 220].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                              <div className="w-full bg-[#7170FF]/80 rounded-t-md hover:bg-[#7170FF] transition-colors" style={{ height: `${h * 0.65}px` }} />
                              <span className="text-[9px] text-default-500 mt-1">Q{i + 1}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex w-full justify-between items-center mt-3 text-xs text-default-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded bg-[#7170FF] inline-block" />
                            Active Growth
                          </span>
                          <span>MoM Tracked</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {currentSlide?.layout === "closing" && (
                  <div className="text-center max-w-3xl mx-auto py-4">
                    <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-default-300">
                      {editTitle}
                    </h2>
                    {bullets.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mt-6">
                        {bullets.map((bullet: string, i: number) => (
                          <div key={i} className="p-4 bg-[#151617] rounded-xl border border-white/[0.06] text-center shadow-md">
                            <p className="text-sm text-default-300 font-medium leading-relaxed">{bullet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!["title", "content", "two_column", "title_content", "data", "chart", "comparison", "quote", "closing"].includes(currentSlide?.layout) && (
                  <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-semibold text-white tracking-tight mb-4">{editTitle}</h2>
                    <p className="text-lg text-default-400">Content for this layout is ready to generate.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="px-8 py-3 border-t border-divider flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button isIconOnly size="sm" variant="light" onPress={() => setSelectedSlide(Math.max(1, selectedSlide - 1))}><ChevronLeft className="w-4 h-4 text-default-400" /></Button>
              <span className="text-sm text-default-400">{selectedSlide} / {slides.length}</span>
              <Button isIconOnly size="sm" variant="light" onPress={() => setSelectedSlide(Math.min(slides.length, selectedSlide + 1))}><ChevronRight className="w-4 h-4 text-default-400" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="flat" size="sm" startContent={<Monitor className="w-4 h-4" />} onPress={handlePresent}>Present</Button>
              <Button variant="flat" size="sm" startContent={<MessageSquare className="w-4 h-4" />} onPress={onOpen}>Notes</Button>
            </div>
          </div>
        </div>
        <div className="w-72 bg-content1 border-l border-divider flex flex-col">
          <div className="p-4 border-b border-divider"><h3 className="text-sm font-semibold text-foreground">Properties</h3></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
            <div>
              <label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">AI Actions</label>
              <div className="space-y-2">
                <Button size="sm" className="w-full bg-primary/20 text-primary border border-primary/30 font-semibold" startContent={<Sparkles className="w-4 h-4" />} onPress={handleRegenerate} isLoading={regenerating}>Regenerate Slide</Button>
                
                <Dropdown>
                  <DropdownTrigger>
                    <Button size="sm" variant="flat" className="w-full" startContent={<Wand2 className="w-4 h-4" />}>Change Tone</Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Change tone actions" className="bg-[#0F1011] border border-white/[0.08] text-white" onAction={(key) => handleToneChange(key as string)}>
                    <DropdownItem key="formal" className="hover:bg-[#151617] text-white">Formal & Professional</DropdownItem>
                    <DropdownItem key="persuasive" className="hover:bg-[#151617] text-white">Persuasive</DropdownItem>
                    <DropdownItem key="casual" className="hover:bg-[#151617] text-white">Casual & Friendly</DropdownItem>
                    <DropdownItem key="technical" className="hover:bg-[#151617] text-white">Technical & Precise</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                
                <Dropdown>
                  <DropdownTrigger>
                    <Button size="sm" variant="flat" className="w-full" startContent={<Type className="w-4 h-4" />}>Expand / Shorten</Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Expand or shorten actions" className="bg-[#0F1011] border border-white/[0.08] text-white" onAction={(key) => handleLengthChange(key as string)}>
                    <DropdownItem key="expand" className="hover:bg-[#151617] text-white">Expand content</DropdownItem>
                    <DropdownItem key="shorten" className="hover:bg-[#151617] text-white">Shorten content</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
            <Divider className="bg-default-200" />
            <div>
              <label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">Layout</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Title", key: "title" },
                  { label: "Content", key: "content" },
                  { label: "Two Col", key: "two_column" },
                  { label: "Data", key: "data" },
                  { label: "Chart", key: "chart" },
                  { label: "Comparison", key: "comparison" },
                  { label: "Quote", key: "quote" },
                  { label: "Closing", key: "closing" }
                ].map((l) => {
                  const isSelected = l.key === currentSlide?.layout;
                  return (
                    <div 
                      key={l.key} 
                      onClick={() => handleLayoutChange(l.key)}
                      className={`p-2 rounded-lg border text-center text-xs cursor-pointer transition-colors ${isSelected ? "border-[#7170FF]/50 bg-[#7170FF]/10 text-[#7170FF]" : "border-default bg-[#0F1011] text-default-400 hover:border-default-200"}`}
                    >
                      <LayoutTemplate className="w-4 h-4 mx-auto mb-1" />
                      {l.label}
                    </div>
                  );
                })}
              </div>
            </div>
            <Divider className="bg-default-200" />
            <div>
              <label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">Headline</label>
              <Textarea 
                value={editTitle} 
                onValueChange={setEditTitle} 
                onBlur={saveTitle} 
                size="sm" 
              />
            </div>
            <div>
              <label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">Content</label>
              <Textarea 
                value={editContent} 
                onValueChange={setEditContent} 
                onBlur={saveContent} 
                size="sm" 
                minRows={4} 
              />
            </div>
            <Divider className="bg-default-200" />
            <div>
              <label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">Visual</label>
              <div className="space-y-2">
                <Select label="Type" size="sm" defaultSelectedKeys={["chart"]}>
                  <SelectItem key="chart">Chart</SelectItem>
                  <SelectItem key="image">Image</SelectItem>
                  <SelectItem key="icon">Icon</SelectItem>
                  <SelectItem key="diagram">Diagram</SelectItem>
                  <SelectItem key="none">None</SelectItem>
                </Select>
                <Button size="sm" variant="flat" startContent={<Image className="w-4 h-4" />}>Generate Image</Button>
              </div>
            </div>
            <Divider className="bg-default-200" />
            <div>
              <label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">Settings</label>
              <div className="space-y-2">
                <Button size="sm" variant="flat" startContent={currentSlide?.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />} onPress={handleToggleLock}>{currentSlide?.isLocked ? "Unlock Slide" : "Lock Slide"}</Button>
                <Button size="sm" variant="flat" startContent={<Copy className="w-4 h-4" />} onPress={handleDuplicate}>Duplicate</Button>
                <Button size="sm" variant="flat" className="text-danger" startContent={<Trash2 className="w-4 h-4" />} onPress={handleDelete}>Delete Slide</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>Speaker Notes — Slide {selectedSlide}</ModalHeader>
          <ModalBody>
            <Textarea value={speakerNotes} onChange={(e) => setSpeakerNotes(e.target.value)} minRows={6} className="w-full" placeholder="Add speaker notes for this slide..." />
            <div className="flex items-center gap-2 mt-2"><Sparkles className="w-4 h-4 text-primary" /><Button size="sm" variant="light" className="text-primary">Generate speaker notes</Button></div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>Close</Button>
            <Button color="primary" onPress={handleSaveNotes}>Save Notes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
