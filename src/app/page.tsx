"use client";

import { Button, Card, CardBody, Chip, Input } from "@heroui/react";
import { Sparkles, Zap, Wand2, FileText, Globe, Palette, Layers, Shield, Users, Star, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleTryNow = () => {
    if (prompt.trim()) {
      setIsGenerating(true);
      setTimeout(() => { window.location.href = "/deck/new"; }, 1000);
    } else { window.location.href = "/deck/new"; }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-secondary/20 via-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <nav className="relative flex items-center justify-between px-8 py-5 border-b border-divider">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><Sparkles className="w-4 h-4 text-foreground" /></div>
          <span className="font-bold text-xl text-foreground">GenStack AI</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-sm text-default-400 hover:text-foreground">Features</Link>
          <Link href="#pricing" className="text-sm text-default-400 hover:text-foreground">Pricing</Link>
          <Link href="/dashboard" className="text-sm text-default-400 hover:text-foreground">Dashboard</Link>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="flat" size="sm">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button color="primary" size="sm">Sign Up</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-4">
              <UserButton />
              <Button as={Link} href="/deck/new" color="primary" size="sm">Get Started</Button>
            </div>
          </Show>
        </div>
      </nav>
      <section className="relative px-8 pt-20 pb-16 text-center max-w-5xl mx-auto">
        <Chip className="bg-secondary/20 text-secondary mb-6" size="sm"><Zap className="w-3 h-3 inline mr-1" />AI Presentation Workspace</Chip>
        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">From blank page to <br /><span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">boardroom deck</span></h1>
        <p className="text-xl text-default-400 max-w-2xl mx-auto mb-10">Turn ideas, documents, and notes into polished, professional presentations in minutes. AI handles structure, design, and iteration. You handle the delivery.</p>
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <Input size="lg" placeholder="Describe your presentation..." value={prompt} onChange={(e) => setPrompt(e.target.value)} className="flex-1" startContent={<Wand2 className="w-5 h-5 text-default-500" />} />
            <Button size="lg" color="primary" className="px-8" endContent={<ArrowRight className="w-5 h-5" />} onPress={handleTryNow} isLoading={isGenerating}>Create Deck</Button>
          </div>
          <p className="text-sm text-default-500 mt-3">Try: "Pitch deck for AI wardrobe startup" or "Q3 marketing strategy review"</p>
        </div>
      </section>
      <section className="px-8 py-8 border-y border-divider">
        <div className="max-w-5xl mx-auto grid grid-cols-4 gap-8 text-center">
          {[{ value: "50K+", label: "Decks Created" }, { value: "3.2M", label: "Slides Generated" }, { value: "4.9", label: "User Rating" }, { value: "98%", label: "Export Success" }].map((stat) => (
            <div key={stat.label}><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-sm text-default-400">{stat.label}</p></div>
          ))}
        </div>
      </section>
      <section id="features" className="px-8 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-3">A real presentation workspace, not a toy</h2>
          <p className="text-lg text-default-400">Everything you need to go from idea to final deck</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[{ icon: Wand2, title: "Prompt to Deck", desc: "Type a single sentence and get a complete, structured presentation with smart outline and story flow.", color: "primary" }, { icon: FileText, title: "Upload & Convert", desc: "Drop a PDF, DOCX, or paste notes. AI extracts key points and structures them into slides.", color: "secondary" }, { icon: Globe, title: "URL to Slides", desc: "Paste any website link and transform the content into a clean, presentation-ready format.", color: "success" }, { icon: Palette, title: "AI Design Engine", desc: "Automatic typography, spacing, color harmony, and visual balance. No design skills needed.", color: "warning" }, { icon: Layers, title: "Slide-Level Editing", desc: "Edit text directly, regenerate one slide, change tone, or swap layouts without rebuilding the whole deck.", color: "danger" }, { icon: Shield, title: "Brand Kit", desc: "Lock in your logo, colors, and fonts. Every slide stays on-brand automatically.", color: "primary" }, { icon: Users, title: "Team Collaboration", desc: "Shared workspaces, comments, version history, and approval flows for your team.", color: "secondary" }, { icon: FileText, title: "Pro Export", desc: "Export to editable PowerPoint and print-ready PDF with embedded fonts and vector graphics.", color: "success" }, { icon: Star, title: "Speaker Notes", desc: "AI generates presenter notes for every slide so you never go in unprepared.", color: "warning" }].map((feat) => (
            <Card key={feat.title} className="bg-content1 border border-default hover:border-default-200 transition-colors">
              <CardBody className="p-6">
                <div className={`w-10 h-10 rounded-lg bg-${feat.color}/20 flex items-center justify-center mb-4`}><feat.icon className={`w-5 h-5 text-${feat.color}`} /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-default-400">{feat.desc}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
      <section className="px-8 py-20 border-y border-divider">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-16">How it works</h2>
          <div className="grid grid-cols-4 gap-8">
            {[{ step: "01", title: "Start", desc: "Prompt, upload, or paste notes" }, { step: "02", title: "Plan", desc: "AI builds the outline and story flow" }, { step: "03", title: "Generate", desc: "Polished slides with design applied" }, { step: "04", title: "Export", desc: "Download PPTX or PDF, ready to present" }].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-lg font-bold text-secondary">{item.step}</span></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-default-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="pricing" className="px-8 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-3">Simple pricing</h2>
          <p className="text-lg text-default-400">Start free. Scale as you grow.</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[{ name: "Free", price: "$0", desc: "For personal use", features: ["3 decks/month", "Basic templates", "Watermarked exports", "Standard AI"], cta: "Get Started", highlight: false }, { name: "Pro", price: "$19", desc: "For power users", features: ["Unlimited decks", "Premium templates", "Clean exports", "Advanced AI", "Brand kit"], cta: "Start Pro Trial", highlight: true }, { name: "Team", price: "$49", desc: "Per user / month", features: ["Everything in Pro", "Shared workspaces", "Team templates", "Comments & approval", "Analytics"], cta: "Start Team Trial", highlight: false }, { name: "Enterprise", price: "Custom", desc: "For organizations", features: ["SSO & SAML", "Custom branding", "Security audits", "Dedicated support", "SLA"], cta: "Contact Sales", highlight: false }].map((plan) => (
            <Card key={plan.name} className={`bg-content1 border ${plan.highlight ? "border-primary/50 ring-1 ring-primary/20" : "border-default"}`}>
              <CardBody className="p-6">
                {plan.highlight && <Chip color="primary" size="sm" className="mb-3">Most Popular</Chip>}
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-2 mb-4"><span className="text-3xl font-bold text-foreground">{plan.price}</span>{plan.price !== "Custom" && <span className="text-default-400">/mo</span>}</div>
                <p className="text-sm text-default-400 mb-6">{plan.desc}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-default-300"><CheckCircle2 className="w-4 h-4 text-success" />{f}</li>))}
                </ul>
                <Button className="w-full" color={plan.highlight ? "primary" : "default"} as={Link} href="/deck/new">{plan.cta}</Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
      <section className="px-8 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to build your next deck?</h2>
          <p className="text-lg text-default-400 mb-8">Join 50,000+ professionals who create presentations faster with GenStack AI.</p>
          <Button as={Link} href="/deck/new" color="primary" size="lg" className="px-10" endContent={<ArrowRight className="w-5 h-5" />}>Create Your First Deck</Button>
        </div>
      </section>
      <footer className="px-8 py-10 border-t border-divider">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-6 h-6 bg-primary rounded flex items-center justify-center"><Sparkles className="w-3 h-3 text-foreground" /></div><span className="font-semibold text-foreground">GenStack AI</span></div>
          <div className="flex items-center gap-6 text-sm text-default-400"><Link href="#" className="hover:text-foreground">Privacy</Link><Link href="#" className="hover:text-foreground">Terms</Link><Link href="#" className="hover:text-foreground">Contact</Link><span>Built with Next.js + HeroUI</span></div>
        </div>
      </footer>
    </div>
  );
}
