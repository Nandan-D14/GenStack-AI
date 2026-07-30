import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { getAIClient, extractJson } from "@/server/ai";

type ChatRole = "system" | "user" | "assistant";
export type ChatTurn = { role: ChatRole; content: string };

export class StructuredGenerationError extends Error {
  constructor(
    message: string,
    public readonly lastRaw?: string,
  ) {
    super(message);
    this.name = "StructuredGenerationError";
  }
}

/**
 * Lightweight usage record for observability (tokens/latency/retries/cost).
 * Currently logged to the server console; a future store can subscribe to this.
 */
export type UsageRecord = {
  task: string;
  model: string;
  ok: boolean;
  attempts: number;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export function recordUsage(u: UsageRecord) {
  try {
    console.log(
      `[ai.usage] task=${u.task} model=${u.model} ok=${u.ok} attempts=${u.attempts} latencyMs=${u.latencyMs} tokens=${u.totalTokens ?? "?"}`,
    );
  } catch {
    /* no-op */
  }
}

export type GenerateStructuredOptions<T extends z.ZodTypeAny> = {
  /** Task name for logging/observability. */
  task: string;
  /** Zod schema the output must satisfy. */
  schema: T;
  /** Human-readable schema name (used in the JSON-schema hint). */
  schemaName?: string;
  /** Either provide system+user, or a full messages array. */
  system?: string;
  user?: string;
  messages?: ChatTurn[];
  /** Max self-correction retries after the first attempt (default 2). */
  maxRetries?: number;
  temperature?: number;
  /** Normalize the parsed JSON before validation (e.g. array -> { slides }). */
  transform?: (candidate: unknown) => unknown;
};

/**
 * Calls the configured LLM and returns data validated against `schema`.
 *
 * Strategy (provider-agnostic, works with the MiniMax/NVIDIA endpoints that do
 * not support strict json_schema decoding):
 *  1. Append a compact JSON-schema hint to the system prompt.
 *  2. Parse the reply with extractJson, then validate with Zod.
 *  3. On parse/validation failure, feed the error back to the model and retry
 *     (bounded), so it can self-correct. Throws StructuredGenerationError if all
 *     attempts fail so callers can apply a graceful fallback.
 */
export async function generateStructured<T extends z.ZodTypeAny>(
  opts: GenerateStructuredOptions<T>,
): Promise<z.infer<T>> {
  const { client, model } = getAIClient();
  const maxRetries = opts.maxRetries ?? 2;

  const jsonSchema = zodToJsonSchema(opts.schema, opts.schemaName ?? "Output");
  const schemaHint = `\n\nIMPORTANT: Respond with ONLY a single JSON value that strictly conforms to this JSON Schema. No markdown fences, no commentary:\n${JSON.stringify(jsonSchema)}`;

  const messages: ChatTurn[] = opts.messages
    ? opts.messages.map((m) => ({ ...m }))
    : [
        { role: "system", content: (opts.system ?? "") + schemaHint },
        { role: "user", content: opts.user ?? "" },
      ];

  // When a full messages array is supplied, fold the schema hint into the
  // first system message so the contract is always present.
  if (opts.messages) {
    const sys = messages.find((m) => m.role === "system");
    if (sys) sys.content += schemaHint;
    else messages.unshift({ role: "system", content: schemaHint.trim() });
  }

  const started = Date.now();
  let lastError = "unknown error";
  let lastRaw = "";
  let totalTokens: number | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        ...(opts.temperature !== undefined
          ? { temperature: opts.temperature }
          : {}),
      });

      const usage = response?.usage;
      if (usage?.total_tokens) totalTokens = usage.total_tokens;

      const raw = response.choices?.[0]?.message?.content ?? "";
      lastRaw = raw;

      let candidate: unknown;
      try {
        candidate = extractJson(raw);
      } catch (e: any) {
        lastError = `Output was not valid JSON: ${e.message}`;
        messages.push({ role: "assistant", content: raw });
        messages.push({
          role: "user",
          content: `${lastError}. Return ONLY valid JSON matching the required schema.`,
        });
        continue;
      }

      const normalized = opts.transform ? opts.transform(candidate) : candidate;
      const parsed = opts.schema.safeParse(normalized);
      if (parsed.success) {
        recordUsage({
          task: opts.task,
          model,
          ok: true,
          attempts: attempt + 1,
          latencyMs: Date.now() - started,
          totalTokens,
        });
        return parsed.data;
      }

      lastError = parsed.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content: `Your JSON did not match the schema. Validation errors: ${lastError}. Return ONLY corrected JSON that fixes these issues.`,
      });
    } catch (err: any) {
      lastError = err?.message || String(err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  }

  recordUsage({
    task: opts.task,
    model,
    ok: false,
    attempts: maxRetries + 1,
    latencyMs: Date.now() - started,
    totalTokens,
  });
  throw new StructuredGenerationError(lastError, lastRaw);
}
