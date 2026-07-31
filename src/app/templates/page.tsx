"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { Chip } from "@/components/ui";
import { TEMPLATES } from "../../lib/templates";

export default function TemplatesPage() {
  const router = useRouter();
  const runCreate = useMutation(api.decks.create);
  const runUpdatePlan = useMutation(api.decks.updatePlan);
  const [busy, setBusy] = useState<string | null>(null);

  const useTemplate = async (id: string) => {
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setBusy(id);
    try {
      const deckId = await runCreate({
        title: tpl.name,
        type: tpl.type,
        tone: tpl.tone,
        audience: tpl.audience,
        slidesCount: tpl.plan.length,
        objective: tpl.description,
      });
      const planItems = tpl.plan.map((p, i) => ({
        id: `item-${Date.now()}-${i}`,
        order: i,
        title: p.title,
        layout: p.layout,
        description: p.description,
      }));
      await runUpdatePlan({
        id: deckId as any,
        planItems: JSON.stringify(planItems),
        planStatus: "planning",
      });
      router.push(`/deck/${deckId}/plan`);
    } catch (e) {
      console.error(e);
      setBusy(null);
    }
  };

  return (
    <AppShell title="Templates">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight">Start from a proven structure</h2>
          <p className="text-sm text-gs-secondary mt-1">
            Pick a template — AI fills slides from your brief and sources.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="gs-card-hover p-5 flex flex-col gap-4 min-h-[220px]">
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center border"
                style={{
                  backgroundColor: `${tpl.accent}22`,
                  borderColor: `${tpl.accent}55`,
                }}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ color: tpl.accent }}
                >
                  layout
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{tpl.name}</h3>
                <p className="text-xs text-gs-secondary mt-1.5 leading-relaxed">
                  {tpl.description}
                </p>
                <div className="mt-3">
                  <Chip>
                    {tpl.plan.length} slides · {tpl.audience}
                  </Chip>
                </div>
              </div>
              <button
                type="button"
                onClick={() => useTemplate(tpl.id)}
                disabled={busy === tpl.id}
                className="gs-btn-primary w-full"
              >
                {busy === tpl.id ? "Creating…" : "Use template"}
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
