"use client";

import { Button, Card, CardBody, Divider, Badge, Input, Textarea } from "@heroui/react";
import { ArrowLeft, Sparkles, Download } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import "@crayonai/react-ui/styles/index.css";

export default function EditorPage() {
  const { id } = useParams();
  const [generateStarted, setGenerateStarted] = useState(false);
  const [generationDsl, setGenerationDsl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const deck = useQuery(api.decks.getById, id ? { id: id as any } : "skip");
  const runUpdateC1Data = useMutation(api.decks.updateC1Data);

  // Check if we need to auto-generate
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const shouldGenerate = searchParams.get("generate") === "true";
      if (shouldGenerate && deck && !deck.c1Response && !generateStarted) {
        setGenerateStarted(true);
        triggerGeneration();
      }
    }
  }, [deck, generateStarted]);

  const triggerGeneration = async () => {
    if (!deck) return;
    setIsGenerating(true);
    setGenerationDsl("");
    try {
      const response = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: deck.title,
          deckId: id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate slides");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        accumulated += chunk;
        setGenerationDsl(accumulated);
      }

      // Save to Convex
      await runUpdateC1Data({
        id: id as any,
        c1Response: accumulated,
        c1ArtifactId: id as string,
      });

      // Clear query params
      window.history.replaceState({}, "", `/deck/${id}/editor`);
    } catch (e: any) {
      console.error("Error generating slides:", e);
      alert(`Slide generation failed: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptEdit = async () => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    const currentDsl = deck?.c1Response || generationDsl;
    setGenerationDsl(currentDsl);
    try {
      const response = await fetch("/api/edit-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          c1Response: currentDsl,
          prompt: editPrompt,
          deckId: id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to edit slides");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        accumulated += chunk;
        setGenerationDsl(accumulated);
      }

      // Save to Convex
      await runUpdateC1Data({
        id: id as any,
        c1Response: accumulated,
      });
      setEditPrompt("");
    } catch (e: any) {
      console.error("Error editing slides:", e);
      alert(`AI slide edit failed: ${e.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  const handleUpdateMessage = async (updatedDsl: string) => {
    try {
      await runUpdateC1Data({
        id: id as any,
        c1Response: updatedDsl,
      });
    } catch (e) {
      console.error("Error saving manual edit:", e);
    }
  };

  const handlePptxExport = async ({ exportParams, title }: { exportParams: string; title: string }) => {
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
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const displayDsl = isGenerating || isEditing ? generationDsl : (deck?.c1Response || "");

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-divider bg-content1/80">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-default-400 hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Input variant="flat" defaultValue={deck?.title || "Loading..."} className="w-64" size="sm" readOnly />
          <Badge color="primary" variant="flat" className="bg-primary/20 text-primary">
            Draft
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            color="primary"
            size="sm"
            startContent={<Download className="w-4 h-4" />}
            onPress={() => {
              alert("Click the Download/Export icon on the slides to export as PPTX!");
            }}
          >
            Export PPTX
          </Button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-background overflow-y-auto">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-4xl bg-content1 rounded-xl border border-default shadow-2xl p-6 min-h-[550px] flex items-center justify-center">
              {displayDsl ? (
                <div className="w-full h-full">
                  <ThemeProvider>
                    <C1Component
                      c1Response={displayDsl}
                      isStreaming={isGenerating || isEditing}
                      updateMessage={handleUpdateMessage}
                      exportAsPPTX={handlePptxExport}
                    />
                  </ThemeProvider>
                </div>
              ) : (
                <div className="text-center p-20 flex flex-col items-center">
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-12 h-12 text-primary animate-pulse mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Generating Presentation via AI...</h3>
                      <p className="text-default-400 max-w-md">
                        Using TokenRouter's MiniMax-M3 to design the presentation structure, layout, and visual slide style.
                      </p>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-12 h-12 text-default-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Slides Generated Yet</h3>
                      <p className="text-default-400 mb-6">Start slide generation to build your presentation.</p>
                      <Button
                        color="primary"
                        startContent={<Sparkles className="w-4 h-4" />}
                        onPress={triggerGeneration}
                        isLoading={isGenerating}
                      >
                        Generate Slides Now
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Properties */}
        <div className="w-72 bg-content1 border-l border-divider flex flex-col">
          <div className="p-4 border-b border-divider">
            <h3 className="text-sm font-semibold text-foreground">AI Copilot</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
            <div>
              <label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">
                Refine slides with AI
              </label>
              <Textarea
                placeholder="e.g. Add a slide about competitors, change the theme to dark mode..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                minRows={4}
                className="mb-3"
              />
              <Button
                size="sm"
                color="primary"
                className="w-full"
                startContent={<Sparkles className="w-4 h-4" />}
                onPress={handlePromptEdit}
                isLoading={isEditing || isGenerating}
                disabled={!displayDsl}
              >
                Apply AI Edits
              </Button>
            </div>
            <Divider className="bg-default-200" />
            <div>
              <label className="text-xs text-default-500 mb-2 block uppercase tracking-wider">
                Design & Style
              </label>
              <div className="p-3 bg-content2 rounded-lg border border-default text-xs text-default-400">
                The styling, typography, and charts are generated and optimized dynamically by Thesys C1.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
