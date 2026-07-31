/**
 * Offline eval harness for AI slide output. Runs the check library against
 * golden + adversarial fixtures so we can catch prompt/model regressions
 * without spending on live LLM calls. Run with: `npm run eval`.
 *
 * For a live check against the running dev server, set EVAL_LIVE_URL to a
 * generate-slides endpoint; the script will additionally score its output.
 */
import { evaluateSlide, evaluateDeck } from "../src/server/evals/checks";
import { GOOD_DECK, BAD_SLIDES } from "../src/server/evals/fixtures";

let failures = 0;
const pass = (m: string) => console.log(`  \u2713 ${m}`);
const fail = (m: string) => {
  console.error(`  \u2717 ${m}`);
  failures++;
};

console.log("== Eval: golden deck should be clean ==");
const deckResult = evaluateDeck(GOOD_DECK);
if (deckResult.ok && deckResult.issues.length === 0) {
  pass("golden deck passes with no issues");
} else {
  fail(
    `golden deck had issues: ${deckResult.issues
      .map((i) => `[${i.severity}] ${i.message}`)
      .join("; ")}`,
  );
}

console.log("\n== Eval: adversarial slides should surface expected issues ==");
for (const c of BAD_SLIDES) {
  const r = evaluateSlide(c.slide);
  const matched = r.issues.some((i) => c.expect.test(i.message));
  if (matched) pass(`${c.name} -> detected (${c.expect})`);
  else
    fail(
      `${c.name} -> expected ${c.expect} but got: ${r.issues
        .map((i) => i.message)
        .join("; ") || "no issues"}`,
    );
}

async function live() {
  const url = process.env.EVAL_LIVE_URL;
  if (!url) return;
  console.log(`\n== Eval (live): ${url} ==`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "The business case for a four-day work week",
        deckId: "eval",
        slidesCount: 4,
      }),
    });
    const data = await res.json();
    const r = evaluateDeck(data.slides || []);
    console.log(
      `  live deck ok=${r.ok} issues=${r.issues.length}: ${r.issues
        .map((i) => i.message)
        .join("; ")}`,
    );
    if (!r.ok) failures++;
  } catch (e: any) {
    fail(`live eval error: ${e.message}`);
  }
}

live().finally(() => {
  console.log(`\n${failures === 0 ? "ALL EVALS PASSED" : `${failures} EVAL(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
});
