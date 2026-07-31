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

const brandArgs = {
  name: v.string(),
  primaryColor: v.string(),
  secondaryColor: v.string(),
  accentColor: v.string(),
  backgroundColor: v.string(),
  textColor: v.string(),
  headingFont: v.string(),
  bodyFont: v.string(),
  logoUrl: v.optional(v.string()),
  logoPosition: v.optional(v.string()),
};

/** List the current user's brand kits. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return [];
    const all = await ctx.db.query("brandKits").collect();
    return all.filter((b) => b.userId === userId);
  },
});

export const create = mutation({
  args: brandArgs,
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return await ctx.db.insert("brandKits", {
      ...args,
      logoPosition: args.logoPosition || "none",
      userId,
      createdAt: new Date().toISOString(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("brandKits"), ...brandArgs },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const kit = await ctx.db.get(args.id);
    if (!kit || kit.userId !== userId) throw new Error("Unauthorized");
    const { id, ...rest } = args;
    await ctx.db.patch(id, { ...rest, logoPosition: rest.logoPosition || "none" });
    return { success: true };
  },
});

export const remove = mutation({
  args: { id: v.id("brandKits") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const kit = await ctx.db.get(args.id);
    if (!kit || kit.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/** Attach (or clear) a brand kit on a deck. */
export const setForDeck = mutation({
  args: {
    deckId: v.id("decks"),
    brandKitId: v.optional(v.id("brandKits")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const deck = await ctx.db.get(args.deckId);
    if (!deck || deck.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.deckId, {
      brandKitId: args.brandKitId,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});
