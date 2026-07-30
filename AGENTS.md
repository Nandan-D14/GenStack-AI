# AGENTS.md — GenStack AI

GenStack AI is a single Next.js 15 (App Router) + React 19 web app for AI-assisted
presentation creation. Backend/data is **Convex**; auth is **Clerk**. See `README.md`,
`AGENT.md`, and `DESIGN.md` for product/architecture details.

## Cursor Cloud specific instructions

### Services & how to run them
This is a single product with two local processes. There are no tests in the repo.

| Service | Command | Notes |
|---------|---------|-------|
| Convex backend | `CONVEX_AGENT_MODE=anonymous npx convex dev` | Runs a fully local, account-free Convex deployment on `127.0.0.1:3210`. |
| Next.js web app | `npm run dev` | Serves the UI on `http://localhost:3000`. |

Run each in its own long-lived shell (e.g. tmux); both must be running for the app to work.

### Convex (non-obvious)
- The Convex CLI normally requires login. Use `CONVEX_AGENT_MODE=anonymous` to run a
  local anonymous deployment with no Convex account. This is required in this environment.
- `npx convex dev` writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` into `.env.local`
  (git-ignored). `.env.local` does not exist on a fresh VM — run Convex once to create it
  before/while starting the Next.js server.
- `convex/auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN`. Convex requires this env var to
  be **set on the deployment** (the JS `||` fallback is not enough) or `convex dev` fails to
  push. Set it with: `CONVEX_AGENT_MODE=anonymous npx convex env set CLERK_JWT_ISSUER_DOMAIN "<clerk-issuer-url>"`.
- Deployment env vars live on the Convex deployment, not `.env.local`. Manage them with
  `npx convex env set/list` (prefix with `CONVEX_AGENT_MODE=anonymous`).

### Clerk auth (important limitation)
- With no Clerk keys set, `@clerk/nextjs` runs in **keyless mode**: the UI renders and
  Clerk auto-provisions a temporary dev instance, but this is NOT enough to authenticate
  to Convex.
- The Convex↔Clerk bridge (`ConvexProviderWithClerk`) requests `getToken({ template: "convex" })`.
  Authenticated flows (`decks.create/list/getById`, `media.*`) only work when a Clerk app has a
  **"convex" JWT template** (or Clerk's Convex integration) configured, with matching
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `CLERK_JWT_ISSUER_DOMAIN`
  (frontend + Convex deployment). Without this, the dashboard shows an empty list and deck
  creation throws "Unauthorized".
- The mock generation/export functions themselves are NOT auth-gated: `decks.generateOutline`,
  `decks.exportDeck`, and everything in `slides.ts` only require an existing `deckId`. You can
  exercise the core generation pipeline directly, e.g.
  `CONVEX_AGENT_MODE=anonymous npx convex run decks:generateOutline '{"deckId":"<id>","prompt":"..."}'`.

### Known pre-existing bugs (not environment issues)
- `decks.exportDeck` throws `ReferenceError: Buffer is not defined` — it uses Node's `Buffer`
  in Convex's V8 runtime, which has no `Buffer`. Export is currently broken regardless of setup.

### Lint / build
- `npm run lint` is **not configured** (no ESLint config); `next lint` drops into an
  interactive setup prompt and does not run in CI/non-interactive shells.
- `npm run build` works and type-checks the whole app.
- AI generation and PPTX/PDF export are currently **mocked** inside Convex functions; the real
  AI/export code in `src/server/` is not wired up. No external API keys are needed for local dev.
