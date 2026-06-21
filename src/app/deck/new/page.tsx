"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function NewDeckPage() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("Executive Board");
  const [slidesCount, setSlidesCount] = useState(12);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const router = useRouter();
  const runCreateDeck = useMutation(api.decks.create);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const newDeckId = await runCreateDeck({
        title: prompt.slice(0, 60) || "New Presentation",
        type: "pitch",
        tone: tone.toLowerCase(),
        objective: prompt || "General outline generation",
        audience: audience
      });
      router.push(`/deck/${newDeckId}/outline`);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-hidden selection:bg-primary/20 selection:text-primary">
      <div className="flex h-screen w-full">
        {/* SideNavBar Component */}
        <nav className="hidden md:flex flex-col h-screen sticky top-0 py-md px-sm w-64 bg-surface-container-low border-r border-border shrink-0">
          {/* Header */}
          <div className="mb-xl px-4 flex items-center gap-sm">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary" data-icon="dashboard">dashboard</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">GenStackAI Workspace</h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Pro Plan</p>
            </div>
          </div>
          {/* CTA */}
          <button className="w-full mb-md bg-primary text-on-primary py-3 rounded-full font-label-lg text-label-lg flex items-center justify-center gap-sm hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined" data-icon="add">add</span>
            New Presentation
          </button>
          {/* Navigation Links */}
          <div className="flex-1 space-y-xs overflow-y-auto">
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container transition-all duration-200 rounded-lg" href="/dashboard">
              <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
              <span className="font-label-md text-label-md">My Decks</span>
            </Link>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container transition-all duration-200 rounded-lg" href="#">
              <span className="material-symbols-outlined" data-icon="collections_bookmark">collections_bookmark</span>
              <span className="font-label-md text-label-md">Templates</span>
            </Link>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container transition-all duration-200 rounded-lg" href="#">
              <span className="material-symbols-outlined" data-icon="folder_open">folder_open</span>
              <span className="font-label-md text-label-md">Assets</span>
            </Link>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container transition-all duration-200 rounded-lg" href="#">
              <span className="material-symbols-outlined" data-icon="insights">insights</span>
              <span className="font-label-md text-label-md">Analytics</span>
            </Link>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container transition-all duration-200 rounded-lg" href="#">
              <span className="material-symbols-outlined" data-icon="settings">settings</span>
              <span className="font-label-md text-label-md">Settings</span>
            </Link>
          </div>
          {/* Footer Links */}
          <div className="mt-auto pt-md border-t border-border space-y-xs">
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container transition-all duration-200 rounded-lg" href="#">
              <span className="material-symbols-outlined" data-icon="help">help</span>
              <span className="font-label-md text-label-md">Help</span>
            </Link>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container transition-all duration-200 rounded-lg" href="/">
              <span className="material-symbols-outlined" data-icon="logout">logout</span>
              <span className="font-label-md text-label-md">Logout</span>
            </Link>
          </div>
        </nav>
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Atmospheric Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none"></div>
          <div className="flex-1 overflow-y-auto px-gutter py-xl relative z-10 flex flex-col items-center justify-center">
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-xl">
              {/* Page Header */}
              <header className="text-center space-y-sm">
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Create Presentation</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">Describe your topic, upload reference materials, or provide a URL. Our AI will craft a structured deck tailored to your needs.</p>
              </header>
              {/* Command Center Layout */}
              <div className="flex flex-col gap-lg w-full">
                {/* Settings Toolbar */}
                <div className="flex flex-wrap items-center justify-center gap-sm">
                  {/* Tone */}
                  <div className="flex items-center gap-1 bg-surface-container-low/60 backdrop-blur-md rounded-full border border-border/50 p-1">
                    {["Professional", "Creative", "Persuasive"].map((t) => (
                      <button 
                        key={t}
                        onClick={() => setTone(t)}
                        className={`${tone === t ? "bg-surface-container-highest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"} px-4 py-1.5 rounded-full font-label-sm text-label-sm transition-colors`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {/* Audience */}
                  <div className="relative bg-surface-container-low/60 backdrop-blur-md rounded-full border border-border/50 flex items-center">
                    <span className="material-symbols-outlined pl-4 text-on-surface-variant text-[18px]" data-icon="groups">groups</span>
                    <select 
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="appearance-none bg-transparent border-none py-1.5 pr-10 pl-2 font-label-sm text-label-sm text-on-surface-variant focus:outline-none focus:ring-0 cursor-pointer [&>option]:bg-surface-container-low"
                    >
                      <option>Executive Board</option>
                      <option>General Public</option>
                      <option>Technical Team</option>
                      <option>Investors</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]" data-icon="expand_more">expand_more</span>
                  </div>
                  {/* Slides */}
                  <div className="flex items-center gap-sm bg-surface-container-low/60 backdrop-blur-md rounded-full border border-border/50 px-4 py-1.5">
                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]" data-icon="view_carousel">view_carousel</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant w-16">{slidesCount} Slides</span>
                    <input 
                      className="w-24 accent-primary h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer" 
                      max="30" 
                      min="5" 
                      type="range" 
                      value={slidesCount}
                      onChange={(e) => setSlidesCount(parseInt(e.target.value))}
                    />
                  </div>
                </div>
                {/* Main Prompt Area */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-border to-border rounded-[32px] blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
                  <div className="relative bg-surface-container-low/80 backdrop-blur-xl rounded-[32px] border border-border flex flex-col overflow-hidden shadow-2xl">
                    <div className="p-lg pb-sm">
                      <textarea 
                        className="w-full bg-transparent border-none outline-none font-body-lg text-body-lg text-primary placeholder:text-on-surface-variant/70 resize-none min-h-[160px]" 
                        placeholder="What's your presentation about? e.g., A quarterly business review focusing on Q3 SaaS growth, highlighting key metrics in MRR and user acquisition..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      ></textarea>
                    </div>
                    {/* Integrated Sources and CTA */}
                    <div className="px-md py-md border-t border-border/40 bg-surface/30 flex flex-wrap items-center justify-between gap-md">
                      {/* Sources Actions */}
                      <div className="flex items-center gap-xs">
                        <button className="flex items-center gap-xs px-4 py-2 rounded-full bg-surface-container-highest/50 hover:bg-surface-container-highest border border-border/50 transition-colors text-on-surface-variant hover:text-primary">
                          <span className="material-symbols-outlined text-[18px]" data-icon="upload_file">upload_file</span>
                          <span className="font-label-sm text-label-sm">Upload PDF/DOCX</span>
                        </button>
                        <button className="flex items-center gap-xs px-4 py-2 rounded-full bg-surface-container-highest/50 hover:bg-surface-container-highest border border-border/50 transition-colors text-on-surface-variant hover:text-primary">
                          <span className="material-symbols-outlined text-[18px]" data-icon="link">link</span>
                          <span className="font-label-sm text-label-sm">Add URL</span>
                        </button>
                      </div>
                      {/* Primary Action */}
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-primary text-neutral-bg px-6 py-3 rounded-full font-label-md text-label-md flex items-center justify-center gap-sm hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(255,255,255,0.15)] ml-auto disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[20px]" data-icon="auto_awesome">
                          {isGenerating ? "hourglass_empty" : "auto_awesome"}
                        </span>
                        {isGenerating ? "Generating..." : "Generate with AI"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
