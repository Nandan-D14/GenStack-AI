import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new slide in a deck
export const createSlide = mutation({
  args: {
    deckId: v.id("decks"),
    title: v.string(),
    layout: v.string(),
    order: v.float64(),
  },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) {
      throw new Error("Deck not found");
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("slides", {
      deckId: args.deckId,
      title: args.title,
      layout: args.layout,
      order: args.order,
      content: JSON.stringify([]),
      visualSuggestion: "none",
      speakerNotes: "",
      isLocked: false,
      isGenerated: false,
      updatedAt: now,
    });
  },
});

// Update a slide's content fields
export const updateSlideContent = mutation({
  args: {
    id: v.id("slides"),
    title: v.optional(v.string()),
    layout: v.optional(v.string()),
    content: v.optional(v.string()), // JSON string
    visualSuggestion: v.optional(v.string()),
    speakerNotes: v.optional(v.string()),
    isLocked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const slide = await ctx.db.get(args.id);
    if (!slide) {
      throw new Error("Slide not found");
    }

    const { id, ...updates } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

// Delete a slide
export const deleteSlide = mutation({
  args: { id: v.id("slides") },
  handler: async (ctx, args) => {
    const slide = await ctx.db.get(args.id);
    if (!slide) {
      throw new Error("Slide not found");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Duplicate an existing slide
export const duplicateSlide = mutation({
  args: { id: v.id("slides") },
  handler: async (ctx, args) => {
    const slide = await ctx.db.get(args.id);
    if (!slide) {
      throw new Error("Slide not found");
    }

    const now = new Date().toISOString();
    // Insert new slide with order bumped slightly to put it next to original
    return await ctx.db.insert("slides", {
      deckId: slide.deckId,
      order: slide.order + 0.001,
      title: `${slide.title} (Copy)`,
      layout: slide.layout,
      content: slide.content,
      visualSuggestion: slide.visualSuggestion,
      speakerNotes: slide.speakerNotes,
      isLocked: false,
      isGenerated: false,
      updatedAt: now,
    });
  },
});

// Update multiple slide orders (drag and drop reordering)
export const updateSlideOrders = mutation({
  args: {
    slides: v.array(
      v.object({
        id: v.id("slides"),
        order: v.float64(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    for (const update of args.slides) {
      await ctx.db.patch(update.id, {
        order: update.order,
        updatedAt: now,
      });
    }
    return { success: true };
  },
});

// Regenerate a single slide's content (calls C1 AI mock for now)
export const regenerateSlide = mutation({
  args: {
    slideId: v.id("slides"),
    tone: v.optional(v.string()),
    length: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const slide = await ctx.db.get(args.slideId);
    if (!slide || slide.isLocked) {
      throw new Error("Slide not found or locked");
    }

    const now = new Date().toISOString();
    await ctx.db.patch(args.slideId, {
      content: JSON.stringify([
        "Regenerated point one (updated by AI)",
        "Regenerated point two (updated by AI)",
        "Regenerated point three (updated by AI)"
      ]),
      speakerNotes: `Updated notes for ${slide.title}`,
      updatedAt: now,
    });

    return await ctx.db.get(args.slideId);
  },
});

// Replace all slides for a deck (used when AI generates or edits all slides)
export const replaceAllSlides = mutation({
  args: {
    deckId: v.id("decks"),
    slides: v.array(
      v.object({
        title: v.string(),
        layout: v.string(),
        bullets: v.array(v.string()),
        speakerNotes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Delete existing slides
    const existingSlides = await ctx.db
      .query("slides")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.deckId))
      .collect();
    for (const slide of existingSlides) {
      await ctx.db.delete(slide._id);
    }

    // Insert new slides
    const now = new Date().toISOString();
    const insertedIds = [];
    for (let i = 0; i < args.slides.length; i++) {
      const slide = args.slides[i];
      const slideId = await ctx.db.insert("slides", {
        deckId: args.deckId,
        order: i,
        title: slide.title,
        layout: slide.layout,
        content: JSON.stringify(slide.bullets),
        visualSuggestion: "none",
        speakerNotes: slide.speakerNotes || "",
        isLocked: false,
        isGenerated: true,
        updatedAt: now,
      });
      insertedIds.push(slideId);
    }

    // Update deck's updatedAt and status
    await ctx.db.patch(args.deckId, {
      updatedAt: now,
    });

    return insertedIds;
  },
});

