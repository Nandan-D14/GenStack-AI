import { z } from "zod";

/**
 * Central Zod schemas for all AI-generated structures in GenStack AI.
 * These are the single source of truth for validating LLM output before it
 * ever reaches Convex or the UI. See src/server/generate.ts for the
 * validation + retry loop that consumes them.
 */

export const LAYOUTS = [
  "title",
  "content",
  "data",
  "chart",
  "quote",
  "two_column",
  "closing",
] as const;

export type Layout = (typeof LAYOUTS)[number];

export const LayoutEnum = z.enum(LAYOUTS);

/** A single item in a presentation plan/outline. */
export const PlanItemSchema = z.object({
  id: z.string().optional(),
  order: z.number().optional(),
  title: z.string().min(1),
  layout: LayoutEnum,
  description: z.string().min(1),
});
export type PlanItem = z.infer<typeof PlanItemSchema>;

/** Response from the conversational planner (/api/plan-chat). */
export const PlanChatResponseSchema = z.object({
  message: z.string().min(1),
  plan: z.array(PlanItemSchema).nullable().optional(),
  action: z.enum(["chat", "plan_create", "plan_update"]).optional(),
});
export type PlanChatResponse = z.infer<typeof PlanChatResponseSchema>;

/** A single generated slide's content. */
export const SlideSchema = z.object({
  title: z.string().min(1),
  layout: LayoutEnum,
  bullets: z.array(z.string()),
  speakerNotes: z.string().optional().default(""),
});
export type Slide = z.infer<typeof SlideSchema>;

/** Response for a single-slide generation (/api/generate-single-slide). */
export const SlideResponseSchema = SlideSchema;

/** Response for a full-deck generation (/api/generate-slides, /api/edit-slides). */
export const SlidesResponseSchema = z.object({
  slides: z.array(SlideSchema).min(1),
});
export type SlidesResponse = z.infer<typeof SlidesResponseSchema>;

/** Partial slide update returned by the per-slide copilot (/api/chat-slide). */
export const SlideUpdateSchema = z.object({
  title: z.string().nullable().optional(),
  bullets: z.array(z.string()).nullable().optional(),
  speakerNotes: z.string().nullable().optional(),
  layout: LayoutEnum.nullable().optional(),
});

export const ChatSlideResponseSchema = z.object({
  reply: z.string().min(1),
  slideUpdate: SlideUpdateSchema.nullable().optional(),
});
export type ChatSlideResponse = z.infer<typeof ChatSlideResponseSchema>;

/**
 * Accepts either a bare array of slides or an object with a `slides` key and
 * normalizes it to `{ slides: [...] }`. LLMs frequently disagree on which shape
 * to return, so we accept both before validation.
 */
export function normalizeSlidesPayload(candidate: unknown): unknown {
  if (Array.isArray(candidate)) return { slides: candidate };
  return candidate;
}
