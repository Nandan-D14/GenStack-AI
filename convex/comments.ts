import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

async function getOrCreateUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .unique();
  if (existing) return existing._id;
  return await ctx.db.insert("users", {
    name: identity.name,
    email: identity.email,
    image: identity.pictureUrl,
    plan: "free",
    createdAt: new Date().toISOString(),
  });
}

export const add = mutation({
  args: {
    deckId: v.id("decks"),
    slideId: v.optional(v.id("slides")),
    text: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return await ctx.db.insert("comments", {
      deckId: args.deckId,
      slideId: args.slideId,
      userId,
      text: args.text,
      parentId: args.parentId,
      createdAt: new Date().toISOString(),
    });
  },
});

export const listByDeck = query({
  args: { deckId: v.id("decks") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("comments")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.deckId))
      .collect();
    rows.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    // Attach author name/email for display.
    const out = [];
    for (const r of rows) {
      const author = await ctx.db.get(r.userId);
      out.push({
        _id: r._id,
        text: r.text,
        createdAt: r.createdAt,
        slideId: r.slideId,
        author: author?.name || author?.email || "User",
      });
    }
    return out;
  },
});

export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const c = await ctx.db.get(args.id);
    if (!c) return { success: true };
    if (c.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
