"use client";

import Link from "next/link";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-md">
          <Link href="/" className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
            GenStackAI
          </Link>
          <div className="hidden md:flex items-center gap-md ml-xl">
            <Link className="text-on-surface-variant font-medium font-label-lg text-label-lg hover:text-primary transition-colors duration-200" href="#">Product</Link>
            <Link className="text-on-surface-variant font-medium font-label-lg text-label-lg hover:text-primary transition-colors duration-200" href="#features">Features</Link>
            <Link className="text-on-surface-variant font-medium font-label-lg text-label-lg hover:text-primary transition-colors duration-200" href="#pricing">Pricing</Link>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="font-label-lg text-label-lg text-primary hover:bg-tertiary px-4 h-[40px] rounded-full transition-colors hidden md:block">Login</button>
            </SignInButton>
            <Link href="/deck/new" className="font-label-lg text-label-lg bg-primary text-on-primary px-6 h-[40px] rounded-full hover:opacity-90 transition-opacity flex items-center justify-center">Sign Up</Link>
          </Show>
          <Show when="signed-in">
            <UserButton />
            <Link href="/dashboard" className="font-label-lg text-label-lg bg-primary text-on-primary px-6 h-[40px] rounded-full hover:opacity-90 transition-opacity flex items-center justify-center">Dashboard</Link>
          </Show>
        </div>
      </nav>

      <main className="w-full">
        {/* Hero Section */}
        <section className="w-full px-gutter pt-[180px] pb-section flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="max-w-4xl z-10 flex flex-col items-center">
            <span className="px-4 py-1.5 rounded-full border border-border bg-surface-container-low font-label-md text-label-md text-on-surface-variant mb-md inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Introducing GenStackAI 2.0
            </span>
            
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-display md:text-headline-display text-primary mb-md tracking-tight">
              Future of Presentations
            </h1>
            
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-xl">
              Craft compelling narratives with unparalleled precision. A luminous, distraction-free environment designed for the modern professional to build, present, and analyze with total clarity.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-sm">
              <Link href="/deck/new" className="w-full sm:w-auto font-label-lg text-label-lg bg-primary text-on-primary px-8 h-[40px] rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                Get Started
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <button className="w-full sm:w-auto font-label-lg text-label-lg bg-tertiary text-primary border border-border px-8 h-[40px] rounded-full hover:bg-surface-variant transition-colors flex items-center justify-center gap-2">
                Watch Demo
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
              </button>
            </div>
          </div>

          {/* Hero Abstract Visual */}
          <div className="w-full max-w-5xl mt-xl aspect-video rounded-2xl border border-border bg-surface-container-low relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-low via-surface to-surface-container-high opacity-80"></div>
            {/* Image placeholder injected here */}
            <div 
              className="absolute inset-0 bg-cover bg-center w-full h-full mix-blend-overlay opacity-40 transition-transform duration-1000 group-hover:scale-105" 
              data-alt="A highly detailed, minimalist dark-mode software interface mockup floating in a pristine, void-like black space." 
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuALVhFz0yNc6FZez19-ZeL8HCdSNcx99RrSGzPyz9VLvlAmf-njW0etlaXlidvyPw0B2zMzo2BOEHOvrf1pmcAtO6fNRLj5-kiekCWahD1-yNK2_QhmkHeR8EGJjdxiVX53qvgPf2THJNqX5Zm1M4gK95XN5uW_a7Ai0QpkFI-VMytl1DUpACqQP6v-Hc6SByyceZZjYKlliYqjk72_T1lrcuokaFRtdMsrivtdW1iVeV8ewI-Wl7LgnY2ubYr-pSYnpisvpgHdAQza')" }}>
            </div>
          </div>
        </section>

        {/* Feature Grid (Bento Style) */}
        <section id="features" className="w-full px-gutter py-section bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col mb-xl">
              <h2 className="font-headline-md text-headline-md text-primary tracking-tight mb-xs">Designed for Impact</h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">Every tool you need, precisely where you need it. Zero clutter, pure focus.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-sm auto-rows-[320px]">
              {/* Feature 1 (Spans 2 columns on desktop) */}
              <div className="md:col-span-2 rounded-2xl bg-surface-container-low border border-border p-lg flex flex-col justify-between relative overflow-hidden group hover:border-surface-variant transition-colors">
                <div className="z-10 relative">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high border border-border flex items-center justify-center mb-md">
                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-2">Generative Layouts</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">Intelligent structural suggestions that adapt to your content in real-time, ensuring pixel-perfect alignment.</p>
                </div>
                {/* Decorative element */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 border-[1px] border-border rounded-full opacity-20 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute -bottom-10 -right-10 w-48 h-48 border-[1px] border-border rounded-full opacity-20 group-hover:scale-110 transition-transform duration-700 delay-75"></div>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl bg-surface-container-low border border-border p-lg flex flex-col justify-between hover:border-surface-variant transition-colors">
                <div>
                  <div className="w-12 h-12 rounded-full bg-surface-container-high border border-border flex items-center justify-center mb-md">
                    <span className="material-symbols-outlined text-primary">insights</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-2">Audience Analytics</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Track engagement and drop-off rates on every slide to refine your narrative.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl bg-surface-container-low border border-border p-lg flex flex-col justify-between hover:border-surface-variant transition-colors">
                <div>
                  <div className="w-12 h-12 rounded-full bg-surface-container-high border border-border flex items-center justify-center mb-md">
                    <span className="material-symbols-outlined text-primary">sync</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-2">Seamless Sync</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Real-time collaboration with team members across all devices.</p>
                </div>
              </div>

              {/* Feature 4 (Spans 2 columns on desktop) */}
              <div className="md:col-span-2 rounded-2xl bg-surface-container-low border border-border p-lg flex flex-col md:flex-row gap-lg justify-between items-center relative overflow-hidden group hover:border-surface-variant transition-colors">
                <div className="z-10 relative flex-1">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high border border-border flex items-center justify-center mb-md">
                    <span className="material-symbols-outlined text-primary">view_quilt</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-2">Component Library</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">Access hundreds of premium, customizable components designed for high-contrast, modern corporate environments.</p>
                </div>
                <div className="flex-1 w-full h-full relative min-h-[150px] rounded-xl border border-border bg-surface-container-high overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center w-full h-full mix-blend-luminosity opacity-60" 
                    data-alt="A macro shot of a sleek, dark-themed user interface component library floating in a 3D isometric perspective." 
                    style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCJJE2SXj9NzX-Mveb1qXaWX9U0KxdpvMf04kvvK1lYzIBYL-G9Tj_pimYgCHi05pS7XUXIasvxVLdZJSyuDbW5V8svrG2MYy9LV7n0EAM0xHctHdvqbwJEfXMgQQ3kygJyJkuE7ImcbRMpyFMmtS0yOie-_eE9RbdoGRw4N9sTEYvi6KB2a4rr-6V48Gqlu5SlxyUM5Ki-yjH2vso3XEkjZ5zpg0uqrZqOVzVT70jrjOxc7whwJHL6r15zEymWsyFyjCnoYaG3s3ve')" }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section id="pricing" className="w-full px-gutter py-section">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <h2 className="font-headline-md text-headline-md text-primary tracking-tight mb-xs">Simple, Transparent Pricing</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mb-xl max-w-lg">Start for free, upgrade when your team needs more power.</p>
            
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-md text-left">
              {/* Free Plan */}
              <div className="rounded-2xl bg-surface border border-border p-lg flex flex-col h-full">
                <h3 className="font-headline-sm text-headline-sm text-primary mb-1">Starter</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">Perfect for individuals trying out GenStackAI.</p>
                <div className="flex items-baseline gap-1 mb-lg">
                  <span className="font-headline-lg text-headline-lg text-primary">$0</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">/month</span>
                </div>
                <ul className="flex flex-col gap-3 mb-xl flex-grow">
                  <li className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                    Up to 3 projects
                  </li>
                  <li className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                    Basic templates
                  </li>
                  <li className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                    Standard export
                  </li>
                </ul>
                <button className="w-full font-label-lg text-label-lg bg-tertiary text-primary border border-border h-[40px] rounded-full hover:bg-surface-variant transition-colors mt-auto">
                  Start Free
                </button>
              </div>

              {/* Pro Plan */}
              <div className="rounded-2xl bg-surface-container-high border-2 border-border p-lg flex flex-col h-full relative overflow-hidden">
                {/* Highlight accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <h3 className="font-headline-sm text-headline-sm text-primary mb-1">Professional</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">For teams that need advanced control.</p>
                <div className="flex items-baseline gap-1 mb-lg">
                  <span className="font-headline-lg text-headline-lg text-primary">$29</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">/user/month</span>
                </div>
                <ul className="flex flex-col gap-3 mb-xl flex-grow">
                  <li className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                    Unlimited projects
                  </li>
                  <li className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                    Premium component library
                  </li>
                  <li className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                    Audience analytics
                  </li>
                  <li className="flex items-center gap-3 font-body-sm text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary">check</span>
                    Custom branding
                  </li>
                </ul>
                <button className="w-full font-label-lg text-label-lg bg-primary text-on-primary h-[40px] rounded-full hover:opacity-90 transition-opacity mt-auto">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-xl px-gutter flex flex-col md:flex-row justify-between items-center gap-md bg-background border-t border-border mt-section">
        <span className="font-headline-sm text-headline-sm text-primary tracking-tight">GenStackAI</span>
        <div className="flex items-center gap-md">
          <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</Link>
          <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</Link>
          <Link className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</Link>
        </div>
        <span className="font-body-sm text-body-sm text-on-surface-variant">© {new Date().getFullYear()} GenStackAI. All rights reserved.</span>
      </footer>
    </div>
  );
}

