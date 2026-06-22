import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Helper to get or create user based on authenticated identity
async function getOrCreateUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    // For local development fallback when Clerk is blocked/offline:
    const mockUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", "mock@example.com"))
      .unique();
    if (mockUser) {
      return mockUser._id;
    }
    return await ctx.db.insert("users", {
      name: "Mock User",
      email: "mock@example.com",
      plan: "free",
      createdAt: new Date().toISOString(),
    });
  }

  // Find user by email
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .unique();

  if (user) {
    return user._id;
  }

  // Create new user if not exists
  return await ctx.db.insert("users", {
    name: identity.name,
    email: identity.email,
    image: identity.pictureUrl,
    plan: "free",
    createdAt: new Date().toISOString(),
  });
}

// List all decks for the authenticated user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOrCreateUser(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("decks")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get a deck by ID including its slides
export const getById = query({
  args: { id: v.id("decks") },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    if (!userId) {
      return null;
    }

    const deck = await ctx.db.get(args.id);
    if (!deck) {
      return null;
    }

    if (deck.userId !== userId) {
      return null;
    }

    const slides = await ctx.db
      .query("slides")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.id))
      .collect();

    // Sort slides by order ascending
    slides.sort((a, b) => a.order - b.order);

    return {
      ...deck,
      slides,
    };
  },
});

// Create a new deck
export const create = mutation({
  args: {
    title: v.string(),
    objective: v.optional(v.string()),
    type: v.string(),
    tone: v.string(),
    audience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("decks", {
      title: args.title,
      objective: args.objective,
      type: args.type,
      tone: args.tone,
      audience: args.audience,
      status: "draft",
      userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Delete a deck and all its slides
export const deleteDeck = mutation({
  args: { id: v.id("decks") },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const deck = await ctx.db.get(args.id);
    if (!deck) {
      throw new Error("Deck not found");
    }

    if (deck.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete all slides associated with the deck
    const slides = await ctx.db
      .query("slides")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.id))
      .collect();

    for (const slide of slides) {
      await ctx.db.delete(slide._id);
    }

    // Delete the deck itself
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Generate a presentation outline and initial mock slides
export const generateOutline = mutation({
  args: {
    deckId: v.id("decks"),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      throw new Error("Deck not found");
    }

    // Insert mock slides simulating AI generation
    const mockSlides = [
      { title: "The Future of Fashion is AI", layout: "title", bullets: [], visualSuggestion: "none", speakerNotes: "Welcome the audience." },
      { title: "The Problem", layout: "content", bullets: ["67% of people say they have \"nothing to wear\" despite a full closet", "Average person spends 17 minutes deciding what to wear each morning", "Returns cost retailers $550B annually — 40% driven by poor fit"], visualSuggestion: "icon", speakerNotes: "Describe the problem in detail." },
      { title: "The Solution", layout: "content", bullets: ["Our approach: personal AI stylist", "How it works: photo analysis + wardrobe sync", "Key benefits: 90% return drop, save hours"], visualSuggestion: "diagram", speakerNotes: "Present the solution clearly." },
      { title: "Market Opportunity", layout: "data", bullets: ["$890B global fashion market", "40% e-commerce return rate", "$550B return costs"], visualSuggestion: "chart", speakerNotes: "Show the market size and growth." },
      { title: "Business Model", layout: "content", bullets: ["Subscription model", "B2B partnership", "Affiliate commission"], visualSuggestion: "none", speakerNotes: "Explain how you make money." },
      { title: "Traction & Metrics", layout: "chart", bullets: ["500K users", "34% MoM growth", "89% retention"], visualSuggestion: "chart", speakerNotes: "Show real numbers and traction." },
      { title: "Team", layout: "content", bullets: ["AI Ph.D founders", "Ex-Stitch Fix lead designers", "Advisor from Sequoia"], visualSuggestion: "none", speakerNotes: "Introduce the team." },
      { title: "The Ask: $2M Seed", layout: "closing", bullets: ["$2M raise", "18mo runway", "$10M Series A target"], visualSuggestion: "none", speakerNotes: "Make the ask and close strong." },
    ];

    const now = new Date().toISOString();
    const slides = [];
    for (let i = 0; i < mockSlides.length; i++) {
      const ms = mockSlides[i];
      const slideId = await ctx.db.insert("slides", {
        deckId: args.deckId,
        order: i,
        title: ms.title,
        layout: ms.layout,
        content: JSON.stringify(ms.bullets),
        visualSuggestion: ms.visualSuggestion,
        speakerNotes: ms.speakerNotes,
        isLocked: false,
        isGenerated: true,
        updatedAt: now,
      });
      slides.push(slideId);
    }

    // Update deck status to draft / generated
    await ctx.db.patch(args.deckId, {
      objective: `Presentation outline generated for: ${args.prompt}`,
      updatedAt: now,
    });

    return { success: true, slides };
  },
});

// Export deck to PPTX/PDF (mock implementation for local development)
export const exportDeck = mutation({
  args: {
    deckId: v.id("decks"),
    format: v.string(), // "pptx" | "pdf"
  },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      throw new Error("Deck not found");
    }

    const mockBuffer = Buffer.from(`Mock PPTX/PDF Presentation: ${deck.title}`);
    const base64 = mockBuffer.toString("base64");

    return {
      downloadUrl: `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${base64}`
    };
  },
});

/**
 * Internal query to fetch a deck and its slides for the export action.
 * This avoids auth issues when called from within a server action.
 */
export const getDeckForExport = internalQuery({
  args: { deckId: v.id("decks") },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) return null;

    const slides = await ctx.db
      .query("slides")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.deckId))
      .collect();

    slides.sort((a, b) => a.order - b.order);

    return { ...deck, slides };
  },
});

// Update the deck with C1 Artifact ID and DSL response
export const updateC1Data = mutation({
  args: {
    id: v.id("decks"),
    c1ArtifactId: v.optional(v.string()),
    c1Response: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.id);
    if (!deck) {
      throw new Error("Deck not found");
    }

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (args.c1ArtifactId !== undefined) {
      updates.c1ArtifactId = args.c1ArtifactId;
    }
    if (args.c1Response !== undefined) {
      updates.c1Response = args.c1Response;
    }

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});


