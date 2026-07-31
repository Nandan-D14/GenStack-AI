"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", label: "My Decks", icon: "dashboard" },
  { href: "/templates", label: "Templates", icon: "collections_bookmark" },
  { href: "/settings/brand", label: "Brand Kit", icon: "palette" },
  { href: "/deck/new", label: "Create", icon: "auto_awesome" },
];

export function AppShell({
  children,
  title,
  actions,
}: {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-gs-bg text-gs-text font-sans antialiased overflow-hidden min-h-screen">
      <div className="flex h-screen w-full">
        <nav
          className={`hidden md:flex flex-col h-screen sticky top-0 py-5 gs-sidebar shrink-0 z-20 transition-all duration-300 ${
            open ? "w-60 px-3" : "w-[68px] px-2"
          }`}
        >
          <div className={`mb-6 flex items-center gap-3 ${open ? "px-2" : "justify-center"}`}>
            <div className="w-8 h-8 rounded-md bg-gs-accent/20 border border-gs-accent/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] text-gs-accent">layers</span>
            </div>
            {open && (
              <div className="overflow-hidden whitespace-nowrap">
                <h2 className="text-[14px] font-semibold tracking-tight leading-none">GenStack</h2>
                <span className="text-[10px] font-medium text-gs-muted mt-1 tracking-wider uppercase block">
                  Workspace
                </span>
              </div>
            )}
          </div>

          <div className="mb-5 px-0.5">
            <Link
              href="/deck/new"
              className={`w-full bg-gs-accent text-white rounded-md font-medium flex items-center justify-center gap-2 hover:bg-gs-accent-hover transition-all ${
                open ? "h-9 text-[13px] px-4" : "h-9 w-9 mx-auto"
              }`}
              title="New Deck"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              {open && <span>New Deck</span>}
            </Link>
          </div>

          <div className="flex-1 space-y-0.5 overflow-y-auto hide-scrollbar">
            {NAV.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`${active ? "gs-nav-item-active" : "gs-nav-item"} ${
                    !open ? "justify-center px-0" : ""
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  {open && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gs-border space-y-1">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`gs-nav-item w-full ${!open ? "justify-center px-0" : ""}`}
              title={open ? "Collapse" : "Expand"}
            >
              <span className="material-symbols-outlined text-[18px]">
                {open ? "left_panel_close" : "left_panel_open"}
              </span>
              {open && <span>Collapse</span>}
            </button>
            <div className={`flex items-center gap-3 px-2 py-2 ${!open ? "justify-center" : ""}`}>
              <UserButton />
              {open && <span className="text-[12px] text-gs-muted">Account</span>}
            </div>
          </div>
        </nav>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {(title || actions) && (
            <header className="h-14 shrink-0 border-b border-gs-border bg-gs-bg/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-sm font-semibold tracking-tight truncate">{title}</h1>
              </div>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </header>
          )}
          <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
        </main>
      </div>
    </div>
  );
}
