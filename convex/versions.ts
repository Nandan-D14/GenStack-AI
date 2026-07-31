import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .unique();
  return user?._id ?? null;
}

// Snapshot the full deck + slides so it can be restored later (undo/history).
export const saveVersion = mutation({
  args: { deckId: v.id("decks"), label: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    const slides = await ctx.db
      .query("slides")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.deckId))
      .collect();
    slides.sort((a, b) => a.order - b.order);

    const snapshot = JSON.stringify({
      label: args.label || `Version ${new Date().toLocaleString()}`,
      title: deck.title,
      objective: deck.objective,
      slides: slides.map((s) => ({
        title: s.title,
        layout: s.layout,
        content: s.content,
        speakerNotes: s.speakerNotes,
        c1Dsl: s.c1Dsl,
        imageUrl: (s as any).imageUrl,
        visualSuggestion: s.visualSuggestion,
      })),
    });

    return await ctx.db.insert("versions", {
      deckId: args.deckId,
      snapshot,
      createdAt: new Date().toISOString(),
    });
  },
});

export const listVersions = query({
  args: { deckId: v.id("decks") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("versions")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.deckId))
      .collect();
    rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return rows.map((r) => {
      let label = "Version";
      try {
        label = JSON.parse(r.snapshot).label || label;
      } catch {}
      return { _id: r._id, createdAt: r.createdAt, label };
    });
  },
});

// Restore a snapshot: replace the deck's slides with the saved set.
export const restoreVersion = mutation({
  args: { versionId: v.id("versions") },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("Version not found");
    const snap = JSON.parse(version.snapshot);

    const existing = await ctx.db
      .query("slides")
      .withIndex("by_deckId", (q) => q.eq("deckId", version.deckId))
      .collect();
    for (const s of existing) await ctx.db.delete(s._id);

    const now = new Date().toISOString();
    let order = 0;
    for (const s of snap.slides || []) {
      await ctx.db.insert("slides", {
        deckId: version.deckId,
        order: order++,
        layout: s.layout || "content",
        title: s.title || "Untitled",
        content: s.content || "[]",
        c1Dsl: s.c1Dsl,
        imageUrl: s.imageUrl,
        visualSuggestion: s.visualSuggestion || "none",
        speakerNotes: s.speakerNotes || "",
        isLocked: false,
        isGenerated: true,
        updatedAt: now,
      });
    }
    await ctx.db.patch(version.deckId, {
      ...(snap.title ? { title: snap.title } : {}),
      updatedAt: now,
    });
    return { success: true, restored: (snap.slides || []).length };
  },
});
