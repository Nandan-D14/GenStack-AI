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

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const now = new Date().toISOString();
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      ownerId: userId,
      createdAt: now,
    });
    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "owner",
    });
    return workspaceId;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", identity.email))
      .unique();
    if (!user) return [];
    const memberships = await ctx.db.query("workspaceMembers").collect();
    const mine = memberships.filter((m) => m.userId === user._id);
    const out = [];
    for (const m of mine) {
      const ws = await ctx.db.get(m.workspaceId);
      if (ws) out.push({ ...ws, role: m.role });
    }
    return out;
  },
});
