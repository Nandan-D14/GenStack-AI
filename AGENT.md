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
│  │               CONVEX FILE STORAGE                     │  │
│  │  - Built-in secure file storage                      │  │
│  │  - PDF/DOCX Uploads, Branded Logos, Exports           │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Thesys C1   │  │    Clerk     │  │   Payment Gateway   │  │
│  │  & LLM APIs  │  │    Auth      │  │  (Billing/Stripe)   │  │
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
    c1ArtifactId: v.optional(v.string()),
    c1Response: v.optional(v.string()),
    planItems: v.optional(v.string()), // JSON string of PlanItem[]
    planStatus: v.optional(v.string()), // "planning" | "approved" | "generating" | "done"
    generationMode: v.optional(v.string()), // "custom" | "template"
    chatHistory: v.optional(v.string()), // JSON string of ChatMessage[]
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_userId", ["userId"]),

  slides: defineTable({
    deckId: v.id("decks"),
    order: v.float64(), // float to support easy slide reordering dragging
    layout: v.string(), // "title" | "title_content" | "two_column" | "chart"
    title: v.string(),
    content: v.string(), // JSON string representing slide elements/bullets
    c1Dsl: v.optional(v.string()), // Thesys C1 single-slide artifact DSL
    visualSuggestion: v.string(), // "chart" | "image" | "icon" | "none"
    speakerNotes: v.optional(v.string()),
    isLocked: v.boolean(),
    isGenerated: v.boolean(),
    updatedAt: v.string(),
  })
    .index("by_deckId", ["deckId"])
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
    storageId: v.string(), // Convex storage ID
    fileName: v.string(),
    fileUrl: v.string(),
    fileType: v.string(), // "image" | "pdf" | "docx"
    fileSize: v.float64(),
    createdAt: v.string(),
  }),
});
```

---

## 4. AI Orchestration Pipeline

The AI presentation pipeline interfaces with LLMs and the **Thesys C1** API for outline generation and single-slide visual creation:

1. **Intake Processing**: Raw prompts, PDF/DOCX contents (uploaded via Convex File Storage), URL pages, or notes are passed to TokenRouter/LLM APIs.
2. **Outline & Layout Planning**: The AI constructs a tailored slide outline plan (using `minimax-m3` model via CastAI/TokenRouter) mapping layout categories for each slide.
3. **Slide Copywriting**: Generates punchy headers, bullet points (formatted in JSON), and speaker notes for each slide.
4. **Interactive Customization**: Translates content updates, tone changes, and length requests to C1's dynamic parameters, or generates a template slide using the **Thesys C1 Artifact API**.

---

## 5. Convex Server Functions

Convex utilizes TypeSafe serverless queries, mutations, and actions:

* **Queries** (`convex/decks.ts`, `convex/slides.ts`, `convex/media.ts`):
  * `decks:list`: Fetches all decks for the active authenticated user.
  * `decks:getById`: Reactive query pulling a single deck and its sorted slides.
  * `media:list`: Fetches all uploaded media files for the active user.
* **Mutations** (`convex/decks.ts`, `convex/slides.ts`, `convex/media.ts`):
  * `decks:create` / `decks:deleteDeck`: Structural deck creation and cascade deletion.
  * `decks:updatePlan` / `decks:updateChatHistory` / `decks:updateC1Data`: Saves the active AI outline plan, history, and C1 metadata.
  * `slides:createSlide` / `slides:deleteSlide` / `slides:duplicateSlide`: Operations on individual slides.
  * `slides:updateSlideContent` / `slides:updateSlideOrders`: Modifies slide fields or slide layout sorting indexes.
  * `slides:replaceAllSlides`: Resets the slide sequence from a newly approved outline plan.
  * `media:saveFile` / `media:deleteFile`: File uploads and removals.
* **Actions** (`convex/export.ts`):
  * `export:generatePptx`: Generates an editable PowerPoint (`.pptx`) using `pptxgenjs` on the server-side, returning a downloadable base64 representation.

---

## 6. Frontend & Pages Architecture

### 6.1 MVP Launch Pages (10 Pages)
1. **Landing** (`/`): High-conversion marketing landing page using Hero UI components.
2. **Login** (`/auth/signin`): Auth integration via Clerk redirect / inline forms.
3. **Signup** (`/auth/signup`): User registration.
4. **Dashboard** (`/dashboard`): Folder navigation, search, and deck duplication/deletion controls.
5. **Create Presentation** (`/deck/new`): Main source entry point (Prompt, PDF/DOCX upload, or URL fetch).
6. **AI Outline/Plan** (`/deck/[id]/plan`): Renders the generated deck plan, allowing users to chat to refine the structure, reorder/delete/add slides, and select generation mode ("template" or "custom") before kicking off generation.
7. **AI Generation / Progress** (Triggered on plan approval): Shows live slide generation state cards.
8. **Presentation Editor** (`/deck/[id]/editor`): Slides list sidebar, editable workspace canvas stage, template layouts, and speaker notes controls.
9. **Presentation Preview** (Inline/Full screen): Fullscreen 16:9 presentation preview mode.
10. **Settings** (`/settings`): Workspace customization, brand kit setups.

### 6.2 Core Folders
```
convex/
├── schema.ts          # DB schema
├── decks.ts           # Deck queries/mutations
├── slides.ts          # Slide mutations
├── media.ts           # Convex File Storage mutations
└── export.ts          # pptxgenjs Node.js server action
src/
├── app/               # Next.js App Router (Landing, Dashboard, Plan, Editor, API routes)
├── components/        # Hero UI Wrapper elements (SlideCanvas, Sidebar)
├── hooks/             # Convex state integrations
└── lib/
    └── bucketblaze.ts # (Deprecated/Stubbed out - replaced by Convex File Storage)
```

---

## 7. Storage Engine: Convex File Storage

The system connects to **Convex File Storage** for assets and document ingestion:

* **Supported Assets**: PDF uploads, DOCX sources, custom brand logos, visual slide attachments, and final exports.
* **Flow**:
  1. Frontend requests a secure upload URL from the `media:generateUploadUrl` mutation.
  2. Frontend posts the file content directly to Convex Storage.
  3. Convex returns a storage ID, which is sent to `media:saveFile` to resolve the public URL and write file metadata to the database.

---

## 8. Development Rules for Agents

1. **Verify Locked Status**: Never change, regenerate, or edit a slide if `slide.isLocked` is `true`.
2. **Apply Brand Kits**: Always fetch active `brandKits` configurations before compiling slide styles or executing PPTX exports.
3. **Reactive state usage**: Use Convex’s `useQuery` hooks. Do not cache database state inside local state managers (e.g. Zustand) unless handling local, uncommitted client edits (such as drag positions or selection states).
4. **Keep PPTX Editable**: Maintain text fields, shapes, and layouts in `pptxgenjs` output so they remain fully editable in standard software.
5. **Security First**: Ensure Convex queries enforce validation on `userId` (synced via Clerk credentials) to isolate data between organizations and workspace environments.
