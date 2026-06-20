"use client";

import { Button, Card, CardBody, Badge, Chip, Divider, RadioGroup, Radio, Input } from "@heroui/react";
import { ArrowLeft, ArrowRight, Sparkles, LayoutTemplate, Type, Lightbulb, Target, TrendingUp, Shield, BarChart3, UserCircle, Layers, Lock, Globe, DollarSign, Rocket, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

const typeIcons: Record<string, any> = { title: Lightbulb, content: Type, data: BarChart3, chart: TrendingUp, diagram: Layers, comparison: Shield, quote: UserCircle, closing: Target };

export default function OutlinePage() {
  const { id } = useParams();
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [isGenerating, setIsGenerating] = useState(false);

  const deck = useQuery(api.decks.getById, id ? { id: id as any } : "skip");
  const runGenerateOutline = useMutation(api.decks.generateOutline);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await runGenerateOutline({ deckId: id as any, prompt: deck?.title || "presentation" });
      router.push(`/deck/${id}/editor`);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  const outline = deck?.slides?.length ? [
    { section: "Hook", slides: deck.slides.slice(0, 1) },
    { section: "Problem", slides: deck.slides.slice(1, 3) },
    { section: "Solution", slides: deck.slides.slice(3, 6) },
    { section: "Traction", slides: deck.slides.slice(6, 9) },
    { section: "Business Model", slides: deck.slides.slice(9, 11) },
    { section: "Team & Ask", slides: deck.slides.slice(11, 13) },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-8 py-4 border-b border-divider bg-content1/50">
        <div className="flex items-center gap-4">
          <Link href="/deck/new" className="text-default-400 hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{deck?.title || "Loading..."}</h1>
            <p className="text-sm text-default-400">Review the outline before generating slides</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="primary" variant="flat" className="bg-primary/20 text-primary">{deck?.slides?.length || 0} slides</Badge>
          <Badge color="secondary" variant="flat" className="bg-content2 text-default-400">{deck?.type || "pitch"}</Badge>
          <Button color="primary" endContent={<ArrowRight className="w-4 h-4" />} onPress={handleGenerate} isLoading={isGenerating}>Generate Slides</Button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Deck Outline</h2>
              <Button variant="flat" size="sm" startContent={<Sparkles className="w-4 h-4" />}>Refine with AI</Button>
            </div>
            {outline.map((section, si) => (
              <div key={section.section}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><span className="text-sm font-bold text-primary">{si + 1}</span></div>
                  <h3 className="font-semibold text-foreground">{section.section}</h3>
                  <Chip size="sm" variant="flat" className="bg-content2 text-default-400">{section.slides?.length || 0} slides</Chip>
                </div>
                <div className="space-y-2 ml-10">
                  {section.slides?.map((slide: any) => {
                    const Icon = typeIcons[slide.layout] || Type;
                    return (
                      <Card key={slide._id} className="bg-content1 border border-default hover:border-default-200 transition-colors">
                        <CardBody className="p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-content2 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-default-400" /></div>
                          <div className="flex-1"><p className="text-sm font-medium text-foreground">{slide.title}</p><p className="text-xs text-default-500 capitalize">{slide.layout} layout</p></div>
                          <Button isIconOnly variant="light" size="sm"><Lock className="w-3 h-3 text-default-500" /></Button>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <Card className="bg-content1 border border-default">
              <CardBody className="p-5 space-y-5">
                <h3 className="font-semibold text-foreground">Deck Settings</h3>
                <div>
                  <label className="text-sm text-default-400 mb-2 block">Style</label>
                  <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
                    <Radio value="modern"><div className="flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-primary" />Modern & Clean</div></Radio>
                    <Radio value="bold"><div className="flex items-center gap-2"><Rocket className="w-4 h-4 text-warning" />Bold & Dynamic</div></Radio>
                    <Radio value="minimal"><div className="flex items-center gap-2"><Type className="w-4 h-4 text-default-400" />Minimalist</div></Radio>
                    <Radio value="premium"><div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-success" />Premium Corporate</div></Radio>
                  </RadioGroup>
                </div>
                <Divider className="bg-default-200" />
                <div><label className="text-sm text-default-400 mb-2 block">Audience</label><Input defaultValue="Seed-stage investors, VCs" /></div>
                <div><label className="text-sm text-default-400 mb-2 block">Tone</label><div className="flex flex-wrap gap-2">{["Formal", "Persuasive", "Casual", "Technical"].map((t) => (<Chip key={t} size="sm" variant={t === "Persuasive" ? "solid" : "flat"} color={t === "Persuasive" ? "primary" : "default"}>{t}</Chip>))}</div></div>
                <Divider className="bg-default-200" />
                <div><label className="text-sm text-default-400 mb-2 block">Brand Kit</label><div className="flex items-center gap-3 p-3 bg-content2 rounded-lg"><div className="w-8 h-8 rounded bg-primary flex items-center justify-center"><Globe className="w-4 h-4 text-foreground" /></div><div><p className="text-sm text-foreground">StyleAI Brand</p><p className="text-xs text-default-500">Primary + Secondary</p></div><CheckCircle2 className="w-4 h-4 text-success ml-auto" /></div></div>
              </CardBody>
            </Card>
            <Card className="bg-content1 border border-default">
              <CardBody className="p-5">
                <h3 className="font-semibold text-foreground mb-3">Story Flow</h3>
                <div className="space-y-3">
                  {outline.map((s, i) => (<div key={s.section} className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</div><span className="text-sm text-default-300">{s.section}</span><span className="text-xs text-default-500 ml-auto">{s.slides?.length || 0} slides</span></div>))}
                </div>
                <div className="mt-4 p-3 bg-content2 rounded-lg">
                  <p className="text-xs text-default-400">Estimated duration: <span className="text-foreground font-medium">8 minutes</span></p>
                  <p className="text-xs text-default-400 mt-1">Recommended for: <span className="text-foreground">Seed pitch</span></p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
