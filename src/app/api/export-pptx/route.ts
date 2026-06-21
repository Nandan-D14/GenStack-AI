import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { exportParams } = await req.json();

    if (!exportParams) {
      return NextResponse.json({ error: "Missing exportParams" }, { status: 400 });
    }

    console.log("Calling C1 PPTX export endpoint...");
    const pptxResponse = await fetch("https://api.thesys.dev/v1/artifact/pptx/export", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.THESYS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ exportParams }),
    });

    if (!pptxResponse.ok) {
      const errorText = await pptxResponse.text();
      throw new Error(`Failed to export PPTX from C1: ${errorText || pptxResponse.statusText}`);
    }

    console.log("PPTX export success. Streaming file back...");
    return new NextResponse(pptxResponse.body, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="presentation.pptx"',
      },
    });
  } catch (error: any) {
    console.error("Error exporting PPTX:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
