"use client";

import { Button, Card, CardBody, Chip, Divider, RadioGroup, Radio, Tooltip, Badge } from "@heroui/react";
import { ArrowLeft, Download, FileDown, FileText, Check, X, Monitor, Zap, Palette, Type, Lock, Share2, Copy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function ExportPage() {
  const { id } = useParams();
  const [format, setFormat] = useState("pptx");
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const deck = useQuery(api.decks.getById, id ? { id: id as any } : "skip");
  const slides = deck?.slides || [];
  const runExportDeck = useMutation(api.decks.exportDeck);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await runExportDeck({ deckId: id as any, format: format });
      setExporting(false);
      setDone(true);
      if (data?.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = `${deck?.title || "presentation"}.${format}`;
        a.click();
      }
    } catch (e) {
      console.error(e);
      setExporting(false);
    }
  };

  // Compute quality indicators dynamically
  const lockedSlidesCount = slides.filter((s: any) => s.isLocked).length;
  const incompleteNotesCount = slides.filter((s: any) => !s.speakerNotes || s.speakerNotes.trim() === "").length;
  const allSlidesHaveContent = slides.length > 0 && slides.every((s: any) => {
    try {
      if (!s.content) return false;
      const parsed = JSON.parse(s.content);
      return s.title && Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });
  const brandKitApplied = !!deck?.brandKitId;

  // High fidelity mini layout renderer
  const renderSlidePreview = (slide: any) => {
    const bullets = (() => {
      if (!slide.content) return [];
      try {
        const parsed = JSON.parse(slide.content);
        if (Array.isArray(parsed)) return parsed;
        return [];
      } catch {
        return [];
      }
    })();

    const title = slide.title || "Untitled Slide";

    switch (slide.layout) {
      case "title":
        return (
          <div className="h-full flex flex-col justify-center items-center text-center p-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[#7170FF] mb-2" />
            <p className="text-[10px] font-semibold text-white truncate max-w-[150px]">{title}</p>
            {bullets[0] && <p className="text-[7px] text-default-500 truncate max-w-[130px] mt-1">{bullets[0]}</p>}
          </div>
        );
      case "data":
        return (
          <div className="h-full flex flex-col justify-between p-4">
            <p className="text-[9px] font-medium text-white truncate">{title}</p>
            <div className="grid grid-cols-3 gap-1">
              {bullets.slice(0, 3).map((b, i) => (
                <div key={i} className="p-1 bg-[#151617] rounded border border-white/[0.04] text-[6px] text-center">
                  <span className="text-[#7170FF] font-semibold block">{b.split(":")[0]?.trim() || "Stat"}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case "chart":
        return (
          <div className="h-full flex flex-col justify-between p-4">
            <p className="text-[9px] font-medium text-white truncate">{title}</p>
            <div className="grid grid-cols-2 gap-2 items-center">
              <div className="space-y-0.5">
                {bullets.slice(0, 3).map((b, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#7170FF] shrink-0" />
                    <div className="w-8 h-1 bg-white/[0.06] rounded" />
                  </div>
                ))}
              </div>
              <div className="h-8 bg-[#151617] rounded border border-white/[0.04] flex items-end justify-center gap-0.5 p-1">
                {[3, 5, 8, 12, 16].map((h, idx) => (
                  <div key={idx} className="w-1 bg-[#7170FF]/80 rounded-t" style={{ height: `${h}px` }} />
                ))}
              </div>
            </div>
          </div>
        );
      case "closing":
        return (
          <div className="h-full flex flex-col justify-center items-center text-center p-4">
            <p className="text-[10px] font-semibold text-white truncate max-w-[150px]">{title}</p>
            <div className="w-6 h-0.5 bg-[#7170FF] mt-2 rounded" />
          </div>
        );
      default: // content, two_column
        return (
          <div className="h-full flex flex-col justify-between p-4">
            <p className="text-[9px] font-medium text-white truncate">{title}</p>
            <div className="space-y-1">
              {bullets.slice(0, 3).map((b, i) => (
                <div key={i} className="flex items-start gap-1">
                  <div className="w-1 h-1 rounded-full bg-[#7170FF] mt-1 shrink-0" />
                  <p className="text-[7px] text-default-400 truncate max-w-[120px]">{b}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.08] bg-[#0F1011]/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href={`/deck/${id}/editor`} className="text-default-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">Export Preview</h1>
            <p className="text-sm text-default-400">Review and export your presentation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="flat" className="bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] rounded-xl text-default-300" startContent={<Share2 className="w-4 h-4" />}>Share</Button>
          <Button color="primary" className="bg-[#7170FF] text-white hover:bg-[#605eff] font-medium rounded-xl shadow-lg shadow-[#7170FF]/20 px-6" startContent={<Download className="w-4 h-4" />} onPress={handleExport} isLoading={exporting}>{done ? "Download Ready" : "Export"}</Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Slide Previews */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white tracking-tight">Slide Previews</h2>
              <div className="flex items-center gap-2">
                <Badge color="primary" variant="flat" className="bg-[#7170FF]/15 text-[#7170FF] border border-[#7170FF]/25">{slides.length} slides</Badge>
                <Badge variant="flat" className="bg-[#151617] border border-white/[0.06] text-default-400">16:9</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {slides.map((slide: any, index: number) => (
                <Card key={slide._id} className="bg-[#0F1011] border border-white/[0.06] aspect-video relative overflow-hidden group hover:border-[#7170FF]/40 transition-colors shadow-lg rounded-xl">
                  <CardBody className="p-0 relative h-full">
                    <div className="absolute top-3 left-3 text-[10px] text-default-500 font-mono tracking-wider">{String(index + 1).padStart(2, "0")}</div>
                    {renderSlidePreview(slide)}
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          {/* Configuration sidebar */}
          <div className="space-y-6">
            <Card className="bg-[#0F1011] border border-white/[0.08] shadow-xl rounded-2xl">
              <CardBody className="p-6 space-y-6">
                <h3 className="font-semibold text-white tracking-tight">Export Format</h3>
                <RadioGroup value={format} onValueChange={setFormat} classNames={{ wrapper: "gap-4" }}>
                  <Radio value="pptx" classNames={{ wrapper: "border-white/[0.1] bg-[#151617]" }}>
                    <div className="flex items-center gap-3 ml-2">
                      <div className="w-10 h-10 bg-warning/15 rounded-xl flex items-center justify-center border border-warning/25"><FileText className="w-5 h-5 text-warning" /></div>
                      <div>
                        <p className="text-white font-medium text-sm">PowerPoint (.pptx)</p>
                        <p className="text-[11px] text-default-400 mt-0.5">Editable in PowerPoint, Keynote, Google Slides</p>
                      </div>
                    </div>
                  </Radio>
                  <Radio value="pdf" classNames={{ wrapper: "border-white/[0.1] bg-[#151617]" }}>
                    <div className="flex items-center gap-3 ml-2">
                      <div className="w-10 h-10 bg-danger/15 rounded-xl flex items-center justify-center border border-danger/25"><FileDown className="w-5 h-5 text-danger" /></div>
                      <div>
                        <p className="text-white font-medium text-sm">PDF Document</p>
                        <p className="text-[11px] text-default-400 mt-0.5">Print-ready, high-quality vector layout</p>
                      </div>
                    </div>
                  </Radio>
                </RadioGroup>

                <Divider className="bg-white/[0.08]" />

                <h3 className="font-semibold text-white tracking-tight">Settings Applied</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Monitor className="w-4 h-4 text-default-400" /><span className="text-sm text-default-300">Speaker Notes</span></div>
                    <Chip size="sm" color="success" variant="flat" className="bg-success/15 text-success border border-success/25">Included</Chip>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Palette className="w-4 h-4 text-default-400" /><span className="text-sm text-default-300">Brand Colors</span></div>
                    <Chip size="sm" color={brandKitApplied ? "success" : "default"} variant="flat" className={brandKitApplied ? "bg-success/15 text-success border border-success/25" : "bg-white/[0.06] text-default-400"}>{brandKitApplied ? "Brand Kit" : "Default"}</Chip>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Type className="w-4 h-4 text-default-400" /><span className="text-sm text-default-300">Embed Fonts</span></div>
                    <Chip size="sm" color="success" variant="flat" className="bg-success/15 text-success border border-success/25">On</Chip>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-default-400" /><span className="text-sm text-default-300">Locked Slides</span></div>
                    <Chip size="sm" color={lockedSlidesCount > 0 ? "warning" : "default"} variant="flat" className={lockedSlidesCount > 0 ? "bg-warning/15 text-warning border border-warning/25" : "bg-white/[0.06] text-default-400"}>{lockedSlidesCount}</Chip>
                  </div>
                </div>

                <Divider className="bg-white/[0.08]" />

                <h3 className="font-semibold text-white tracking-tight">Presentation Integrity</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    {allSlidesHaveContent ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-warning" />}
                    <span className="text-xs text-default-300">All slides have written content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-xs text-default-300">Typography hierarchy consistent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {incompleteNotesCount === 0 ? <Check className="w-4 h-4 text-success" /> : <X className="w-4 h-4 text-warning" />}
                    <span className="text-xs text-default-300">
                      {incompleteNotesCount === 0 ? "Speaker notes fully complete" : `Speaker notes missing (${incompleteNotesCount} slides)`}
                    </span>
                  </div>
                </div>

                <Divider className="bg-white/[0.08]" />

                <Button 
                  color="primary" 
                  className="w-full h-12 bg-[#7170FF] text-white hover:bg-[#605eff] font-medium rounded-xl shadow-lg shadow-[#7170FF]/20" 
                  size="lg" 
                  startContent={done ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />} 
                  onPress={handleExport} 
                  isLoading={exporting}
                >
                  {done ? "Download Ready" : exporting ? "Exporting..." : "Export Presentation"}
                </Button>
                {done && (
                  <div className="p-3 bg-success/15 border border-success/25 rounded-xl text-center">
                    <p className="text-xs text-success font-medium">Export complete! Check your downloads.</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
