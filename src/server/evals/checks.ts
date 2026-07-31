import { SlideSchema, type Slide } from "../schemas";

export type Severity = "error" | "warning";
export type Issue = { severity: Severity; message: string };
export type EvalResult = { ok: boolean; issues: Issue[] };

const FILLER_PATTERNS = [
  /key point about/i,
  /supporting detail/i,
  /\bplaceholder\b/i,
  /\blorem ipsum\b/i,
  /\btext here\b/i,
  /\btbd\b/i,
  /\btodo\b/i,
  /\bpoint (one|two|three)\b/i,
];

function hasFiller(text: string): boolean {
  return FILLER_PATTERNS.some((re) => re.test(text));
}

/** Evaluates a single slide against schema + per-layout content contracts. */
export function evaluateSlide(raw: unknown): EvalResult {
  const issues: Issue[] = [];

  const parsed = SlideSchema.safeParse(raw);
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      issues.push({
        severity: "error",
        message: `schema: ${i.path.join(".") || "(root)"} ${i.message}`,
      });
    }
    return { ok: false, issues };
  }

  const slide: Slide = parsed.data;
  const bullets = slide.bullets;

  for (const b of bullets) {
    if (hasFiller(b)) {
      issues.push({ severity: "warning", message: `filler bullet: "${b}"` });
    }
  }

  switch (slide.layout) {
    case "quote":
      if (bullets.length !== 2)
        issues.push({
          severity: "warning",
          message: `quote should have exactly 2 bullets (got ${bullets.length})`,
        });
      break;
    case "data":
      for (const b of bullets) {
        if (!(b.includes(":") && /\d/.test(b.split(":")[0]))) {
          issues.push({
            severity: "warning",
            message: `data bullet not in "NUMBER: Description" format: "${b}"`,
          });
        }
      }
      break;
    case "two_column":
      if (bullets.length !== 6)
        issues.push({
          severity: "warning",
          message: `two_column should have 6 bullets (got ${bullets.length})`,
        });
      break;
    case "content":
      if (bullets.length < 3)
        issues.push({
          severity: "warning",
          message: `content should have 3-5 bullets (got ${bullets.length})`,
        });
      break;
    case "closing":
      if (bullets.length < 1)
        issues.push({ severity: "warning", message: "closing should have action items" });
      break;
  }

  const ok = issues.every((i) => i.severity !== "error");
  return { ok, issues };
}

/** Evaluates a whole deck; also checks title-first / closing-last structure. */
export function evaluateDeck(slides: unknown[]): EvalResult {
  const issues: Issue[] = [];
  if (!Array.isArray(slides) || slides.length === 0) {
    return { ok: false, issues: [{ severity: "error", message: "no slides" }] };
  }
  slides.forEach((s, i) => {
    const r = evaluateSlide(s);
    for (const issue of r.issues) {
      issues.push({ ...issue, message: `slide ${i + 1}: ${issue.message}` });
    }
  });
  const first = slides[0] as any;
  const last = slides[slides.length - 1] as any;
  if (first?.layout !== "title")
    issues.push({ severity: "warning", message: "first slide should be 'title'" });
  if (last?.layout !== "closing")
    issues.push({ severity: "warning", message: "last slide should be 'closing'" });

  const ok = issues.every((i) => i.severity !== "error");
  return { ok, issues };
}
