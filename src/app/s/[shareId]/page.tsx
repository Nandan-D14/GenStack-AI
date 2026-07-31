"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Chip } from "@/components/ui";

function parseBullets(content: string): string[] {
  try {
    const p = JSON.parse(content || "[]");
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export default function PublicDeckPage() {
  const { shareId } = useParams();
  const deck = useQuery(
    api.decks.getByShareId,
    shareId ? { shareId: shareId as string } : "skip",
  );

  if (deck === undefined) {
    return (
      <div className="min-h-screen bg-gs-bg text-gs-secondary flex items-center justify-center text-sm">
        Loading presentation…
      </div>
    );
  }

  if (deck === null) {
    return (
      <div className="min-h-screen bg-gs-bg text-gs-text flex flex-col items-center justify-center gap-2">
        <h1 className="text-xl font-semibold">Presentation not found</h1>
        <p className="text-sm text-gs-secondary">
          This share link is invalid or was revoked.
        </p>
      </div>
    );
  }

  const brand: any = (deck as any).brandKit || null;
  const bg = brand?.backgroundColor || "#141414";
  const text = brand?.textColor || "#FAFAFA";
  const accent = brand?.primaryColor || "#7170FF";

  return (
    <div className="min-h-screen bg-gs-bg text-gs-text">
      <header className="px-6 md:px-8 py-4 border-b border-gs-border flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate">{deck.title}</h1>
          {deck.objective && (
            <p className="text-xs text-gs-secondary mt-0.5 line-clamp-1">{deck.objective}</p>
          )}
        </div>
        <Chip>
          {deck.slides.length} slides · GenStack
        </Chip>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10 space-y-6">
        {deck.slides.map((slide: any, i: number) => {
          const bullets = parseBullets(slide.content);
          return (
            <div
              key={i}
              className="rounded-xl border border-gs-border overflow-hidden aspect-video flex flex-col p-8 md:p-10 relative shadow-gs-sm"
              style={{ backgroundColor: bg, color: text }}
            >
              {slide.imageUrl && (
                <img
                  src={slide.imageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-25"
                />
              )}
              <div className="relative flex flex-col h-full">
                <div className="w-12 h-1 rounded" style={{ backgroundColor: accent }} />
                <h2
                  className={`font-semibold tracking-tight mt-5 ${
                    slide.layout === "title" ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
                  }`}
                >
                  {slide.title}
                </h2>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {bullets.map((b: string, bi: number) => (
                    <li key={bi} className="flex items-start gap-3 text-base md:text-lg">
                      <span
                        className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: accent }}
                      />
                      <span style={{ opacity: 0.9 }}>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-[11px] text-gs-muted font-mono">
                  {i + 1} / {deck.slides.length}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
