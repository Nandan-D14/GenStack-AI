/**
 * Lightweight, dependency-free text embedding used for retrieval (RAG).
 *
 * This produces a fixed-dimension, L2-normalized hashed bag-of-words vector.
 * It is deterministic and runs anywhere (no external embedding API needed),
 * which keeps ingestion/search working in any environment. It can be swapped
 * for a hosted embedding model later as long as EMBEDDING_DIM is updated to
 * match and the Convex vector index dimension is changed accordingly.
 */

export const EMBEDDING_DIM = 256;

function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function embedText(text: string): number[] {
  const vec = new Array(EMBEDDING_DIM).fill(0);
  const tokens = (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(
    (t) => t.length > 1,
  );
  for (const tok of tokens) {
    vec[fnv1a(tok) % EMBEDDING_DIM] += 1;
  }
  let norm = 0;
  for (const x of vec) norm += x * x;
  norm = Math.sqrt(norm) || 1;
  return vec.map((x) => x / norm);
}

/** Splits text into overlapping ~maxChars chunks on whitespace boundaries. */
export function chunkText(text: string, maxChars = 900, overlap = 120): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + maxChars, clean.length);
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end);
      if (lastSpace > start + maxChars * 0.6) end = lastSpace;
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = end - overlap;
  }
  return chunks;
}
