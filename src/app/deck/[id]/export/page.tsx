"use client";

import { Button, Card, CardBody, Chip, Divider, RadioGroup, Radio, Tooltip, Badge } from "@heroui/react";
import { ArrowLeft, Download, FileDown, FileText, Check, X, Sparkles, Shield, Monitor, Eye, Zap, Layers, Palette, Type, Lock, Share2, Copy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

export default function ExportPage() {
  const { id } = useParams();
  const [format, setFormat] = useState("pptx");
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const deck = useQuery(api.decks.getById, id ? { id: id as any } : "skip");

  const getSlideCount = (c1Response?: string) => {
    if (!c1Response) return 0;
    const parts = c1Response.split(/\n---\s*\n/);
    return parts.length;
  };

  const slideCount = deck?.c1Response ? getSlideCount(deck.c1Response) : (deck?.slides?.length || 0);

  const handleExportAsPPTX = async ({ exportParams, title }: { exportParams: string; title: string }) => {
    setExporting(true);
    try {
      const response = await fetch("/api/export-pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exportParams }),
      });
      if (!response.ok) {
        throw new Error("Failed to download PPTX.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = (title || deck?.title || "presentation").replace(/\.pptx$/i, "");
      a.download = `${filename}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setDone(true);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportClick = () => {
    alert("Click the Download/Export icon on the slide preview to download your PPTX presentation!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-between px-8 py-4 border-b border-divider bg-content1/50">
        <div className="flex items-center gap-4">
          <Link href={`/deck/${id}/editor`} className="text-default-400 hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Export Preview</h1>
            <p className="text-sm text-default-400">Review and export your presentation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="flat" startContent={<Share2 className="w-4 h-4" />}>
            Share
          </Button>
          <Button
            color="primary"
            startContent={<Download className="w-4 h-4" />}
            onPress={handleExportClick}
            isLoading={exporting}
          >
            {done ? "Download Ready" : "Export"}
          </Button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Slide Preview</h2>
              <div className="flex items-center gap-2">
                <Badge color="primary" variant="flat" className="bg-primary/20 text-primary">
                  {slideCount} slides
                </Badge>
                <Badge variant="flat" className="bg-content2 text-default-400">
                  16:9
                </Badge>
              </div>
            </div>
            <div className="bg-content1 rounded-xl border border-default shadow-2xl p-6 min-h-[500px] flex items-center justify-center">
              {deck?.c1Response ? (
                <div className="w-full h-full">
                  <ThemeProvider>
                    <C1Component
                      c1Response={deck.c1Response}
                      isStreaming={false}
                      exportAsPPTX={handleExportAsPPTX}
                    />
                  </ThemeProvider>
                </div>
              ) : (
                <div className="text-center p-20 text-default-400 flex flex-col items-center">
                  <Sparkles className="w-12 h-12 text-default-300 mb-4 animate-pulse" />
                  <p className="text-default-400">Loading slide preview...</p>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <Card className="bg-content1 border border-default">
              <CardBody className="p-5 space-y-5">
                <h3 className="font-semibold text-foreground">Export Format</h3>
                <RadioGroup value={format} onValueChange={setFormat}>
                  <Radio value="pptx">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">PowerPoint (.pptx)</p>
                        <p className="text-xs text-default-400">Editable in PowerPoint, Google Slides, Keynote</p>
                      </div>
                    </div>
                  </Radio>
                  <Radio value="pdf">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-danger/20 rounded-lg flex items-center justify-center">
                        <FileDown className="w-5 h-5 text-danger" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">PDF</p>
                        <p className="text-xs text-default-400">Print-ready, high-quality vector output</p>
                      </div>
                    </div>
                  </Radio>
                </RadioGroup>
                <Divider className="bg-default-200" />
                <h3 className="font-semibold text-foreground">Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-default-400" />
                      <span className="text-sm text-default-300">Speaker Notes</span>
                    </div>
                    <Chip size="sm" color="success" variant="flat">
                      On
                    </Chip>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-default-400" />
                      <span className="text-sm text-default-300">Brand Colors</span>
                    </div>
                    <Chip size="sm" color="success" variant="flat">
                      On
                    </Chip>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-default-400" />
                      <span className="text-sm text-default-300">Embed Fonts</span>
                    </div>
                    <Chip size="sm" color="success" variant="flat">
                      On
                    </Chip>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-default-400" />
                      <span className="text-sm text-default-300">Locked Slides</span>
                    </div>
                    <Chip size="sm" color="warning" variant="flat">
                      3
                    </Chip>
                  </div>
                </div>
                <Divider className="bg-default-200" />
                <h3 className="font-semibold text-foreground">Quality Check</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm text-default-300">All slides have content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm text-default-300">Brand kit applied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm text-default-300">Typography consistent</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-warning" />
                    <span className="text-sm text-default-300">Speaker notes incomplete (3 slides)</span>
                  </div>
                </div>
                <Divider className="bg-default-200" />
                <div className="p-3 bg-content2 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-default-400">Estimated file size</span>
                    <span className="text-sm text-foreground font-medium">2.4 MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-default-400">Slides</span>
                    <span className="text-sm text-foreground font-medium">{slideCount}</span>
                  </div>
                </div>
                <Button
                  color="primary"
                  className="w-full"
                  size="lg"
                  startContent={done ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                  onPress={handleExportClick}
                  isLoading={exporting}
                >
                  {done ? "Download Ready" : exporting ? "Exporting..." : "Export Presentation"}
                </Button>
                {done && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded-lg text-center">
                    <p className="text-sm text-success font-medium">Export complete!</p>
                    <p className="text-xs text-default-400 mt-1">Your file is ready for download</p>
                  </div>
                )}
              </CardBody>
            </Card>
            <Card className="bg-content1 border border-default">
              <CardBody className="p-5">
                <h3 className="font-semibold text-foreground mb-3">Share</h3>
                <div className="space-y-2">
                  <Button size="sm" variant="flat" startContent={<Copy className="w-4 h-4" />}>
                    Copy Link
                  </Button>
                  <Button size="sm" variant="flat" startContent={<Share2 className="w-4 h-4" />}>
                    Email to Team
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

