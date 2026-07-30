import { NextRequest, NextResponse } from "next/server";

/**
 * Generates an on-topic slide image.
 *
 * If an OpenAI-compatible image endpoint is configured (IMAGE_API_KEY +
 * IMAGE_BASE_URL, optional IMAGE_MODEL), it is used for true text-to-image
 * generation. Otherwise we fall back to a keyless, on-topic stock photo from
 * Unsplash Source so the feature works in any environment.
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.IMAGE_API_KEY;
    const baseURL = process.env.IMAGE_BASE_URL;
    const model = process.env.IMAGE_MODEL || "gpt-image-1";

    if (apiKey && baseURL) {
      try {
        const res = await fetch(`${baseURL.replace(/\/$/, "")}/images/generations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            prompt: `Professional, clean presentation visual: ${prompt}`,
            size: "1024x1024",
            n: 1,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const item = data?.data?.[0];
          const url = item?.url
            ? item.url
            : item?.b64_json
              ? `data:image/png;base64,${item.b64_json}`
              : null;
          if (url) return NextResponse.json({ url, provider: "model" });
        }
      } catch {
        // fall through to keyless fallback
      }
    }

    // Keyless fallback: on-topic stock photo.
    const keywords = prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 4)
      .join(",");
    const url = `https://source.unsplash.com/1600x900/?${encodeURIComponent(
      keywords || "business,presentation",
    )}`;
    return NextResponse.json({ url, provider: "unsplash" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: 500 },
    );
  }
}
