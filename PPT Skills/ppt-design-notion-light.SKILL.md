---
name: ppt-design-notion-light
description: "Produce PowerPoint slide design specifications (layout wireframes, color palette, typography, component styling) in the 'Notion Productivity Light' brand system — bold editorial typography, mostly white canvas, one vivid blue accent (#455DD3), minimal chrome. Use whenever the user asks for slide/deck design direction, a redesign concept, or layout ideas in this specific brand style. This skill outputs a design specification only — it does NOT generate an actual .pptx file. For an actual file, the resulting spec should be handed to a PPTX-generation tool/skill."
---

# PPT Design — Notion Productivity Light

## Scope

This skill produces **design specifications**: layout wireframes, color/typography direction, and component styling for individual slides, in a single fixed brand system. It does not write or assemble an actual `.pptx` file. If the user wants a real file produced, say so explicitly and hand the resulting spec + slide content to a PPTX-generation tool — don't attempt to fabricate slide XML here.

This is a single-theme skill. If the user asks for a different visual style, say so rather than silently drifting from these tokens.

---

## Design Tokens (source system)

These values come directly from the brand spec. Don't invent colors, fonts, or sizes outside this list — that's what keeps every slide on-brand.

**Colors**

| Token | Hex | Use |
|---|---|---|
| primary | `#455DD3` | The one accent color — single key emphasis per slide |
| secondary | `#213183` | Deeper indigo, stronger emphasis/contrast moments |
| tertiary | `#0075DE` | Link-style blue — captions, sources, inline callouts |
| on-surface / text | `#000000` | Headlines and body copy |
| surface / background | `#FFFFFF` | Dominant canvas color |
| border | `#0000001A` | Hairline card outlines (~10% black) |
| muted | `#F5F5F5` | Tag/chip backgrounds, low-emphasis fills |
| success | `#22C55E` | Sparingly — positive stats/status only |

**Typography** — family: NotionInter, fallback Inter. Headlines are bold with tight negative tracking; body stays light-weight and compact. Sentence case throughout — no all-caps labels.

| Token | Size | Weight | Tracking |
|---|---|---|---|
| headline-display | 64px | 700 | -2.1px |
| headline-lg | 44px | 700 | -0.75px |
| headline-md | 30px | 400 | 0 |
| headline-sm | 20px | 400 | 0 |
| body-lg / body-md / body-sm | 16 / 14 / 12px | 400 | 0 |
| label-lg / label-md / label-sm | 16 / 14 / 12px | 500 | 0 |

**Shape & spacing**: radii — sm 4px, md 8px, lg 12px, full (pill). Spacing scale — xs 8px, sm 16px, md 24px, lg 50px, xl 70px, xxl 100px. Flat system: thin borders and whitespace do the work, not shadows.

---

## Adapting the system to a slide canvas

The source tokens are web UI values (px, hover states, inputs). A slide is a different physical/viewing context, so this is a deliberate adaptation, not a literal unit conversion — flagging that so it's not mistaken for precision it doesn't have.

**Typography → slide scale** (16:9 canvas, NotionInter/Inter throughout)

| Slide role | Size | Weight | Notes |
|---|---|---|---|
| Title slide headline | 40–44pt | 700 | Tight tracking, analogous to headline-display |
| Section/content header | 28–32pt | 700 | Analogous to headline-lg |
| Subhead | 18–20pt | 400 | Analogous to headline-md/sm |
| Body text | 14–16pt | 400 | Analogous to body-lg/md |
| Caption / source | 10–11pt | 400 | Often in tertiary blue, analogous to body-sm |
| Tag / label text | 10–11pt | 500 | Sentence case, analogous to label-sm |

**Spacing → slide margins** (13.33" × 7.5" canvas)

| Token | Slide use | Approx. |
|---|---|---|
| xs | Chip/tag internal padding | 0.06–0.08" |
| sm | Internal rhythm inside a content block | 0.15–0.2" |
| md | Card padding, gaps between columns | 0.25–0.3" |
| lg | Gaps between major content groups | 0.5–0.6" |
| xl | Outer slide margins | 0.7–0.9" |
| xxl | Vertical centering space on title/quote slides | 1.0–1.3" |

**Shape**: cards/callouts use ~0.1–0.12" corner radius (≈ lg); tags/chips/status pills are fully rounded capsules; borders are a hairline stroke at ~10% black opacity — never a heavy outline.

---

## Component → slide element mapping

| Theme component | Slide element | Spec |
|---|---|---|
| `card` | Content block / callout box | White fill, hairline border, ~0.1" radius, ~0.3" padding |
| `chip` | Tag, label, step-number pill | `#F5F5F5` fill, full pill radius, label-sm text |
| `button-primary` | **The** accent highlight (key stat, single CTA-style box) | `#455DD3` fill, white bold text — max one per slide |
| `button-link` | Caption / footnote / source citation | Tertiary blue text, no fill, small size |
| `button-secondary`, `input` | Not applicable to static slides | Skip |

---

## Layout patterns

Each pattern below should pull only from the tokens above.

**Title slide**
```
┌─────────────────────────────────────┐
│                                     │
│         Headline (44pt, black)      │
│         Subhead (20pt, gray-black)  │
│                                     │
│         Presenter · Date            │
└─────────────────────────────────────┘
```
Generous xxl whitespace top/bottom. No accent color needed here — let the black-on-white contrast carry it.

**Stat highlight**
```
┌─────────────────────────────────────┐
│                                     │
│   ┌───────────────┐                 │
│   │   85%          │  ← button-primary
│   │   Key metric    │     style box │
│   └───────────────┘                 │
│   Supporting line (16pt)            │
└─────────────────────────────────────┘
```
This is the one slide type where the primary blue can fill a real shape — everywhere else it's a smaller accent.

**Three-column feature**
```
┌─────────────────────────────────────┐
│   Section header (30pt)             │
├───────────┬───────────┬─────────────┤
│  [card]   │  [card]   │   [card]    │
│  icon     │  icon     │   icon      │
│  Point    │  Point    │   Point     │
└───────────┴───────────┴─────────────┘
```
Each column is a `card`: white, hairline border, lg radius. One icon per card can carry the primary blue.

**Comparison**
```
┌─────────────────────────────────────┐
│           Before vs After            │
├─────────────────┬───────────────────┤
│   [card] BEFORE  │   [card] AFTER    │
│   muted chip tag │   primary chip*   │
└─────────────────┴───────────────────┘
```
*The "After" tag can use the primary blue chip variant to signal the resolved/positive side — the only departure from the default muted chip.

**Process / timeline**
```
┌─────────────────────────────────────┐
│   ●───────●───────●───────●          │
│  [chip]  [chip]  [chip]  [chip]      │
│  Step 1  Step 2  Step 3  Step 4      │
└─────────────────────────────────────┘
```
Step markers are pill chips (number in label-sm). Connecting line is a thin tertiary-blue or border-gray stroke, not a heavy bar.

**Quote / testimonial**
```
┌─────────────────────────────────────┐
│  "Quote text in headline-md,         │
│   black, generous line height"       │
│                                       │
│   — Name, role (body-sm, gray)       │
└─────────────────────────────────────┘
```

---

## Do's and don'ts

**Do**
- Keep slides open and centered with generous whitespace around the hero content.
- Use bold black headlines for sharp, editorial contrast.
- Reserve the primary blue for exactly one emphasis element per slide.
- Use hairline borders and flat white cards instead of shadows or dark panels.
- Keep all labels and captions in sentence case.

**Don't**
- Don't introduce colors outside the eight listed above.
- Don't make cards feel heavy, dark, or boxed in.
- Don't push corner radii past the lg/full scale — disciplined, not bubbly.
- Don't use a display or condensed font for titles — NotionInter/Inter only.
- Don't let the primary blue cover more than ~10–15% of a slide; it's an accent, not a background.

---

## Output format

For each slide, return:

```markdown
### Slide N: [title]
**Layout pattern**: [from list above]

**Wireframe**: [ASCII block]

**Content placement**: [text mapped to title/header/body/caption roles, with size/weight from the slide typography table]

**Color use**: [which single element gets primary blue; everything else white/black/muted per the token table]

**Components used**: [card / chip / accent box — per the mapping table]

**Notes**: [anything implementation-specific, e.g. icon needed, image crop, etc.]
```

---

## Workflow

1. Get the slide content and count from the user.
2. Pick a layout pattern per slide based on what that slide is doing (data point → stat highlight, narrative → quote, etc.).
3. Apply only the tokens defined above — no improvised colors, fonts, or spacing.
4. Output one spec block per slide using the Output Format.
5. If the user then wants an actual file, flag that this skill stops at the spec — see Limitations.

## Limitations & handoff

This skill never produces a `.pptx`. If the user wants a real file, the design spec above (content, layout pattern, colors, typography) should be passed to a PPTX-generation tool/skill capable of actually writing slide XML — this skill's output is the input to that step, not a replacement for it.
