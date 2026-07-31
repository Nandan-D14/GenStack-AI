/**
 * Built-in deck templates. Selecting one creates a deck pre-seeded with a plan
 * so users can jump straight into generation/editing.
 */

export type TemplatePlanItem = {
  title: string;
  layout: "title" | "content" | "data" | "chart" | "quote" | "two_column" | "closing";
  description: string;
};

export type DeckTemplate = {
  id: string;
  name: string;
  description: string;
  type: string;
  tone: string;
  audience: string;
  accent: string;
  plan: TemplatePlanItem[];
};

export const TEMPLATES: DeckTemplate[] = [
  {
    id: "startup-pitch",
    name: "Startup Pitch",
    description: "Investor-ready pitch: problem, solution, market, traction, ask.",
    type: "pitch",
    tone: "persuasive",
    audience: "Investors",
    accent: "#7170FF",
    plan: [
      { title: "Company Vision", layout: "title", description: "One-line vision and the category you are creating." },
      { title: "The Problem", layout: "content", description: "The painful, urgent problem your customers face today." },
      { title: "The Solution", layout: "content", description: "How your product solves the problem uniquely." },
      { title: "Market Opportunity", layout: "data", description: "TAM/SAM/SOM with credible numbers." },
      { title: "Traction", layout: "chart", description: "Growth metrics and key milestones over time." },
      { title: "The Ask", layout: "closing", description: "Raise amount, use of funds, and next milestones." },
    ],
  },
  {
    id: "sales-deck",
    name: "Sales Deck",
    description: "Consultative B2B sales narrative that drives to a next step.",
    type: "sales",
    tone: "professional",
    audience: "Prospective customers",
    accent: "#0075DE",
    plan: [
      { title: "Why We're Here", layout: "title", description: "Frame the meeting around the prospect's goal." },
      { title: "Your Challenges", layout: "content", description: "The specific pains this buyer is experiencing." },
      { title: "Our Approach", layout: "two_column", description: "Before vs after with your solution." },
      { title: "Proven Results", layout: "data", description: "Outcome metrics from comparable customers." },
      { title: "Next Steps", layout: "closing", description: "A concrete, low-friction next action." },
    ],
  },
  {
    id: "quarterly-review",
    name: "Quarterly Business Review",
    description: "Executive QBR: results, insights, risks, and the plan ahead.",
    type: "report",
    tone: "formal",
    audience: "Executive Board",
    accent: "#22C55E",
    plan: [
      { title: "Quarter in Review", layout: "title", description: "Headline outcome for the quarter." },
      { title: "Results vs Goals", layout: "data", description: "KPIs against targets with variance." },
      { title: "What Worked / What Didn't", layout: "two_column", description: "Wins vs misses and lessons learned." },
      { title: "Risks & Mitigations", layout: "content", description: "Top risks and how you'll address them." },
      { title: "Plan for Next Quarter", layout: "closing", description: "Priorities and commitments." },
    ],
  },
];

export function getTemplate(id: string): DeckTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
