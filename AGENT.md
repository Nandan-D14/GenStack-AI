# AGENT.md — GenStack AI

> **System Design & Agent Instruction Document**  
> This file defines the architecture, product model, and development rules for the GenStack AI presentation SaaS. Every agent or contributor working on this codebase should read this before making changes.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Name** | GenStack AI |
| **Tagline** | From blank page to boardroom deck. |
| **Type** | AI-powered presentation SaaS (web application) |
| **MVP Goal** | Prompt/File/URL → Outline → Slides → Edit → Export (PPTX/PDF) |
| **Target Users** | Students, founders, marketers, sales teams, consultants, agencies, HR/training |
| **Differentiation** | Reactive collaboration, structure-first outline, brand kit support, professional PPTX export |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Next.js 15+)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │   Prompt     │  │   Editor     │  │   Export /        │  │
│  │   Input      │  │   Workspace  │  │   Preview         │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
│  Tailwind CSS • Hero UI Components • Lucide Icons            │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND & STORAGE LAYER                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     CONVEX DB                         │  │
│  │  - Reactive Client Sync (WebSockets)                  │  │
│  │  - Queries, Mutations & Actions (TypeScript Functions)  │  │
│  │  - Built-in Vector Indexes & Caching                  │  │
│  └─────────────────────────┬─────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                     BUCKETBLAZE                       │  │
│  │  - Backblaze B2 (Object Storage via S3 API)           │  │
│  │  - PDF/DOCX Uploads, Branded Logos, Exports           │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Thesys C1   │  │   Auth.js    │  │   Payment Gateway   │  │
│  │   (AI Gen)   │  │  (NextAuth)  │  │  (Billing/Stripe)   │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Convex Database Schema (`convex/schema.ts`)

The database uses Convex's document-relational model. Here is the schema configuration:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    emailVerified: v.optional(v.string()),
    image: v.optional(v.string()),
    plan: v.string(), // "free" | "pro" | "team"
    createdAt: v.string(),
  }).index("by_email", ["email"]),

  workspaces: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    createdAt: v.string(),
  }),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.string(), // "owner" | "admin" | "member"
  }).index("by_workspace_and_user", ["workspaceId", "userId"]),

  decks: defineTable({
    title: v.string(),
    objective: v.optional(v.string()),
    type: v.string(), // "pitch" | "sales" | "marketing" | "training" | "report"
    tone: v.string(), // "formal" | "casual" | "persuasive"
    audience: v.optional(v.string()),
    status: v.string(), // "draft" | "published" | "archived"
    userId: v.id("users"),
    workspaceId: v.optional(v.id("workspaces")),
    brandKitId: v.optional(v.id("brandKits")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_userId", ["userId"]),

  slides: defineTable({
    deckId: v.id("decks"),
    order: v.float64(), // floating point for easy drag-and-drop reordering
    layout: v.string(), // "title" | "title_content" | "two_column" | "chart"
    title: v.string(),
    content: v.string(), // JSON string representing slide elements/bullets
    visualSuggestion: v.string(), // "chart" | "image" | "icon" | "none"
    speakerNotes: v.optional(v.string()),
    isLocked: v.boolean(),
    isGenerated: v.boolean(),
    updatedAt: v.string(),
  }).index("by_deckId", ["deckId"])
    .index("by_deckId_order", ["deckId", "order"]),

  brandKits: defineTable({
    name: v.string(),
    userId: v.id("users"),
    workspaceId: v.optional(v.id("workspaces")),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    accentColor: v.string(),
    backgroundColor: v.string(),
    textColor: v.string(),
    headingFont: v.string(),
    bodyFont: v.string(),
    logoUrl: v.optional(v.string()),
    logoPosition: v.string(), // "top-left" | "top-right" | "none"
    createdAt: v.string(),
  }).index("by_workspaceId", ["workspaceId"]),

  comments: defineTable({
    deckId: v.id("decks"),
    slideId: v.optional(v.id("slides")),
    userId: v.id("users"),
    text: v.string(),
    parentId: v.optional(v.id("comments")),
    createdAt: v.string(),
  }).index("by_deckId", ["deckId"]),

  versions: defineTable({
    deckId: v.id("decks"),
    snapshot: v.string(), // Full JSON representation of deck state at save
    createdAt: v.string(),
  }).index("by_deckId", ["deckId"]),

  mediaFiles: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    fileUrl: v.string(),
    fileType: v.string(), // "image" | "pdf" | "docx"
    fileSize: v.float64(),
    createdAt: v.string(),
  }),
});
```

---

## 4. AI Orchestration with Thesys C1

The AI presentation pipeline interfaces with **Thesys C1** for outline and component creation:

1. **Intake Processing**: Raw prompts, PDF/DOCX contents (stored in Bucketblaze), URL pages, or notes are passed to Thesys C1.
2. **Outline & Layout Planning**: Thesys C1 structures the deck into logical flows (Hook $\rightarrow$ Problem $\rightarrow$ Solution $\rightarrow$ Closing) and returns layout schemas.
3. **Slide Copywriting**: Generates punchy headers, bullet points, visual placements, and speaker notes.
4. **Interactive Customization**: Translates content updates, tone changes, and length requests to C1's dynamic parameters.

---

## 5. Convex Server Functions

Convex utilizes TypeSafe serverless queries, mutations, and actions:

* **Queries** (`convex/decks.ts`, `convex/slides.ts`):
  * `list`: Fetches all decks for the active user/workspace.
  * `getById`: Reactive query pulling a single deck and its slides.
* **Mutations** (`convex/slides.ts`):
  * `updateSlideOrder`: Swaps slide orders instantly for reordering.
  * `updateSlideContent`: Direct WYSIWYG text updates.
  * `deleteSlide` / `duplicateSlide`: Structural deck alterations.
* **Actions** (`convex/ai.ts`):
  * `generateOutline`: Offloads outline creation to the **Thesys C1 API**.
  * `regenerateSlide`: Direct call to C1 to rebuild layout and content based on parameter settings.

---

## 6. Frontend & Pages Architecture

### 6.1 MVP Launch Pages (10 Pages)
1. **Landing** (`/`): High-conversion marketing landing page using Hero UI cards and pricing tiers.
2. **Login** (`/auth/signin`): OAuth (Google) and email access.
3. **Signup** (`/auth/signup`): User registration.
4. **Dashboard** (`/dashboard`): Folder navigation, search, and deck duplication/deletion controls.
5. **Create Presentation** (`/deck/new`): Main source entry point (Prompt, PDF/DOCX upload, or URL fetch).
6. **AI Generation** (`/deck/[id]/generate`): Live streaming feedback as C1 generates outline cards.
7. **Presentation Editor** (`/deck/[id]/editor`): Slides list sidebar, editable workspace stage, layout selector, and speaker notes controls.
8. **Presentation Preview** (`/deck/[id]/preview`): Fullscreen 16:9 presentation preview.
9. **Export Modal**: Base64 data streaming to build PPTX and PDF files.
10. **Settings** (`/settings`): Workspace customization, account settings.

### 6.2 Core Folders
```
convex/
├── schema.ts          # DB schema
├── decks.ts           # Deck queries/mutations
├── slides.ts          # Slide actions/mutations
└── ai.ts              # Thesys C1 AI Actions
src/
├── app/               # Next.js App Router (Landing, Dashboard, Editor)
├── components/        # Hero UI Wrapper elements (SlideCanvas, Sidebar)
├── hooks/             # Convex state integrations
└── lib/
    └── bucketblaze.ts # Backblaze B2 helper methods (S3 client config)
```

---

## 7. Storage Engine: Bucketblaze (Backblaze B2)

The system connects to **Backblaze B2** using S3-compatible APIs for file handling:

* **Supported Assets**: PDF uploads, DOCX sources, custom brand logos, visual slide attachments, and final PPTX/PDF exports.
* **Flow**:
  1. Frontend requests a **Presigned Upload URL** from a Convex action.
  2. Frontend performs a direct `PUT` upload from the browser to Bucketblaze.
  3. B2 returns a public URL, which is written to the database using a Convex mutation.

---

## 8. Development Rules for Agents

1. **Verify Locked Status**: Never change, regenerate, or edit a slide if `slide.isLocked` is `true`.
2. **Apply Brand Kits**: Always fetch active `brandKits` configurations before compiling slide styles or executing PPTX exports.
3. **Reactive state usage**: Use Convex’s `useQuery` hooks. Do not cache database state inside local state managers (e.g. Zustand) unless handling local, uncommitted client edits (such as drag positions or selection states).
4. **Keep PPTX Editable**: Maintain text fields, shapes, and layouts in `pptxgenjs` output so they remain fully editable in standard software.
5. **Security First**: Ensure Convex queries enforce validation on `userId` to isolate data between organizations and workspace environments.
