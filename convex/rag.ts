import {
  action,
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { embedText, chunkText, EMBEDDING_DIM } from "./embedding";

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Internal: persist pre-embedded chunks (called by ingestion actions).
export const insertChunks = internalMutation({
  args: {
    deckId: v.id("decks"),
    source: v.string(),
    chunks: v.array(v.object({ text: v.string(), embedding: v.array(v.float64()) })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    let i = 0;
    for (const c of args.chunks) {
      await ctx.db.insert("documents", {
        deckId: args.deckId,
        source: args.source,
        chunkIndex: i++,
        text: c.text,
        embedding: c.embedding,
        createdAt: now,
      });
    }
    return { inserted: args.chunks.length };
  },
});

// Ingest raw text (e.g. pasted notes) for a deck.
export const ingestText = mutation({
  args: {
    deckId: v.id("decks"),
    source: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const deck = await ctx.db.get(args.deckId);
    if (!deck) throw new Error("Deck not found");
    const chunks = chunkText(args.text);
    const now = new Date().toISOString();
    for (let i = 0; i < chunks.length; i++) {
      await ctx.db.insert("documents", {
        deckId: args.deckId,
        source: args.source,
        chunkIndex: i,
        text: chunks[i],
        embedding: embedText(chunks[i]),
        createdAt: now,
      });
    }
    return { inserted: chunks.length };
  },
});

// Ingest the readable text of a URL for a deck.
export const ingestUrl = action({
  args: { deckId: v.id("decks"), url: v.string() },
  handler: async (ctx, args): Promise<{ inserted: number }> => {
    let text = "";
    try {
      const res = await fetch(args.url, {
        headers: { "User-Agent": "GenStackAI/1.0" },
      });
      const html = await res.text();
      text = stripHtml(html);
    } catch (e) {
      return { inserted: 0 };
    }
    const chunks = chunkText(text).slice(0, 40);
    if (chunks.length === 0) return { inserted: 0 };
    await ctx.runMutation(internal.rag.insertChunks, {
      deckId: args.deckId,
      source: args.url,
      chunks: chunks.map((t) => ({ text: t, embedding: embedText(t) })),
    });
    return { inserted: chunks.length };
  },
});

// Ingest the text content of an uploaded file (best-effort; text-like files).
export const ingestStorage = action({
  args: { deckId: v.id("decks"), storageId: v.string(), fileName: v.string() },
  handler: async (ctx, args): Promise<{ inserted: number }> => {
    let text = "";
    try {
      const blob = await ctx.storage.get(args.storageId);
      if (!blob) return { inserted: 0 };
      text = await blob.text();
    } catch {
      return { inserted: 0 };
    }
    // Guard against binary formats we cannot parse here (e.g. PDF/DOCX).
    const printableRatio =
      (text.match(/[\x09\x0A\x0D\x20-\x7E]/g)?.length || 0) /
      Math.max(text.length, 1);
    if (printableRatio < 0.85) return { inserted: 0 };

    const chunks = chunkText(text).slice(0, 40);
    if (chunks.length === 0) return { inserted: 0 };
    await ctx.runMutation(internal.rag.insertChunks, {
      deckId: args.deckId,
      source: args.fileName,
      chunks: chunks.map((t) => ({ text: t, embedding: embedText(t) })),
    });
    return { inserted: chunks.length };
  },
});

// Internal query: fetch chunk texts by id (used after vector search).
export const getChunksByIds = internalQuery({
  args: { ids: v.array(v.id("documents")) },
  handler: async (ctx, args) => {
    const out: { text: string; source: string }[] = [];
    for (const id of args.ids) {
      const doc = await ctx.db.get(id);
      if (doc) out.push({ text: doc.text, source: doc.source });
    }
    return out;
  },
});

// Semantic search over a deck's ingested documents.
export const search = action({
  args: { deckId: v.id("decks"), query: v.string(), k: v.optional(v.float64()) },
  handler: async (
    ctx,
    args,
  ): Promise<{ text: string; source: string }[]> => {
    const vector = embedText(args.query);
    if (vector.length !== EMBEDDING_DIM) return [];
    const results = await ctx.vectorSearch("documents", "by_embedding", {
      vector,
      limit: Math.min(Math.max(args.k ?? 4, 1), 10),
      filter: (q) => q.eq("deckId", args.deckId),
    });
    if (results.length === 0) return [];
    const chunks = await ctx.runQuery(internal.rag.getChunksByIds, {
      ids: results.map((r) => r._id),
    });
    return chunks;
  },
});

// Whether a deck has any ingested source documents.
export const hasDocuments = query({
  args: { deckId: v.id("decks") },
  handler: async (ctx, args) => {
    const one = await ctx.db
      .query("documents")
      .withIndex("by_deckId", (q) => q.eq("deckId", args.deckId))
      .first();
    return !!one;
  },
});
