"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button, Card, CardBody } from "@heroui/react";
import { ArrowLeft, LayoutTemplate, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8]">
      <header className="px-8 py-4 border-b border-[#FFFFFF0D] flex items-center gap-4">
        <Link href="/dashboard" className="text-[#A1A5AE] hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Templates</h1>
          <p className="text-sm text-[#A1A5AE]">Start from a proven structure and let AI fill it in</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TEMPLATES.map((tpl) => (
          <Card key={tpl.id} className="bg-[#0F1011] border border-[#FFFFFF0D] rounded-2xl">
            <CardBody className="p-5 flex flex-col gap-4 h-full">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${tpl.accent}22`, border: `1px solid ${tpl.accent}55` }}
              >
                <LayoutTemplate className="w-5 h-5" style={{ color: tpl.accent }} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{tpl.name}</h3>
                <p className="text-[13px] text-[#A1A5AE] mt-1">{tpl.description}</p>
                <p className="text-[11px] text-[#6C707A] mt-2">{tpl.plan.length} slides · {tpl.audience}</p>
              </div>
              <Button
                onPress={() => useTemplate(tpl.id)}
                isLoading={busy === tpl.id}
                className="bg-white text-black font-medium rounded-xl"
                endContent={<ArrowRight className="w-4 h-4" />}
              >
                Use template
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
