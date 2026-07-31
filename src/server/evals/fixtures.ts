/**
 * Golden and adversarial fixtures for the eval harness. The "good" deck should
 * pass with no errors and no warnings; the "bad" slides should each surface the
 * expected issue so we know the checks actually fire.
 */

export const GOOD_DECK = [
  {
    title: "The Future of Remote Work",
    layout: "title",
    bullets: ["How distributed teams win the talent war"],
    speakerNotes: "Welcome the audience and frame the shift to remote-first.",
  },
  {
    title: "Why Remote Work Matters Now",
    layout: "content",
    bullets: [
      "Distributed teams access a global candidate pool beyond one city",
      "Office overhead drops sharply when headquarters shrink or disappear",
      "Async workflows create durable written documentation by default",
      "Retention improves when employees control where they work",
    ],
    speakerNotes: "Explain the strategic drivers behind remote adoption.",
  },
  {
    title: "The Numbers Behind Remote",
    layout: "data",
    bullets: [
      "30%: Average reduction in real-estate spend",
      "11000: Dollars saved per remote employee each year",
      "2x: Larger qualified candidate pipeline",
    ],
    speakerNotes: "Walk through the financial case with concrete figures.",
  },
  {
    title: "Your Next Steps",
    layout: "closing",
    bullets: [
      "Audit which roles can go remote-first this quarter",
      "Rewrite job posts to target a global audience",
      "Adopt async tools and written-first communication",
    ],
    speakerNotes: "Close with a concrete, time-bound call to action.",
  },
];

export const BAD_SLIDES = [
  {
    name: "quote with wrong bullet count",
    slide: {
      title: "A Word From Our CEO",
      layout: "quote",
      bullets: ["Only one bullet here"],
      speakerNotes: "n/a",
    },
    expect: /quote should have exactly 2 bullets/,
  },
  {
    name: "data bullet missing NUMBER format",
    slide: {
      title: "Metrics",
      layout: "data",
      bullets: ["Our revenue grew a lot"],
      speakerNotes: "n/a",
    },
    expect: /NUMBER: Description/,
  },
  {
    name: "filler content",
    slide: {
      title: "Overview",
      layout: "content",
      bullets: [
        "Key point about the topic goes here",
        "Supporting detail placeholder",
        "Another point one",
      ],
      speakerNotes: "n/a",
    },
    expect: /filler/,
  },
  {
    name: "schema invalid (bad layout)",
    slide: {
      title: "Broken",
      layout: "carousel",
      bullets: ["x"],
      speakerNotes: "n/a",
    },
    expect: /schema/,
  },
];
