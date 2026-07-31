"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button, Input } from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

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
  backgroundColor: "#0A0A0A",
  textColor: "#FAFAFA",
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
    <AppShell title="Brand Kit">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gs-card p-6 space-y-4">
          <h2 className="text-sm font-semibold">New brand kit</h2>
          <Input
            label="Name"
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            classNames={{
              inputWrapper: "bg-gs-bg border border-gs-border rounded-md",
              label: "text-gs-secondary",
              input: "text-gs-text",
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            {colorFields.map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="color"
                  value={draft[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className="w-9 h-9 rounded-md bg-transparent border border-gs-border cursor-pointer"
                  aria-label={label}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gs-muted">{label}</p>
                  <p className="text-xs font-mono text-gs-secondary truncate">{draft[key]}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Heading font"
              value={draft.headingFont}
              onChange={(e) => set("headingFont", e.target.value)}
              classNames={{
                inputWrapper: "bg-gs-bg border border-gs-border rounded-md",
                label: "text-gs-secondary",
                input: "text-gs-text",
              }}
            />
            <Input
              label="Body font"
              value={draft.bodyFont}
              onChange={(e) => set("bodyFont", e.target.value)}
              classNames={{
                inputWrapper: "bg-gs-bg border border-gs-border rounded-md",
                label: "text-gs-secondary",
                input: "text-gs-text",
              }}
            />
          </div>
          <Button
            onPress={handleCreate}
            isLoading={saving}
            className="bg-gs-accent text-white font-medium rounded-md w-full"
            startContent={<Plus className="w-4 h-4" />}
          >
            Create brand kit
          </Button>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Your brand kits</h2>
          {kits === undefined && <p className="text-sm text-gs-secondary">Loading…</p>}
          {kits && kits.length === 0 && (
            <div className="gs-card p-6 text-sm text-gs-muted">
              No brand kits yet. Create one on the left.
            </div>
          )}
          {kits?.map((kit: any) => (
            <div key={kit._id} className="gs-card p-4 flex flex-row items-center gap-4">
              <div className="flex gap-1">
                {[
                  kit.primaryColor,
                  kit.secondaryColor,
                  kit.accentColor,
                  kit.backgroundColor,
                  kit.textColor,
                ].map((c: string, i: number) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-md border border-gs-border"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{kit.name}</p>
                <p className="text-[11px] text-gs-muted">
                  {kit.headingFont} / {kit.bodyFont}
                </p>
              </div>
              <Button
                isIconOnly
                variant="light"
                className="text-gs-muted hover:text-gs-danger"
                onPress={() => runRemove({ id: kit._id })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
