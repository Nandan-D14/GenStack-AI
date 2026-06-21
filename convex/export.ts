"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Generate a real PPTX file from a deck and its slides.
 * Uses pptxgenjs to create an editable PowerPoint presentation.
 * Returns a base64-encoded data URL for client-side download.
 */
export const generatePptx = action({
  args: {
    deckId: v.id("decks"),
  },
  handler: async (ctx, args) => {
    // Dynamically import pptxgenjs (Node.js runtime)
    const PptxGenJS = (await import("pptxgenjs")).default;

    // Fetch the deck using the internal query in decks.ts
    const deck: any = await ctx.runQuery(internal.decks.getDeckForExport, {
      deckId: args.deckId,
    });

    if (!deck) {
      throw new Error("Deck not found");
    }

    const slides = deck.slides || [];

    // Create a new presentation
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE"; // 16:9 widescreen
    pptx.author = "GenStack AI";
    pptx.title = deck.title || "Untitled Presentation";
    pptx.subject = deck.objective || "";

    // Define a reusable color palette
    const colors = {
      primary: "4F46E5",     // Indigo
      secondary: "7C3AED",   // Violet
      accent: "06B6D4",      // Cyan
      dark: "1E1E2E",        // Dark background
      light: "F8FAFC",       // Light text
      muted: "94A3B8",       // Muted text
      white: "FFFFFF",
    };

    // Helper: add a styled master background to a slide
    function styleSlide(slide: any) {
      slide.background = { color: colors.dark };
    }

    // Helper: add the GenStack logo bar at the top
    function addBranding(slide: any) {
      slide.addText("GenStack AI", {
        x: 0.4,
        y: 0.3,
        w: 2,
        h: 0.3,
        fontSize: 10,
        fontFace: "Arial",
        color: colors.muted,
        bold: true,
      });
    }

    // Helper: add slide number
    function addSlideNumber(slide: any, num: number, total: number) {
      slide.addText(`${num} / ${total}`, {
        x: 11.5,
        y: 7.0,
        w: 1.5,
        h: 0.3,
        fontSize: 9,
        fontFace: "Arial",
        color: colors.muted,
        align: "right",
      });
    }

    // Process each slide
    for (let i = 0; i < slides.length; i++) {
      const slideData = slides[i];
      const pptSlide = pptx.addSlide();
      styleSlide(pptSlide);
      addBranding(pptSlide);
      addSlideNumber(pptSlide, i + 1, slides.length);

      // Parse bullets from JSON string
      let bullets: string[] = [];
      try {
        const parsed = JSON.parse(slideData.content || "[]");
        bullets = Array.isArray(parsed) ? parsed : [];
      } catch {
        bullets = [];
      }

      // Add speaker notes if available
      if (slideData.speakerNotes) {
        pptSlide.addNotes(slideData.speakerNotes);
      }

      // Render based on layout type
      switch (slideData.layout) {
        case "title": {
          // Large centered title slide
          pptSlide.addText(slideData.title || "Untitled", {
            x: 0.5,
            y: 2.0,
            w: 12,
            h: 2,
            fontSize: 44,
            fontFace: "Arial",
            color: colors.white,
            bold: true,
            align: "center",
          });

          // Subtitle / objective
          if (deck.objective) {
            pptSlide.addText(deck.objective, {
              x: 1.5,
              y: 4.2,
              w: 10,
              h: 0.8,
              fontSize: 18,
              fontFace: "Arial",
              color: colors.muted,
              align: "center",
            });
          }

          // Accent line
          pptSlide.addShape("rect" as any, {
            x: 5.5,
            y: 5.3,
            w: 2,
            h: 0.04,
            fill: { color: colors.primary },
          });
          break;
        }

        case "closing": {
          // Closing / CTA slide
          pptSlide.addText(slideData.title || "Thank You", {
            x: 0.5,
            y: 1.5,
            w: 12,
            h: 1.5,
            fontSize: 40,
            fontFace: "Arial",
            color: colors.white,
            bold: true,
            align: "center",
          });

          // Display bullets as key metrics in a row
          if (bullets.length > 0) {
            const colWidth = 10 / bullets.length;
            bullets.forEach((bullet, bIdx) => {
              pptSlide.addText(bullet, {
                x: 1.5 + bIdx * colWidth,
                y: 3.5,
                w: colWidth - 0.3,
                h: 1.5,
                fontSize: 16,
                fontFace: "Arial",
                color: colors.light,
                align: "center",
                valign: "middle",
                fill: { color: "2A2A3E" },
                shape: "roundRect" as any,
                rectRadius: 0.1,
              });
            });
          }
          break;
        }

        case "data":
        case "chart": {
          // Data / chart slides — title + metric cards
          pptSlide.addText(slideData.title, {
            x: 0.5,
            y: 0.8,
            w: 12,
            h: 0.8,
            fontSize: 28,
            fontFace: "Arial",
            color: colors.white,
            bold: true,
          });

          // Render bullets as data metric cards
          if (bullets.length > 0) {
            const colWidth = 11 / Math.min(bullets.length, 4);
            bullets.forEach((bullet, bIdx) => {
              pptSlide.addText(bullet, {
                x: 0.7 + bIdx * colWidth,
                y: 2.2,
                w: colWidth - 0.4,
                h: 1.8,
                fontSize: 16,
                fontFace: "Arial",
                color: colors.light,
                align: "center",
                valign: "middle",
                fill: { color: "2A2A3E" },
                shape: "roundRect" as any,
                rectRadius: 0.1,
              });
            });
          }
          break;
        }

        default: {
          // Content / generic layout — title + bullet list
          pptSlide.addText(slideData.title, {
            x: 0.5,
            y: 0.8,
            w: 12,
            h: 0.8,
            fontSize: 28,
            fontFace: "Arial",
            color: colors.white,
            bold: true,
          });

          // Render bullets as a list
          if (bullets.length > 0) {
            const bulletObjs = bullets.map((b: string) => ({
              text: b,
              options: {
                fontSize: 16,
                fontFace: "Arial",
                color: colors.light,
                bullet: {
                  type: "number" as const,
                  color: colors.primary,
                },
                paraSpaceAfter: 8,
              },
            }));

            pptSlide.addText(bulletObjs, {
              x: 0.7,
              y: 2.0,
              w: 11.5,
              h: 4.5,
              valign: "top",
            });
          }
          break;
        }
      }
    }

    // Generate the PPTX as a base64 string
    const base64 = await pptx.write({ outputType: "base64" });
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${base64}`;

    return {
      downloadUrl: dataUrl,
      fileName: `${deck.title || "presentation"}.pptx`,
    };
  },
});
