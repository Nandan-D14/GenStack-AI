import PptxGenJS from "pptxgenjs"

export async function exportToPPTX(deck: any) {
  const pptx = new PptxGenJS()

  // Apply brand colors if available
  const brandKit = deck.brandKit
  const primaryColor = brandKit?.primaryColor || "3B82F6"
  const textColor = brandKit?.textColor || "ECEDEE"
  const bgColor = brandKit?.backgroundColor || "000000"

  pptx.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: bgColor },
    objects: [
      {
        rect: { x: 0, y: 0, w: "100%", h: "100%", fill: { color: bgColor } },
      },
    ],
  })

  for (const slide of deck.slides) {
    const s = pptx.addSlide({ masterName: "MASTER_SLIDE" })

    // Title
    s.addText(slide.title, {
      x: 0.5,
      y: 0.5,
      w: "90%",
      fontSize: 32,
      bold: true,
      color: textColor,
      fontFace: brandKit?.headingFont || "Inter",
    })

    // Content bullets
    try {
      const bullets = JSON.parse(slide.content || "[]")
      if (Array.isArray(bullets) && bullets.length > 0) {
        s.addText(
          bullets.map((b: string) => ({ text: b, options: { bullet: true } })),
          {
            x: 0.5,
            y: 1.5,
            w: "90%",
            fontSize: 18,
            color: textColor,
            fontFace: brandKit?.bodyFont || "Inter",
          }
        )
      }
    } catch {
      // fallback
    }

    // Speaker notes
    if (slide.speakerNotes) {
      s.addNotes(slide.speakerNotes)
    }
  }

  const buffer = await pptx.write({ outputType: "nodebuffer" })
  return buffer
}
