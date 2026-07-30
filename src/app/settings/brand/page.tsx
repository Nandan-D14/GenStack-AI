"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button, Input, Card, CardBody } from "@heroui/react";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";

type Draft = {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
};

const DEFAULT_DRAFT: Draft = {
  name: "My Brand",
  primaryColor: "#7170FF",
  secondaryColor: "#213183",
  accentColor: "#0075DE",
  backgroundColor: "#0F1011",
  textColor: "#F7F8F8",
  headingFont: "Inter",
  bodyFont: "Inter",
};

export default function BrandKitPage() {
  const kits = useQuery(api.brandKits.listMine);
  const runCreate = useMutation(api.brandKits.create);
  const runRemove = useMutation(api.brandKits.remove);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof Draft, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const handleCreate = async () => {
    setSaving(true);
    try {
      await runCreate({ ...draft, logoPosition: "none" });
      setDraft(DEFAULT_DRAFT);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const colorFields: [keyof Draft, string][] = [
    ["primaryColor", "Primary"],
    ["secondaryColor", "Secondary"],
    ["accentColor", "Accent"],
    ["backgroundColor", "Background"],
    ["textColor", "Text"],
  ];

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8]">
      <header className="px-8 py-4 border-b border-[#FFFFFF0D] flex items-center gap-4">
        <Link href="/dashboard" className="text-[#A1A5AE] hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Brand Kits</h1>
          <p className="text-sm text-[#A1A5AE]">Colors and fonts applied to generated decks and exports</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create */}
        <Card className="bg-[#0F1011] border border-[#FFFFFF0D] rounded-2xl">
          <CardBody className="p-6 space-y-4">
            <h2 className="font-semibold">New brand kit</h2>
            <Input
              label="Name"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              classNames={{ inputWrapper: "bg-[#151617] border border-[#FFFFFF0D]" }}
            />
            <div className="grid grid-cols-2 gap-3">
              {colorFields.map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent border border-[#FFFFFF0D] cursor-pointer"
                    aria-label={label}
                  />
                  <div className="flex-1">
                    <p className="text-[11px] text-[#A1A5AE]">{label}</p>
                    <p className="text-xs font-mono">{draft[key]}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Heading font"
                value={draft.headingFont}
                onChange={(e) => set("headingFont", e.target.value)}
                classNames={{ inputWrapper: "bg-[#151617] border border-[#FFFFFF0D]" }}
              />
              <Input
                label="Body font"
                value={draft.bodyFont}
                onChange={(e) => set("bodyFont", e.target.value)}
                classNames={{ inputWrapper: "bg-[#151617] border border-[#FFFFFF0D]" }}
              />
            </div>
            <Button
              onPress={handleCreate}
              isLoading={saving}
              className="bg-[#7170FF] text-white font-medium rounded-xl"
              startContent={<Plus className="w-4 h-4" />}
            >
              Create brand kit
            </Button>
          </CardBody>
        </Card>

        {/* Existing */}
        <div className="space-y-4">
          <h2 className="font-semibold">Your brand kits</h2>
          {kits === undefined && <p className="text-sm text-[#A1A5AE]">Loading...</p>}
          {kits && kits.length === 0 && (
            <p className="text-sm text-[#6C707A]">No brand kits yet. Create one on the left.</p>
          )}
          {kits?.map((kit: any) => (
            <Card key={kit._id} className="bg-[#0F1011] border border-[#FFFFFF0D] rounded-2xl">
              <CardBody className="p-4 flex flex-row items-center gap-4">
                <div className="flex gap-1">
                  {[kit.primaryColor, kit.secondaryColor, kit.accentColor, kit.backgroundColor, kit.textColor].map(
                    (c: string, i: number) => (
                      <span
                        key={i}
                        className="w-5 h-5 rounded-md border border-[#FFFFFF1A]"
                        style={{ backgroundColor: c }}
                      />
                    ),
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{kit.name}</p>
                  <p className="text-[11px] text-[#A1A5AE]">
                    {kit.headingFont} / {kit.bodyFont}
                  </p>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  className="text-[#A1A5AE] hover:text-red-400"
                  onPress={() => runRemove({ id: kit._id })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
