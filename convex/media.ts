import { query, mutation } from "./_generated/server";
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

/**
 * Generate a secure upload URL using Convex File Storage.
 * The client will perform a POST request to this URL.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getOrCreateUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Save the file metadata to the database after successful upload.
 * Resolves the storageId into a public URL.
 */
export const saveFile = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Resolve the storageId to get a public URL
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new Error("Failed to generate file URL from storage");
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("mediaFiles", {
      userId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileUrl,
      fileType: args.fileType,
      fileSize: args.fileSize,
      createdAt: now,
    });
  },
});

/**
 * List all media files for the current user.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getOrCreateUser(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("mediaFiles")
      // Filter in-memory or by index (we can add index later if needed)
      .collect()
      .then((files) => files.filter((f) => f.userId === userId));
  },
});

/**
 * Delete a media file from both database and storage.
 */
export const deleteFile = mutation({
  args: {
    id: v.id("mediaFiles"),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const file = await ctx.db.get(args.id);
    if (!file) {
      throw new Error("File not found");
    }

    if (file.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete from Convex File Storage
    await ctx.storage.delete(file.storageId);

    // Delete from database
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
