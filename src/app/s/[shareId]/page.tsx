"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

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
      <div className="min-h-screen bg-[#08090A] text-[#A1A5AE] flex items-center justify-center">
        Loading presentation...
      </div>
    );
  }

  if (deck === null) {
    return (
      <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] flex flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-semibold">Presentation not found</h1>
        <p className="text-[#A1A5AE]">This share link is invalid or was revoked.</p>
      </div>
    );
  }

  const brand: any = (deck as any).brandKit || null;
  const bg = brand?.backgroundColor || "#0F1011";
  const text = brand?.textColor || "#F7F8F8";
  const accent = brand?.primaryColor || "#7170FF";

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8]">
      <header className="px-8 py-5 border-b border-[#FFFFFF0D] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{deck.title}</h1>
          {deck.objective && (
            <p className="text-sm text-[#A1A5AE] mt-0.5 line-clamp-1">{deck.objective}</p>
          )}
        </div>
        <span className="text-xs text-[#6C707A]">{deck.slides.length} slides · GenStack AI</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {deck.slides.map((slide: any, i: number) => {
          const bullets = parseBullets(slide.content);
          return (
            <div
              key={i}
              className="rounded-2xl border border-[#FFFFFF0D] overflow-hidden aspect-video flex flex-col p-10 relative"
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
                <div className="w-14 h-1 rounded" style={{ backgroundColor: accent }} />
                <h2
                  className={`font-bold tracking-tight mt-6 ${slide.layout === "title" ? "text-4xl" : "text-2xl"}`}
                >
                  {slide.title}
                </h2>
                <ul className="mt-6 space-y-3 flex-1">
                  {bullets.map((b: string, bi: number) => (
                    <li key={bi} className="flex items-start gap-3 text-lg">
                      <span
                        className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: accent }}
                      />
                      <span style={{ opacity: 0.9 }}>{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-xs" style={{ color: "#6C707A" }}>
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
