"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DashboardPage() {
  const decks = useQuery(api.decks.list);
  const isLoading = decks === undefined;
  
  const runDeleteDeck = useMutation(api.decks.deleteDeck);

  const handleDelete = async (deckId: any) => {
    if (window.confirm("Are you sure you want to delete this presentation?")) {
      try {
        await runDeleteDeck({ id: deckId });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex selection:bg-primary/20">
      {/* SideNavBar */}
      <nav className="bg-surface-container-low dark:bg-surface-container-low hidden md:flex flex-col h-screen sticky top-0 py-md px-sm border-r border-border w-64 flex-shrink-0 z-40">
        {/* Header */}
        <div className="mb-xl px-4 flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest flex-shrink-0 border border-border">
            <img alt="User Workspace Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs7pqOjEJ8RL8IBk5UXacZvYoifMKQ90sL-JWqlJ6UCTFu47cMWN4r-0B7PEu4NhJWWuuSB7BBqZ_TEFiuLFk8DGmYGjnCF2nevAvLm5x0FHDoHBPe7A4IpOcRz3BOh8U3R1eZZfUGjhgL3ISkaf4pstWt-QireVQYl66chhQglSoZGikHUCjrCjGTHRJFVtXOWM1aKOGngaRAS6b4PJqkeO8A4CpKtIVIm-zTDUyWargLHig-IRZdttEsRWs8Ix2kIF-kVygfSY4I" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-headline-sm text-headline-sm font-bold text-primary truncate">GenStackAI Workspace</h1>
            <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface px-2 py-1 rounded-full border border-border mt-1 inline-block">Pro Plan</span>
          </div>
        </div>
        {/* CTA */}
        <div className="px-4 mb-md">
          <Link href="/deck/new" className="w-full bg-primary text-neutral-bg font-label-md text-label-md rounded-full h-lg flex items-center justify-center gap-2 hover:bg-inverse-surface transition-colors duration-200">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Presentation
          </Link>
        </div>
        {/* Navigation Links */}
        <ul className="flex-1 flex flex-col gap-1 overflow-y-auto">
          <li>
            <Link className="flex items-center gap-3 bg-surface-container-highest text-primary rounded-lg px-4 py-3 scale-[0.98] transition-transform" href="/dashboard">
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span className="font-label-md text-label-md">My Decks</span>
            </Link>
          </li>
          <li>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container rounded-lg hover:bg-surface-container transition-all duration-200" href="#">
              <span className="material-symbols-outlined text-[20px]">collections_bookmark</span>
              <span className="font-label-md text-label-md">Templates</span>
            </Link>
          </li>
          <li>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container rounded-lg hover:bg-surface-container transition-all duration-200" href="#">
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
              <span className="font-label-md text-label-md">Assets</span>
            </Link>
          </li>
          <li>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container rounded-lg hover:bg-surface-container transition-all duration-200" href="#">
              <span className="material-symbols-outlined text-[20px]">insights</span>
              <span className="font-label-md text-label-md">Analytics</span>
            </Link>
          </li>
          <li>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container rounded-lg hover:bg-surface-container transition-all duration-200" href="#">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span className="font-label-md text-label-md">Settings</span>
            </Link>
          </li>
        </ul>
        {/* Footer Links */}
        <ul className="mt-auto flex flex-col gap-1 pt-md border-t border-border">
          <li>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container rounded-lg hover:bg-surface-container transition-all duration-200" href="#">
              <span className="material-symbols-outlined text-[20px]">help</span>
              <span className="font-label-md text-label-md">Help</span>
            </Link>
          </li>
          <li>
            <Link className="flex items-center gap-3 text-on-surface-variant px-4 py-3 hover:bg-surface-container rounded-lg hover:bg-surface-container transition-all duration-200" href="/">
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="font-label-md text-label-md">Logout</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Utility Bar */}
        <header className="h-20 px-gutter flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <button className="md:hidden text-on-surface-variant p-2 -ml-2 rounded-lg hover:bg-surface">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="relative max-w-md w-full ml-4 md:ml-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input className="w-full h-lg bg-surface border border-border rounded-full pl-11 pr-4 font-body-sm text-body-sm text-primary placeholder:text-on-surface-variant focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" placeholder="Search presentations..." type="text"/>
          </div>
          <div className="flex items-center gap-sm md:hidden">
            <div className="w-8 h-8 rounded-full bg-surface-container border border-border"></div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-gutter max-w-[1600px] mx-auto w-full flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xl">
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">Welcome back</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Here's what's happening with your decks today.</p>
            </div>
            {/* Filter Chips */}
            <div className="flex items-center gap-xs overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
              <button className="px-4 h-8 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm border border-border whitespace-nowrap">All</button>
              <button className="px-4 h-8 rounded-full bg-surface text-on-surface-variant hover:text-primary hover:bg-surface-container font-label-sm text-label-sm border border-transparent whitespace-nowrap transition-colors">Recent</button>
              <button className="px-4 h-8 rounded-full bg-surface text-on-surface-variant hover:text-primary hover:bg-surface-container font-label-sm text-label-sm border border-transparent whitespace-nowrap transition-colors">Shared</button>
            </div>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
            {/* Create New Card (Primary CTA) */}
            <Link href="/deck/new" className="group relative rounded-[20px] bg-[#1C1C1C] border border-border aspect-[4/3] flex flex-col items-center justify-center gap-sm hover:bg-surface-container-highest transition-all duration-300 overflow-hidden text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 z-10">
                <span className="material-symbols-outlined text-[24px]">add</span>
              </div>
              <span className="font-label-md text-label-md text-primary z-10">Create New Presentation</span>
            </Link>

            {isLoading ? (
              <div className="text-on-surface-variant mt-4 px-2">Loading decks...</div>
            ) : (
              decks?.map((deck: any, index: number) => {
                // Determine a thumbnail image based on the index
                const thumbnails = [
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDk9cnzmeAgvcGe7didFz5CuZrmsvZYh-KSCOQ5jhM1vZEfkidL3e5hp70LEeKlUF0a7FyUJwKO_NM7U04DVJE47OCGtlJxUHex60GX8sF5Lb11I4Hc72-qNnrJqSMWATYNfIwrp5dvYekMwq_eabQzoAshQoCQqKA7y5XA6imXsfE423UbFZzSQU4o6LyJqVgQd1Zgy5fiQH593_HxhIzgSwWUbyVO0kTbAF9PISelFURkLJfnKx2kZVFJKTvZ88gMap8ERyy07WfL",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuA3oJe94Q4mMneGMBF8wmCeWhchUZe9HsNwC6QWM5EVi6B1RA2dFKMkJTOtCSzyjJjivGekvxvvr5f6FftOMs9SB6NwZNZoVtSW2jEsMqr3PtNfiaws_aDG9nUeyeLhnVgI-HsqBPFDPYkL-QnTdSOEfTHt68KVD2x6mmaPIWlkBrpr4vucO7Uxu6TRJvtvNbAoV1rt_krdDYKaGznlAlcrjTs2fyzCQmH_BPdV9RVmbe1LzSGrnV0jL-YaOuKQJGf_4i_EmlihBmpE",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuDAsD7IojA3Umims_I6S5_E0TChjStU7Bb4em_K7ayb1Tvz9eq_bvdhF3mth0gPVcdsgbpzBVP24uEsearheg2Fx31EPMosuiu_UvTvPqJfPVEmF_pilEEdw_kMG6BqQx-nhNgek3azogKNUDQEpPAScI71Vi6Jk2BxvG6yUSuqwBPGuqSsdbu3vnCUrVrZZxpdkdG4LzbrVkGxmS07ytz5fqJdX8FllwA8kAzB6zbq3p4k7HjUBINsm0TToCCguBPnd_-fM6OcY0rI"
                ];
                const thumb = thumbnails[index % thumbnails.length];

                return (
                  <Link href={`/deck/${deck._id}/editor`} key={deck._id} className="group rounded-[20px] bg-[#1C1C1C] border border-border overflow-hidden flex flex-col transition-all duration-300 hover:border-border/50 hover:-translate-y-1">
                    <div className="aspect-video bg-surface relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                      <img src={thumb} alt={deck.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute bottom-3 right-3 z-20 flex gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 font-label-sm text-[10px] text-primary">{deck.slides?.length || 0} slides</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between bg-surface-container-low">
                      <div>
                        <h3 className="font-label-lg text-label-lg text-primary truncate mb-1">{deck.title}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Updated {new Date(deck.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-surface border border-border"></div>
                          <div className="w-6 h-6 rounded-full bg-surface-container border border-border"></div>
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); handleDelete(deck._id); }}
                          className="text-on-surface-variant hover:text-error transition-colors z-30 relative flex items-center justify-center p-1 rounded-full hover:bg-error/10"
                          title="Delete Deck"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}

          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
