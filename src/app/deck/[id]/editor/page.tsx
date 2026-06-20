"use client";

import { Button, Card, CardBody, Chip, Tooltip, Divider, Badge, Avatar, AvatarGroup, Input, Textarea, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { ArrowLeft, ArrowRight, Undo2, Redo2, Download, Share2, Sparkles, Lock, Unlock, Copy, Trash2, Image, LayoutTemplate, Type, MessageSquare, Plus, ChevronLeft, ChevronRight, Monitor, Wand2, Zap, BarChart3, Lightbulb, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const layoutIcons: Record<string, any> = { title: Lightbulb, content: Type, data: BarChart3, chart: TrendingUp, diagram: Zap, comparison: Users, quote: MessageSquare, closing: Monitor };

export default function EditorPage() {
  const { id } = useParams();
  const [selectedSlide, setSelectedSlide] = useState(1);
  const [regenerating, setRegenerating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [speakerNotes, setSpeakerNotes] = useState("Welcome investors. Today we're going to show you how AI is about to transform the $890 billion fashion industry.");

  const deck = useQuery(api.decks.getById, id ? { id: id as any } : "skip");
  const slides = deck?.slides || [];
  const currentSlide = slides.find((s: any) => s.order === selectedSlide - 1) || slides[0];

  const runRegenerateSlide = useMutation(api.slides.regenerateSlide);

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

  const toggleLock = (slideId: string) => {
    // Implementation would go here
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
            <Button isIconOnly size="sm" variant="light"><Plus className="w-3 h-3 text-default-400" /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {slides.map((slide: any, idx: number) => {
              const Icon = layoutIcons[slide.layout] || Type;
              const isActive = idx + 1 === selectedSlide;
              return (
                <div key={slide._id} onClick={() => setSelectedSlide(idx + 1)} className={`relative p-2 rounded-lg cursor-pointer transition-colors border ${isActive ? "bg-primary/10 border-primary/30" : "bg-content2/50 border-default hover:border-default-200"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-default-500 w-4">{idx + 1}</span>
                    <div className="w-10 h-6 bg-content3 rounded flex items-center justify-center"><Icon className="w-3 h-3 text-default-400" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs text-foreground truncate">{slide.title}</p></div>
                    <div className="flex items-center gap-1">
                      {slide.isLocked && <Lock className="w-3 h-3 text-warning" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-4xl aspect-video bg-content1 rounded-xl border border-default shadow-2xl p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />
              <div className="absolute top-6 left-6 flex items-center gap-2"><div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center"><Zap className="w-3 h-3 text-foreground" /></div><span className="text-xs text-default-500 font-medium">StyleAI</span></div>
              <div className="absolute bottom-6 right-6 text-xs text-default-500">{selectedSlide} / {slides.length}</div>
              <div className="relative z-10 h-full flex flex-col justify-center">
                {currentSlide?.layout === "title" && (
                  <div className="text-center">
                    <Chip className="bg-primary/20 text-primary mb-6" size="sm">StyleAI</Chip>
                    <h1 className="text-5xl font-bold text-foreground leading-tight mb-6">The Future of Fashion is AI</h1>
                    <p className="text-xl text-default-400 max-w-2xl mx-auto">Your personal AI stylist that knows your taste, your wardrobe, and the occasion</p>
                    <div className="mt-10 flex justify-center gap-4">
                      <div className="px-4 py-2 bg-content2 rounded-lg text-sm text-default-300">500K+ Users</div>
                      <div className="px-4 py-2 bg-content2 rounded-lg text-sm text-default-300">$2M ARR</div>
                      <div className="px-4 py-2 bg-content2 rounded-lg text-sm text-default-300">4.9 Rating</div>
                    </div>
                  </div>
                )}
                {currentSlide?.layout === "content" && (
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-bold text-foreground mb-8">{currentSlide.title}</h2>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-primary mt-2.5" /><p className="text-lg text-default-300">67% of people say they have &quot;nothing to wear&quot; despite a full closet</p></div>
                      <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-primary mt-2.5" /><p className="text-lg text-default-300">Average person spends 17 minutes deciding what to wear each morning</p></div>
                      <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full bg-primary mt-2.5" /><p className="text-lg text-default-300">Returns cost retailers $550B annually — 40% driven by poor fit</p></div>
                    </div>
                  </div>
                )}
                {currentSlide?.layout === "data" && (
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-bold text-foreground mb-8">{currentSlide.title}</h2>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="p-6 bg-content2/50 rounded-xl border border-default"><p className="text-4xl font-bold text-primary">$890B</p><p className="text-sm text-default-400 mt-2">Global Fashion Market</p></div>
                      <div className="p-6 bg-content2/50 rounded-xl border border-default"><p className="text-4xl font-bold text-warning">40%</p><p className="text-sm text-default-400 mt-2">E-commerce Return Rate</p></div>
                      <div className="p-6 bg-content2/50 rounded-xl border border-default"><p className="text-4xl font-bold text-success">$550B</p><p className="text-sm text-default-400 mt-2">Annual Return Costs</p></div>
                    </div>
                  </div>
                )}
                {currentSlide?.layout === "chart" && (
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-bold text-foreground mb-8">{currentSlide.title}</h2>
                    <div className="h-48 bg-content2/30 rounded-xl border border-default flex items-end p-4 gap-3">
                      {[40, 65, 85, 120, 180, 240, 310].map((h, i) => (<div key={i} className="flex-1 flex flex-col items-center gap-2"><div className="w-full bg-primary/60 rounded-t-lg" style={{ height: `${h}px` }} /><span className="text-xs text-default-500">Q{i + 1}</span></div>))}
                    </div>
                    <div className="flex justify-between mt-4 text-sm text-default-400"><span>Users: 500K</span><span>MoM Growth: 34%</span><span>Retention: 89%</span></div>
                  </div>
                )}
                {currentSlide?.layout === "closing" && (
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-foreground mb-6">The Ask: $2M Seed</h2>
                    <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
                      <div className="p-5 bg-content2/50 rounded-xl border border-default"><p className="text-2xl font-bold text-primary">$2M</p><p className="text-sm text-default-400">Raise</p></div>
                      <div className="p-5 bg-content2/50 rounded-xl border border-default"><p className="text-2xl font-bold text-success">18mo</p><p className="text-sm text-default-400">Runway</p></div>
                      <div className="p-5 bg-content2/50 rounded-xl border border-default"><p className="text-2xl font-bold text-warning">$10M</p><p className="text-sm text-default-400">Series A Target</p></div>
                    </div>
                    <p className="text-lg text-default-400">Contact: founders@styleai.com</p>
                  </div>
                )}
                {!["title", "content", "data", "chart", "closing"].includes(currentSlide?.layout) && (
                  <div className="max-w-3xl"><h2 className="text-3xl font-bold text-foreground mb-4">{currentSlide?.title}</h2><p className="text-lg text-default-400">Content for this slide would be generated here.</p></div>
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
              <Button variant="flat" size="sm" startContent={<Monitor className="w-4 h-4" />}>Present</Button>
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
                <Button size="sm" className="w-full bg-primary/20 text-primary border border-primary/30" startContent={<Sparkles className="w-4 h-4" />} onPress={handleRegenerate} isLoading={regenerating}>Regenerate Slide</Button>
                <Button size="sm" variant="flat" startContent={<Wand2 className="w-4 h-4" />}>Change Tone</Button>
                <Button size="sm" variant="flat" startContent={<Type className="w-4 h-4" />}>Expand / Shorten</Button>
              </div>
            </div>
            <Divider className="bg-default-200" />
            <div>
              <label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">Layout</label>
              <div className="grid grid-cols-2 gap-2">
                {["Title", "Content", "Two Col", "Data", "Chart", "Quote"].map((l) => (
                  <div key={l} className={`p-2 rounded-lg border text-center text-xs cursor-pointer transition-colors ${l.toLowerCase() === currentSlide?.layout ? "border-primary/50 bg-primary/10 text-primary" : "border-default bg-content2 text-default-400 hover:border-default-200"}`}>
                    <LayoutTemplate className="w-4 h-4 mx-auto mb-1" />{l}
                  </div>
                ))}
              </div>
            </div>
            <Divider className="bg-default-200" />
            <div><label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">Headline</label><Textarea defaultValue={currentSlide?.title} size="sm" /></div>
            <div><label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">Content</label><Textarea defaultValue="- Key point one\n- Key point two\n- Key point three" size="sm" minRows={4} /></div>
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
                <Button size="sm" variant="flat" startContent={currentSlide?.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}>{currentSlide?.isLocked ? "Unlock Slide" : "Lock Slide"}</Button>
                <Button size="sm" variant="flat" startContent={<Copy className="w-4 h-4" />}>Duplicate</Button>
                <Button size="sm" variant="flat" className="text-danger" startContent={<Trash2 className="w-4 h-4" />}>Delete Slide</Button>
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
          <ModalFooter><Button variant="flat" onPress={onClose}>Close</Button><Button color="primary" onPress={onClose}>Save Notes</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
