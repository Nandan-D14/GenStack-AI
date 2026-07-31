"use client";

import Link from "next/link";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import { Chip } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="bg-gs-bg text-gs-text font-sans antialiased overflow-x-hidden min-h-screen">
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-14 bg-gs-bg/80 backdrop-blur-md border-b border-gs-border">
        <div className="flex items-center gap-md">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-gs-accent/20 border border-gs-accent/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-gs-accent">layers</span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">GenStack</span>
          </Link>
          <div className="hidden md:flex items-center gap-1 ml-8">
            <a className="gs-btn-ghost h-8 px-3 text-[13px]" href="#features">
              Features
            </a>
            <a className="gs-btn-ghost h-8 px-3 text-[13px]" href="#pricing">
              Pricing
            </a>
            <Link className="gs-btn-ghost h-8 px-3 text-[13px]" href="/templates">
              Templates
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="gs-btn-ghost h-9 hidden md:inline-flex">Log in</button>
            </SignInButton>
            <Link href="/deck/new" className="gs-btn-primary">
              Get started
            </Link>
          </Show>
          <Show when="signed-in">
            <UserButton />
            <Link href="/dashboard" className="gs-btn-primary">
              Dashboard
            </Link>
          </Show>
        </div>
      </nav>

      <main className="w-full">
        <section className="w-full px-gutter pt-36 pb-20 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px] bg-gs-accent/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-3xl z-10 flex flex-col items-center">
            <Chip tone="accent" className="mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-gs-accent animate-gs-pulse" />
              AI-native presentation workspace
            </Chip>

            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-gs-text mb-4">
              GenStack
            </h1>
            <p className="text-base md:text-lg text-gs-secondary max-w-xl mb-8 leading-relaxed">
              From blank page to boardroom deck. Plan, generate, and refine slides with
              Beautiful UI–inspired AI primitives built for speed and clarity.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link href="/deck/new" className="gs-btn-primary h-10 px-6 w-full sm:w-auto">
                Start creating
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link href="/templates" className="gs-btn-secondary h-10 px-6 w-full sm:w-auto">
                Browse templates
              </Link>
            </div>
          </div>

          {/* Product preview — Beautiful UI style composition */}
          <div className="w-full max-w-5xl mt-14 rounded-xl border border-gs-border bg-gs-surface shadow-gs overflow-hidden text-left">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gs-border bg-gs-elevated">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="ml-3 text-[11px] text-gs-muted font-mono">plan · generate · export</span>
            </div>
            <div className="grid md:grid-cols-[240px_1fr_280px] min-h-[320px]">
              <aside className="hidden md:block border-r border-gs-border p-3 space-y-1 bg-gs-elevated">
                <div className="gs-nav-item-active text-xs">
                  <span className="material-symbols-outlined text-[16px]">dashboard</span>
                  My Decks
                </div>
                <div className="gs-nav-item text-xs">
                  <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                  AI Plan
                </div>
                <div className="gs-nav-item text-xs">
                  <span className="material-symbols-outlined text-[16px]">palette</span>
                  Brand Kit
                </div>
              </aside>
              <div className="p-4 space-y-3 border-r border-gs-border">
                <div className="rounded-lg bg-gs-accent text-white px-3.5 py-2.5 text-sm ml-auto max-w-[80%]">
                  Build a Series A pitch for a B2B AI infra startup
                </div>
                <div className="gs-thinking">
                  Researching market framing → outlining 12 slides → applying brand kit…
                </div>
                <div className="rounded-lg border border-gs-border bg-gs-surface-2 px-3.5 py-2.5 text-sm text-gs-secondary max-w-[90%]">
                  Drafted a 12-slide narrative: problem, solution, traction, ask.
                </div>
              </div>
              <div className="p-4 space-y-2 bg-gs-bg/40">
                <div className="gs-task-row">
                  <span className="w-1.5 h-1.5 rounded-full bg-gs-success" />
                  <span className="flex-1 text-xs text-gs-text truncate">Title slide</span>
                  <span className="text-[11px] text-emerald-400">Done</span>
                </div>
                <div className="gs-task-row">
                  <span className="w-1.5 h-1.5 rounded-full bg-gs-accent animate-gs-pulse" />
                  <span className="flex-1 text-xs text-gs-text truncate">Market opportunity</span>
                  <span className="text-[11px] text-gs-accent-text">Generating</span>
                </div>
                <div className="gs-task-row opacity-60">
                  <span className="w-1.5 h-1.5 rounded-full bg-gs-muted" />
                  <span className="flex-1 text-xs text-gs-text truncate">Product demo</span>
                  <span className="text-[11px] text-gs-muted">Queued</span>
                </div>
                <div className="gs-context-card mt-3">
                  <div className="flex items-center gap-1.5 mb-1 text-gs-text">
                    <span className="material-symbols-outlined text-[14px] text-gs-info">menu_book</span>
                    RAG context
                  </div>
                  Pulled 4 chunks from your attached pitch notes and brand guidelines.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full px-gutter py-section border-t border-gs-border">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10 max-w-xl">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                Built for AI-native workflows
              </h2>
              <p className="text-gs-secondary text-sm md:text-base">
                Chat, thinking traces, task rows, and context cards — the same language as
                modern agent UIs, applied to decks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  icon: "psychology",
                  title: "Structured planning",
                  body: "Discovery chat produces ordered slide plans with layout skills and parallel generation.",
                },
                {
                  icon: "hub",
                  title: "Memory + RAG",
                  body: "Brand voice, preferences, and attached sources stay in context across every deck.",
                },
                {
                  icon: "palette",
                  title: "Brand-aware export",
                  body: "Kits, templates, and PPTX/PDF export that respect your visual system.",
                },
              ].map((f) => (
                <div key={f.title} className="gs-card-hover p-5">
                  <div className="w-9 h-9 rounded-md bg-gs-accent-soft border border-gs-accent/20 flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[18px] text-gs-accent">{f.icon}</span>
                  </div>
                  <h3 className="text-[15px] font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gs-secondary leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="w-full px-gutter py-section border-t border-gs-border">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
              Simple pricing
            </h2>
            <p className="text-gs-secondary text-sm mb-10">Start free. Upgrade when your team scales.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              <div className="gs-card p-6">
                <h3 className="font-semibold mb-1">Starter</h3>
                <p className="text-sm text-gs-secondary mb-4">For individuals exploring GenStack.</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-semibold">$0</span>
                  <span className="text-sm text-gs-muted">/month</span>
                </div>
                <ul className="space-y-2 mb-8 text-sm text-gs-secondary">
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gs-accent">check</span>
                    Up to 3 projects
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gs-accent">check</span>
                    Basic templates
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gs-accent">check</span>
                    Standard export
                  </li>
                </ul>
                <Link href="/deck/new" className="gs-btn-secondary w-full">
                  Start free
                </Link>
              </div>

              <div className="gs-card p-6 relative overflow-hidden border-gs-accent/40">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gs-accent" />
                <Chip tone="accent" className="mb-3">
                  Popular
                </Chip>
                <h3 className="font-semibold mb-1">Professional</h3>
                <p className="text-sm text-gs-secondary mb-4">For teams that need advanced control.</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-semibold">$29</span>
                  <span className="text-sm text-gs-muted">/user/month</span>
                </div>
                <ul className="space-y-2 mb-8 text-sm text-gs-secondary">
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gs-accent">check</span>
                    Unlimited projects
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gs-accent">check</span>
                    Brand kits + memory
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gs-accent">check</span>
                    RAG from docs & URLs
                  </li>
                  <li className="flex gap-2">
                    <span className="material-symbols-outlined text-[16px] text-gs-accent">check</span>
                    Priority generation
                  </li>
                </ul>
                <Link href="/deck/new" className="gs-btn-primary w-full">
                  Upgrade to Pro
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-10 px-gutter flex flex-col md:flex-row justify-between items-center gap-4 border-t border-gs-border">
        <span className="text-sm font-semibold tracking-tight">GenStack</span>
        <div className="flex items-center gap-4 text-xs text-gs-muted">
          <a className="hover:text-gs-text" href="#">
            Privacy
          </a>
          <a className="hover:text-gs-text" href="#">
            Terms
          </a>
          <a className="hover:text-gs-text" href="#">
            Contact
          </a>
        </div>
        <span className="text-xs text-gs-muted">
          © {new Date().getFullYear()} GenStack. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
