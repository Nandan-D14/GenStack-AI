"use client";

import { Button, Card, CardBody, Input, Tabs, Tab, Textarea } from "@heroui/react";
import { Wand2, FileText, Globe, List, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import FileUploader from "../../../components/FileUploader";

export default function NewDeckPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const runCreateDeck = useMutation(api.decks.create);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newDeckId = await runCreateDeck({
        title: prompt.slice(0, 60) || "New Presentation",
        type: "pitch",
        tone: "formal",
      });
      router.push(`/deck/${newDeckId}/outline`);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-8 py-4 border-b border-divider">
        <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /><span className="font-semibold text-foreground">New Presentation</span></div>
        <Link href="/dashboard" className="text-sm text-default-400 hover:text-foreground">Cancel</Link>
      </div>
      <div className="max-w-3xl mx-auto pt-16 px-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">What are you building?</h1>
        <p className="text-default-400 mb-10">Start with a prompt, upload notes, or paste a link.</p>
        <Tabs aria-label="Input options" color="primary" variant="underlined">
          <Tab key="prompt" title={<div className="flex items-center gap-2"><Wand2 className="w-4 h-4" />Prompt</div>}>
            <Card className="bg-content1 border border-default mt-4">
              <CardBody className="p-6">
                <Textarea label="Describe your presentation" placeholder="e.g. Create a pitch deck for an AI wardrobe startup for investors." value={prompt} onChange={(e) => setPrompt(e.target.value)} minRows={5} className="mb-4" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-xs text-default-500 bg-content2 px-2 py-1 rounded-full">Startup Pitch</span>
                    <span className="text-xs text-default-500 bg-content2 px-2 py-1 rounded-full">Sales Deck</span>
                    <span className="text-xs text-default-500 bg-content2 px-2 py-1 rounded-full">Report</span>
                  </div>
                  <Button color="primary" endContent={<ArrowRight className="w-4 h-4" />} onPress={handleGenerate} isLoading={isGenerating}>Generate Outline</Button>
                </div>
              </CardBody>
            </Card>
          </Tab>
          <Tab key="upload" title={<div className="flex items-center gap-2"><FileText className="w-4 h-4" />Upload</div>}>
            <Card className="bg-content1 border border-default mt-4">
              <CardBody className="p-6">
                <FileUploader
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                  maxSizeMB={10}
                  onFileUploaded={(storageId, fileName) => {
                    console.log("File uploaded:", fileName, storageId);
                  }}
                />
                <Textarea placeholder="Or paste your meeting notes, bullet points, or raw content here..." minRows={4} className="text-left mt-4" />
                <Button color="primary" className="mt-4" onPress={handleGenerate}>Convert to Slides</Button>
              </CardBody>
            </Card>
          </Tab>
          <Tab key="url" title={<div className="flex items-center gap-2"><Globe className="w-4 h-4" />URL</div>}>
            <Card className="bg-content1 border border-default mt-4">
              <CardBody className="p-6">
                <Input label="Website URL" placeholder="https://example.com" className="mb-4" />
                <Button color="primary" onPress={handleGenerate}>Extract & Generate</Button>
              </CardBody>
            </Card>
          </Tab>
          <Tab key="notes" title={<div className="flex items-center gap-2"><List className="w-4 h-4" />Notes</div>}>
            <Card className="bg-content1 border border-default mt-4">
              <CardBody className="p-6">
                <Textarea label="Your bullet points" placeholder="- Problem: ...&#10;- Solution: ...&#10;- Market: ..." minRows={8} className="mb-4" />
                <Button color="primary" onPress={handleGenerate}>Structure into Slides</Button>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
