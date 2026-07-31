# AGENTS.md — GenStack AI

GenStack AI is a Next.js 15 (App Router) + React 19 app with a Convex backend and
Clerk auth. It turns a prompt/notes/PDF/URL into an editable slide deck. See
`README.md`, `AGENT.md`, and `DESIGN.md` for product/architecture details.

## Cursor Cloud specific instructions

### Install (important)
- Dependencies require `npm install --legacy-peer-deps`. Plain `npm install` fails
  with an ERESOLVE conflict: `@crayonai/*`/`@thesysai/genui-sdk` peer on
  `tailwind-merge@2` while HeroUI needs `tailwind-merge@3`. The committed lockfile
  already encodes a working nested resolution.

### Services (two local processes)
- Convex backend and the Next.js dev server must both run. Standard commands:
  `npx convex dev` and `npm run dev` (see `package.json`). No tests exist;
  `npm run lint` is not configured (interactive `next lint` prompt). `npm run eval`
  runs the offline AI eval harness.

### Convex (non-obvious)
- The Convex CLI needs login or a deploy key. For account-free local dev use
  `CONVEX_AGENT_MODE=anonymous npx convex dev`. Because Convex schema/function
  changes must be pushed to a deployment, develop Convex changes against this
  local deployment (the app still authenticates with the real Clerk instance when
  `CLERK_JWT_ISSUER_DOMAIN` is set on the deployment via `npx convex env set`).
- `convex/auth.config.ts` reads `CLERK_JWT_ISSUER_DOMAIN`; Convex requires it be
  set on the deployment (the JS `||` fallback is not enough) or `convex dev` fails.
- Vector search (RAG, `convex/rag.ts`) uses the 256-dim hashed embedding in
  `convex/embedding.ts`. If you swap in a hosted embedding model, update both
  `EMBEDDING_DIM` and the `documents` vector index `dimensions` in `convex/schema.ts`.

### Env / connecting the app to a deployment
- `.env.local` (git-ignored) holds `NEXT_PUBLIC_CONVEX_URL` etc. Next.js inlines
  `NEXT_PUBLIC_*` at build time and process-env values win over `.env.local`, so
  after changing which Convex URL the app uses you must clear `.next` and restart
  `next dev` for the client bundle to pick it up.

### AI architecture (where things live)
- All AI routes are under `src/app/api/*`. They use the validated structured-output
  helper `src/server/generate.ts` (Zod schemas in `src/server/schemas.ts`) — never
  raw prompt-and-parse. Prompts live in the registry `src/server/prompts/` and pull
  design guidance from `PPT Skills/*.SKILL.md`.
- Optional provider env vars: `NVIDIA_API_KEY`/`NVIDIA_BASE_URL` (text, primary),
  `THESYS_API_KEY` (C1 template slides), and `IMAGE_API_KEY`/`IMAGE_BASE_URL`
  (text-to-image; falls back to keyless on-topic stock images when unset).
- The MiniMax-M3 text model is slow (~100s/call); slide generation is parallelized
  with bounded concurrency in `src/app/deck/[id]/plan/page.tsx`.

### UI theme (Beautiful UI–inspired)
- Design tokens live in `src/styles/tokens.css` and `tailwind.config.ts` under the
  `gs-*` palette (near-black surfaces, hairline borders, GenStack violet `#7170FF`).
- Shared primitives: `src/components/ui/*` and workspace chrome `src/components/AppShell.tsx`.
- Prefer `gs-*` utilities / `.gs-*` component classes over one-off zinc hexes when
  restyling pages.
