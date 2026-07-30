import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Read-only user lookup from the authenticated identity.
async function getUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .unique();
  return user?._id ?? null;
}

// Create-or-get user (for mutations that must persist against a user).
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

/** Returns the current user's long-term memory record (or null). */
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("userMemory")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

/** Creates or updates the current user's long-term memory. */
export const upsert = mutation({
  args: {
    notes: v.optional(v.string()),
    preferences: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("userMemory")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.notes !== undefined ? { notes: args.notes } : {}),
        ...(args.preferences !== undefined
          ? { preferences: args.preferences }
          : {}),
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("userMemory", {
      userId,
      notes: args.notes,
      preferences: args.preferences,
      updatedAt: now,
    });
  },
});
