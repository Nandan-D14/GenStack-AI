"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { Chip } from "@/components/ui";

type Filter = "all" | "recent" | "shared";

export default function DashboardPage() {
  const decks = useQuery(api.decks.list);
  const isLoading = decks === undefined;
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const runDeleteDeck = useMutation(api.decks.deleteDeck);

  const handleDelete = async (deckId: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Delete this presentation?")) {
      try {
        await runDeleteDeck({ id: deckId });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filtered = useMemo(() => {
    let list = decks ?? [];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((d: any) => (d.title || "").toLowerCase().includes(q));
    }
    if (filter === "recent") {
      list = [...list].sort(
        (a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0),
      );
    }
    return list;
  }, [decks, filter, query]);

  return (
    <AppShell
      title="My Decks"
      actions={
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-gs-muted">
            search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search decks..."
            className="gs-input h-8 w-48 md:w-64 pl-8 text-xs"
          />
        </div>
      }
    >
      <div className="px-4 md:px-8 py-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-gs-secondary mt-1">
              Plan, generate, and ship decks from one workspace.
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-gs-surface border border-gs-border">
            {(
              [
                ["all", "All"],
                ["recent", "Recent"],
                ["shared", "Shared"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                  filter === key
                    ? "bg-gs-surface-3 text-gs-text"
                    : "text-gs-muted hover:text-gs-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Link
            href="/deck/new"
            className="group min-h-[220px] rounded-lg border border-dashed border-gs-border-strong bg-transparent hover:bg-gs-surface/60 hover:border-gs-accent/40 transition-colors flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-11 h-11 rounded-md bg-gs-accent-soft border border-gs-accent/25 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px] text-gs-accent">add</span>
            </div>
            <h3 className="text-sm font-medium">Create new deck</h3>
            <p className="text-xs text-gs-muted mt-1.5 max-w-[200px]">
              Start from a prompt, notes, PDF, or URL.
            </p>
          </Link>

          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="gs-card min-h-[220px] overflow-hidden p-0">
                <div className="aspect-video gs-shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-2/3 rounded gs-shimmer" />
                  <div className="h-2.5 w-1/3 rounded gs-shimmer" />
                </div>
              </div>
            ))}

          {!isLoading &&
            filtered.map((deck: any) => (
              <Link
                key={deck._id}
                href={`/deck/${deck._id}/editor`}
                className="group gs-card-hover min-h-[220px] overflow-hidden p-0 flex flex-col"
              >
                <div className="relative aspect-video bg-gs-bg border-b border-gs-border overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gs-accent/20 via-transparent to-gs-surface-3" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="gs-btn-primary h-8 text-xs px-3 shadow-gs">
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Open editor
                    </span>
                  </div>
                  <div className="absolute top-2 left-2">
                    <Chip>Draft</Chip>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Chip>
                      <span className="material-symbols-outlined text-[12px]">view_carousel</span>
                      {deck.slides?.length || 0}
                    </Chip>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-medium truncate">{deck.title}</h3>
                  <p className="text-[11px] text-gs-muted mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    Edited {new Date(deck.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-auto pt-3 border-t border-gs-border flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      <div className="w-6 h-6 rounded-full bg-gs-accent border border-gs-bg flex items-center justify-center text-[10px] text-white font-medium">
                        G
                      </div>
                    </div>
                    <button
                      type="button"
                      className="gs-btn-icon text-gs-muted hover:text-gs-danger"
                      title="Delete"
                      onClick={(e) => handleDelete(deck._id, e)}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="gs-card p-8 text-center mt-2">
            <p className="text-sm text-gs-secondary">No decks match your search.</p>
            <Link href="/deck/new" className="gs-btn-primary mt-4 inline-flex">
              Create your first deck
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
