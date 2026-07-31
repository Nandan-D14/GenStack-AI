/**
 * Shared per-layout content contracts. These are the single source of truth for
 * how each slide layout should be filled, used by every generation/edit prompt
 * so the rules never drift between routes.
 */

export const LAYOUT_GUIDE: Record<string, string> = {
  title:
    '"title": opening hero slide. 1-2 bullets used as a subtitle / value proposition.',
  content:
    '"content": 4-5 substantive bullets, each 8-15 words with specific, concrete info (no filler).',
  data:
    '"data": 3-4 bullets in strict "NUMBER: Description" format (e.g. "$4.2B: Market size by 2027").',
  chart:
    '"chart": 3-4 bullets as timeline phases/periods with metrics (e.g. "Phase 1: Launch, 50 pilot users").',
  quote:
    '"quote": EXACTLY 2 bullets: ["The quote text", "— Author Name, Title"].',
  two_column:
    '"two_column": EXACTLY 6 bullets (first 3 = left column, last 3 = right column), parallel structure.',
  closing:
    '"closing": 3 bullets as concrete, specific action items or key takeaways.',
};

/** Compact list of every layout rule, for whole-deck prompts. */
export function allLayoutRules(): string {
  return Object.values(LAYOUT_GUIDE)
    .map((r) => `- ${r}`)
    .join("\n");
}

/** Detailed rules for a single layout, tailored with the slide's purpose. */
export function layoutRulesFor(layout: string, description: string): string {
  const rules: Record<string, string> = {
    title: `TITLE SLIDE RULES:
- Generate 1-2 bullets as subtitle text (the deck's value proposition or tagline)
- Make the title compelling and attention-grabbing
- Speaker notes: 2-3 sentences to welcome the audience and set the stage`,
    content: `CONTENT SLIDE RULES:
- Generate 4-5 substantive bullet points
- Each bullet MUST be 8-15 words with specific, actionable information
- NO filler phrases like "Key point about..." or "Supporting detail..."
- Include real examples, specific strategies, or concrete details relevant to "${description}"
- Speaker notes: 3-4 sentences that expand on the bullets with additional context`,
    data: `DATA/METRICS SLIDE RULES:
- Generate 3-4 bullets in STRICT format: "NUMBER: Description"
- Examples: "$4.2B: Total addressable market by 2027", "67%: Users reporting measurable improvement"
- Use realistic, specific numbers that are plausible for this topic
- Each metric must directly support: "${description}"
- Speaker notes: Explain the significance of each metric`,
    chart: `CHART/TIMELINE SLIDE RULES:
- Generate 3-4 bullets representing phases, time periods, or data progression
- Format: "Phase/Period: Description with specific metric"
- Show a clear progression or growth trajectory
- Speaker notes: Narrate the data story and what drives each phase`,
    quote: `QUOTE SLIDE RULES:
- Generate EXACTLY 2 bullets:
  * First: a compelling, authentic-sounding quote relevant to "${description}" (20-40 words)
  * Second: "— Author Name, Title/Role"
- Speaker notes: 2-3 sentences of context for why this quote matters`,
    two_column: `TWO-COLUMN COMPARISON SLIDE RULES:
- Generate EXACTLY 6 bullets: first 3 for LEFT column, last 3 for RIGHT column
- Each bullet: 8-12 words, specific and parallel in structure
- The two columns represent a clear contrast/comparison related to "${description}"
- Speaker notes: Explain the comparison and why it matters`,
    closing: `CLOSING/CTA SLIDE RULES:
- Generate 3 bullets as concrete action items or key takeaways
- Each should be a specific, actionable next step (not vague)
- Speaker notes: Strong closing statement that reinforces the core message`,
  };
  return rules[layout] || rules["content"];
}
