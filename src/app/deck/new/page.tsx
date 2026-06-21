"use client";

import { Button, Card, CardBody, Input, Tabs, Tab, Textarea, Select, SelectItem } from "@heroui/react";
import { Wand2, FileText, Globe, List, ArrowRight, Zap, Sliders } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function NewDeckPage() {
  const [activeTab, setActiveTab] = useState("prompt");
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [bullets, setBullets] = useState("");
  
  const [deckType, setDeckType] = useState("pitch");
  const [tone, setTone] = useState("formal");
  const [audience, setAudience] = useState("Investors");
  const [isGenerating, setIsGenerating] = useState(false);
  
  const router = useRouter();
  const runCreateDeck = useMutation(api.decks.create);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Get prompt based on active tab
    let fullPrompt = "";
    let displayTitle = "New Presentation";
    
    if (activeTab === "prompt") {
      fullPrompt = prompt;
      displayTitle = prompt.slice(0, 60);
    } else if (activeTab === "upload") {
      fullPrompt = `Convert notes: ${notes}`;
      displayTitle = "Document Presentation";
    } else if (activeTab === "url") {
      fullPrompt = `Extract from URL: ${url}`;
      displayTitle = url.replace(/(^\w+:|^)\/\//, "").slice(0, 40);
    } else if (activeTab === "notes") {
      fullPrompt = `Structure bullets: ${bullets}`;
      displayTitle = "Structured Presentation";
    }
    
    try {
      const newDeckId = await runCreateDeck({
        title: displayTitle || "New Presentation",
        type: deckType,
        tone: tone,
        objective: fullPrompt || "General outline generation",
        audience: audience || undefined
      });
      router.push(`/deck/${newDeckId}/outline`);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/[0.08] bg-[#0F1011]/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#7170FF] rounded-lg flex items-center justify-center shadow-md shadow-[#7170FF]/25">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white tracking-wide">Create Presentation</span>
        </div>
        <Link href="/dashboard" className="text-sm text-default-400 hover:text-white transition-colors">
          Cancel
        </Link>
      </div>

      <div className="max-w-6xl mx-auto pt-12 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white tracking-tight">Create your presentation</h1>
          <p className="text-default-400 mt-2">Enter your ideas or upload source material to start generating slides.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Intake Options */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs 
              aria-label="Input options" 
              color="primary" 
              variant="underlined"
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              classNames={{
                tabList: "border-b border-white/[0.08] gap-6",
                cursor: "bg-[#7170FF]",
                tab: "text-default-400 hover:text-white transition-colors font-medium px-0",
              }}
            >
              <Tab 
                key="prompt" 
                title={
                  <div className="flex items-center gap-2 py-2">
                    <Wand2 className="w-4 h-4" />
                    Prompt
                  </div>
                }
              >
                <Card className="bg-[#0F1011] border border-white/[0.08] mt-4 shadow-xl rounded-2xl">
                  <CardBody className="p-6">
                    <Textarea 
                      label="Describe your presentation" 
                      placeholder="e.g. Create a pitch deck for an AI wardrobe startup for investors." 
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      minRows={6} 
                      classNames={{
                        label: "text-xs font-semibold text-default-400 uppercase tracking-wider mb-2",
                        inputWrapper: "bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] focus-within:!border-[#7170FF]/50 rounded-xl"
                      }}
                    />
                  </CardBody>
                </Card>
              </Tab>

              <Tab 
                key="upload" 
                title={
                  <div className="flex items-center gap-2 py-2">
                    <FileText className="w-4 h-4" />
                    Upload Notes
                  </div>
                }
              >
                <Card className="bg-[#0F1011] border border-white/[0.08] mt-4 shadow-xl rounded-2xl">
                  <CardBody className="p-6 space-y-4">
                    <div className="border border-dashed border-white/[0.08] bg-[#151617]/50 rounded-xl p-8 text-center cursor-pointer hover:bg-[#151617]/80 transition-colors">
                      <FileText className="w-8 h-8 text-default-500 mx-auto mb-3" />
                      <p className="text-white font-medium text-sm">Drop your PDF, DOCX, or TXT file here</p>
                      <p className="text-xs text-default-500 mt-1">Maximum file size 10MB</p>
                    </div>
                    <Textarea 
                      label="Or paste your raw content" 
                      placeholder="Paste your meeting notes, articles, or transcripts here..." 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      minRows={5}
                      classNames={{
                        label: "text-xs font-semibold text-default-400 uppercase tracking-wider mb-2",
                        inputWrapper: "bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] focus-within:!border-[#7170FF]/50 rounded-xl"
                      }}
                    />
                  </CardBody>
                </Card>
              </Tab>

              <Tab 
                key="url" 
                title={
                  <div className="flex items-center gap-2 py-2">
                    <Globe className="w-4 h-4" />
                    Web URL
                  </div>
                }
              >
                <Card className="bg-[#0F1011] border border-white/[0.08] mt-4 shadow-xl rounded-2xl">
                  <CardBody className="p-6">
                    <Input 
                      label="Website URL" 
                      placeholder="https://example.com/about-us" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      classNames={{
                        label: "text-xs font-semibold text-default-400 uppercase tracking-wider mb-2",
                        inputWrapper: "bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] focus-within:!border-[#7170FF]/50 rounded-xl text-white"
                      }}
                    />
                    <p className="text-xs text-default-500 mt-2">GenStack AI will scrape the webpage content and extract key presentation concepts.</p>
                  </CardBody>
                </Card>
              </Tab>

              <Tab 
                key="notes" 
                title={
                  <div className="flex items-center gap-2 py-2">
                    <List className="w-4 h-4" />
                    Outline Notes
                  </div>
                }
              >
                <Card className="bg-[#0F1011] border border-white/[0.08] mt-4 shadow-xl rounded-2xl">
                  <CardBody className="p-6">
                    <Textarea 
                      label="Your bullet outline" 
                      placeholder="- Topic: Market Disruption&#10;- Subtopic: Customer pain points&#10;- Solutions: Automated AI models" 
                      value={bullets} 
                      onChange={(e) => setBullets(e.target.value)} 
                      minRows={6}
                      classNames={{
                        label: "text-xs font-semibold text-default-400 uppercase tracking-wider mb-2",
                        inputWrapper: "bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] focus-within:!border-[#7170FF]/50 rounded-xl text-white"
                      }}
                    />
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </div>

          {/* Right Column: Shared Settings & Submit */}
          <div className="space-y-6">
            <Card className="bg-[#0F1011] border border-white/[0.08] shadow-xl rounded-2xl">
              <CardBody className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-[#7170FF]">
                  <Sliders className="w-4 h-4" />
                  <h3 className="font-semibold text-white tracking-wide text-sm">Deck Configurations</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-default-500 uppercase tracking-wider block mb-2">Deck Type</label>
                    <Select 
                      aria-label="Deck Type"
                      selectedKeys={[deckType]} 
                      onSelectionChange={(keys) => setDeckType(Array.from(keys)[0] as string)}
                      size="sm"
                      classNames={{
                        trigger: "bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] rounded-xl text-white"
                      }}
                    >
                      <SelectItem key="pitch" className="text-white bg-[#0F1011] hover:bg-[#151617]">Startup Pitch Deck</SelectItem>
                      <SelectItem key="sales" className="text-white bg-[#0F1011] hover:bg-[#151617]">Sales Pitch</SelectItem>
                      <SelectItem key="marketing" className="text-white bg-[#0F1011] hover:bg-[#151617]">Marketing Strategy</SelectItem>
                      <SelectItem key="report" className="text-white bg-[#0F1011] hover:bg-[#151617]">Report Summary</SelectItem>
                      <SelectItem key="training" className="text-white bg-[#0F1011] hover:bg-[#151617]">Training / HR</SelectItem>
                    </Select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-default-500 uppercase tracking-wider block mb-2">Tone</label>
                    <Select 
                      aria-label="Tone"
                      selectedKeys={[tone]} 
                      onSelectionChange={(keys) => setTone(Array.from(keys)[0] as string)}
                      size="sm"
                      classNames={{
                        trigger: "bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] rounded-xl text-white"
                      }}
                    >
                      <SelectItem key="formal" className="text-white bg-[#0F1011] hover:bg-[#151617]">Formal & Professional</SelectItem>
                      <SelectItem key="persuasive" className="text-white bg-[#0F1011] hover:bg-[#151617]">Persuasive</SelectItem>
                      <SelectItem key="casual" className="text-white bg-[#0F1011] hover:bg-[#151617]">Casual & Friendly</SelectItem>
                      <SelectItem key="technical" className="text-white bg-[#0F1011] hover:bg-[#151617]">Technical & Precise</SelectItem>
                    </Select>
                  </div>

                  <div>
                    <Input 
                      label="Target Audience" 
                      placeholder="e.g. VCs, Internal Management" 
                      value={audience} 
                      onChange={(e) => setAudience(e.target.value)}
                      size="sm"
                      classNames={{
                        label: "text-[11px] font-semibold text-default-500 uppercase tracking-wider mb-2",
                        inputWrapper: "bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] focus-within:!border-[#7170FF]/50 rounded-xl text-white"
                      }}
                    />
                  </div>
                </div>

                <Button 
                  color="primary" 
                  className="w-full h-11 bg-[#7170FF] text-white hover:bg-[#605eff] font-medium rounded-xl shadow-lg shadow-[#7170FF]/20"
                  endContent={<ArrowRight className="w-4 h-4" />} 
                  onPress={handleGenerate} 
                  isLoading={isGenerating}
                >
                  Generate Outline
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
