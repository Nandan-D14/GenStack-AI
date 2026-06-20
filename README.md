# GenStack AI

> **From blank page to boardroom deck.**  
> The AI presentation workspace that turns ideas, docs, and notes into polished decks instantly.

---

## Overview

**GenStack AI** is a production-grade AI-powered presentation SaaS that transforms rough ideas into professional, export-ready PowerPoint decks in minutes. Unlike basic AI slide generators, GenStack is a full **presentation creation workspace** — handling content structure, intelligent design, slide-level editing, brand consistency, speaker notes, and team collaboration.

---

## Core Product Promise

Users can:
- **Create** a full presentation from a single prompt, notes, PDF, URL, or bullet points.
- **Refine** the deck slide-by-slide with AI assistance.
- **Adapt** tone, length, style, and audience on demand.
- **Export** to PowerPoint (`.pptx`) and PDF with professional quality.
- **Collaborate** with teammates in real time.
- **Maintain** brand consistency across every slide via Brand Kits.

---

## Tech Stack

* **Frontend Framework**: Next.js 15+ (App Router), React, TypeScript
* **UI Components**: **Hero UI** (formerly NextUI) & Tailwind CSS
* **Database & Backend**: **Convex DB** (Reactive Database with built-in WebSockets)
* **Object Storage**: **Bucketblaze** (Backblaze B2 with S3-compatible API)
* **AI Presentation Layer**: **Thesys C1** API (Slide outline, layouts, and content generation)
* **Export Engine**: `pptxgenjs` (nodebuffer presentation builder)
* **Auth**: Auth.js (NextAuth) / Custom provider integrated with Convex

---

## Minimum Launch Pages (MVP)

To launch a real AI PPT SaaS, we focus on these **10 core pages**:

1. **Landing Page**: Product overview, features, pricing, and login/signup CTA.
2. **Login Page**: Email login and Google OAuth.
3. **Signup Page**: Account creation.
4. **Dashboard**: View all presentations, create new presentation, search, delete, and duplicate decks.
5. **Create Presentation Page**: Prompt input, file upload (PDF/DOCX), URL inputs, and presentation settings.
6. **AI Generation Page**: Loading/progress state, outline preview, and slide generator triggers.
7. **Presentation Editor Page**: Slide list sidebar, Slide canvas, drag-and-drop slide reordering, content edit, themes, slide regeneration, and export triggers.
8. **Presentation Preview Page**: Full presentation preview and present mode.
9. **Export Page/Modal**: PPTX export and PDF export.
10. **Settings Page**: Profile and account settings.

---

## Core Features & Capabilities

### 1. Intake & AI Generation
* **Prompt to Presentation**: Enter a brief and generate a full presentation.
* **Document to Presentation**: Upload PDF or DOCX files to extract key points.
* **URL to Presentation**: Input a website link and transform content into slides.
* **Notes to Presentation**: Convert free-text meeting notes into structured slides.
* **AI Outline Generation**: Automatically structures presentations into 3-5 sections before generating slides.
* **AI Content & Speaker Notes**: Automatically creates headlines, bullet points, and presenter script notes.

### 2. Presentation Editor
* **Direct Content Editing**: Click to edit titles, text, and bullet points.
* **Slide Operations**: Drag-and-drop reordering, add slide, duplicate slide, and delete slide.
* **Regeneration Controls**: Choose to regenerate a single slide (with tone/length settings) or regenerate the entire presentation.
* **Undo/Redo**: Simple history navigation within the editor.

### 3. Design & Media
* **Theme & Color Selection**: Select custom color palettes and typography.
* **Brand Kit**: Upload logos, choose primary/secondary colors, and lock fonts to keep decks on-brand automatically.
* **Media Library**: Upload local images to Bucketblaze and access them inside slides.

### 4. Export & Sharing
* **Editable PowerPoint (PPTX)**: High-quality, editable vector files using `pptxgenjs`.
* **Print-Ready PDF**: Fixed-layout export matching the presentation design.
* **Sharing Links**: Generate public view-only sharing links.

---

## Future Roadmap & Premium Features

* **Real-Time Collaborative Editing** (Multiplayer workspace using Convex reactivity)
* **Voice / Audio to Presentation** (Speak your ideas to generate decks)
* **Meeting Recording to Presentation** (Upload audio/video files to summarize meetings into slides)
* **Auto-Updating Presentations** (Connect database sources to slide charts)
* **Live Presentation Analytics** (Track user views, slide duration, and engagement)
* **White-Label Workspaces** (Custom domain routing and complete brand removal)
* **AI Presentation Practice Mode** (Practice presenting with live AI speech analysis)

---

## Repository & Setup

* **Status**: Active Development — Transitioning to Convex & Bucketblaze
* **GitHub**: [github.com/Nandan-D14/GenStack-AI](https://github.com/Nandan-D14/GenStack-AI)
* **License**: MIT
