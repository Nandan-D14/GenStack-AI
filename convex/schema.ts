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
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_userId", ["userId"]),

  slides: defineTable({
    deckId: v.id("decks"),
    order: v.float64(), // float to support easy slide reordering dragging
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
    storageId: v.string(), // Convex storage ID
    fileName: v.string(),
    fileUrl: v.string(),
    fileType: v.string(), // "image" | "pdf" | "docx"
    fileSize: v.float64(),
    createdAt: v.string(),
  }),
});
