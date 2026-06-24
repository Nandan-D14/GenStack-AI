"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Card,
  CardBody,
  CardFooter,
  Button,
  Input
} from "@heroui/react";

export default function DashboardPage() {
  const decks = useQuery(api.decks.list);
  const isLoading = decks === undefined;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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
    <div className="bg-[#09090b] text-zinc-100 font-sans antialiased overflow-hidden selection:bg-zinc-800 selection:text-zinc-100">
      <div className="flex h-screen w-full">
        {/* SideNavBar Component */}
        <nav 
          className={`hidden md:flex flex-col h-screen sticky top-0 py-6 bg-[#18181b] border-r border-zinc-800 shrink-0 z-20 transition-all duration-300 ${isSidebarOpen ? 'w-64 px-4' : 'w-20 px-2'}`}
        >
          {/* Header */}
          <div className={`mb-8 flex items-center gap-3 ${isSidebarOpen ? 'px-2' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] text-zinc-100">layers</span>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col justify-center overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
                <h2 className="text-[14px] font-semibold text-zinc-100 tracking-tight leading-none">
                  GenStack
                </h2>
                <span className="text-[10px] font-medium text-zinc-400 mt-1 tracking-wider uppercase">
                  Workspace
                </span>
              </div>
            )}
          </div>
          
          {/* CTA */}
          <div className="mb-8 px-1">
            <Link href="/deck/new" className={`w-full bg-white text-black rounded-md font-medium flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all overflow-hidden ${isSidebarOpen ? 'h-9 text-[13px] px-4' : 'h-9 w-9 mx-auto text-transparent'}`}>
              <span className={`material-symbols-outlined ${isSidebarOpen ? 'text-[16px]' : 'text-[18px] text-black'}`}>add</span>
              {isSidebarOpen && <span>New Deck</span>}
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="flex-1 space-y-1 overflow-y-auto px-1 hide-scrollbar">
            <Link href="/dashboard" className={`flex items-center gap-3 text-zinc-100 bg-zinc-800 rounded-md transition-all ${isSidebarOpen ? 'px-3 py-2' : 'justify-center p-2 mx-auto w-10 h-10'}`} title="My Decks">
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              {isSidebarOpen && <span className="text-[13px] font-medium whitespace-nowrap">My Decks</span>}
            </Link>
            <Link href="#" className={`flex items-center gap-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-all ${isSidebarOpen ? 'px-3 py-2' : 'justify-center p-2 mx-auto w-10 h-10'}`} title="Templates">
              <span className="material-symbols-outlined text-[18px]">collections_bookmark</span>
              {isSidebarOpen && <span className="text-[13px] font-medium whitespace-nowrap">Templates</span>}
            </Link>
            <Link href="#" className={`flex items-center gap-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-all ${isSidebarOpen ? 'px-3 py-2' : 'justify-center p-2 mx-auto w-10 h-10'}`} title="Assets">
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
              {isSidebarOpen && <span className="text-[13px] font-medium whitespace-nowrap">Assets</span>}
            </Link>
            <Link href="#" className={`flex items-center gap-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-all ${isSidebarOpen ? 'px-3 py-2' : 'justify-center p-2 mx-auto w-10 h-10'}`} title="Analytics">
              <span className="material-symbols-outlined text-[18px]">insights</span>
              {isSidebarOpen && <span className="text-[13px] font-medium whitespace-nowrap">Analytics</span>}
            </Link>
            <Link href="#" className={`flex items-center gap-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-all ${isSidebarOpen ? 'px-3 py-2' : 'justify-center p-2 mx-auto w-10 h-10'}`} title="Settings">
              <span className="material-symbols-outlined text-[18px]">settings</span>
              {isSidebarOpen && <span className="text-[13px] font-medium whitespace-nowrap">Settings</span>}
            </Link>
          </div>
          
          {/* Footer Links */}
          <div className="mt-auto space-y-1 px-1 pb-2">
            <Link href="#" className={`flex items-center gap-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-all ${isSidebarOpen ? 'px-3 py-2' : 'justify-center p-2 mx-auto w-10 h-10'}`} title="Help">
              <span className="material-symbols-outlined text-[18px]">help</span>
              {isSidebarOpen && <span className="text-[13px] font-medium whitespace-nowrap">Help</span>}
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Top Navbar */}
          <header className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-30 pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-8 h-8 rounded-md bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSidebarOpen ? 'dock_to_left' : 'menu'}
                </span>
              </button>
            </div>
            
            <div className="flex items-center gap-4 pointer-events-auto">
               <Input 
                 placeholder="Search decks..."
                 startContent={<span className="material-symbols-outlined text-[16px] text-zinc-400">search</span>}
                 classNames={{
                   inputWrapper: "bg-zinc-900 border-zinc-800 hover:border-zinc-700 focus-within:!border-zinc-500 h-9 rounded-md text-[12px] w-64 transition-colors",
                   input: "text-zinc-100 placeholder:text-zinc-500"
                 }}
               />
               <Dropdown classNames={{ content: "bg-zinc-900 border border-zinc-800 min-w-[200px] rounded-md" }}>
                 <DropdownTrigger>
                   <button className="w-8 h-8 rounded-md border border-zinc-800 overflow-hidden cursor-pointer hover:border-zinc-600 transition-colors focus:outline-none">
                     <img alt="User profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs7pqOjEJ8RL8IBk5UXacZvYoifMKQ90sL-JWqlJ6UCTFu47cMWN4r-0B7PEu4NhJWWuuSB7BBqZ_TEFiuLFk8DGmYGjnCF2nevAvLm5x0FHDoHBPe7A4IpOcRz3BOh8U3R1eZZfUGjhgL3ISkaf4pstWt-QireVQYl66chhQglSoZGikHUCjrCjGTHRJFVtXOWM1aKOGngaRAS6b4PJqkeO8A4CpKtIVIm-zTDUyWargLHig-IRZdttEsRWs8Ix2kIF-kVygfSY4I" className="w-full h-full object-cover" />
                   </button>
                 </DropdownTrigger>
                 <DropdownMenu 
                    aria-label="User menu" 
                    itemClasses={{ base: "text-zinc-400 hover:text-zinc-100 data-[hover=true]:bg-zinc-800 data-[hover=true]:text-zinc-100 py-2 rounded-md" }}
                 >
                   <DropdownItem key="profile" startContent={<span className="material-symbols-outlined text-[16px]">account_circle</span>}>Profile Settings</DropdownItem>
                   <DropdownItem key="billing" startContent={<span className="material-symbols-outlined text-[16px]">credit_card</span>}>Billing & Plan</DropdownItem>
                   <DropdownItem key="logout" className="text-red-400 mt-2 border-t border-zinc-800/50 pt-2" color="danger" startContent={<span className="material-symbols-outlined text-[16px]">logout</span>}>
                     Log Out
                   </DropdownItem>
                 </DropdownMenu>
               </Dropdown>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto px-8 pt-20 pb-20 relative z-10 flex flex-col items-center">
            <div className="w-full max-w-[1600px]">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                  <h1 className="text-[24px] font-semibold text-zinc-100 tracking-tight">Welcome back</h1>
                  <p className="text-zinc-400 text-[14px] mt-1">Here's what's happening with your decks today.</p>
                </div>
                
                {/* Filter Chips */}
                <div className="flex items-center gap-2">
                  <Button size="sm" className="bg-zinc-800 text-zinc-100 rounded-md px-4 h-8 font-medium border border-zinc-700">All</Button>
                  <Button size="sm" variant="light" className="text-zinc-400 hover:text-zinc-100 rounded-md px-4 h-8 font-medium">Recent</Button>
                  <Button size="sm" variant="light" className="text-zinc-400 hover:text-zinc-100 rounded-md px-4 h-8 font-medium">Shared</Button>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-8 duration-700 fade-in delay-150">
                
                {/* Create New Card */}
                <Card 
                  isPressable 
                  as={Link} 
                  href="/deck/new"
                  className="group bg-transparent border border-dashed border-zinc-800 hover:border-zinc-500 hover:bg-zinc-900/50 rounded-lg overflow-hidden transition-all duration-200 flex flex-col h-full min-h-[240px]"
                >
                  <CardBody className="flex flex-col items-center justify-center p-6 relative h-full flex-1">
                    <div className="w-12 h-12 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 z-10 mb-4">
                      <span className="material-symbols-outlined text-[24px] text-zinc-300">add</span>
                    </div>
                    <h3 className="text-[14px] font-medium text-zinc-100 transition-colors">Create New Deck</h3>
                    <p className="text-[12px] text-zinc-500 mt-2 text-center max-w-[200px]">Start from scratch or use AI to generate your presentation.</p>
                  </CardBody>
                </Card>

                {/* Decks Grid */}
                {isLoading ? (
                  <div className="text-zinc-500 text-[13px] mt-4 px-2 col-span-full">Loading decks...</div>
                ) : (
                  decks?.map((deck: any, index: number) => {
                    const thumbnails = [
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuDk9cnzmeAgvcGe7didFz5CuZrmsvZYh-KSCOQ5jhM1vZEfkidL3e5hp70LEeKlUF0a7FyUJwKO_NM7U04DVJE47OCGtlJxUHex60GX8sF5Lb11I4Hc72-qNnrJqSMWATYNfIwrp5dvYekMwq_eabQzoAshQoCQqKA7y5XA6imXsfE423UbFZzSQU4o6LyJqVgQd1Zgy5fiQH593_HxhIzgSwWUbyVO0kTbAF9PISelFURkLJfnKx2kZVFJKTvZ88gMap8ERyy07WfL",
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3oJe94Q4mMneGMBF8wmCeWhchUZe9HsNwC6QWM5EVi6B1RA2dFKMkJTOtCSzyjJjivGekvxvvr5f6FftOMs9SB6NwZNZoVtSW2jEsMqr3PtNfiaws_aDG9nUeyeLhnVgI-HsqBPFDPYkL-QnTdSOEfTHt68KVD2x6mmaPIWlkBrpr4vucO7Uxu6TRJvtvNbAoV1rt_krdDYKaGznlAlcrjTs2fyzCQmH_BPdV9RVmbe1LzSGrnV0jL-YaOuKQJGf_4i_EmlihBmpE",
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuDAsD7IojA3Umims_I6S5_E0TChjStU7Bb4em_K7ayb1Tvz9eq_bvdhF3mth0gPVcdsgbpzBVP24uEsearheg2Fx31EPMosuiu_UvTvPqJfPVEmF_pilEEdw_kMG6BqQx-nhNgek3azogKNUDQEpPAScI71Vi6Jk2BxvG6yUSuqwBPGuqSsdbu3vnCUrVrZZxpdkdG4LzbrVkGxmS07ytz5fqJdX8FllwA8kAzB6zbq3p4k7HjUBINsm0TToCCguBPnd_-fM6OcY0rI"
                    ];
                    const thumb = thumbnails[index % thumbnails.length];

                    return (
                      <Card
                        key={deck._id}
                        isPressable
                        as={Link}
                        href={`/deck/${deck._id}/editor`}
                        className="group bg-[#18181b] border border-zinc-800 hover:border-zinc-700 rounded-lg overflow-hidden transition-all duration-200 shadow-sm flex flex-col h-full min-h-[240px]"
                      >
                        <CardBody className="p-0 relative aspect-video bg-zinc-900 overflow-hidden rounded-t-lg flex-shrink-0 border-b border-zinc-800">
                           <img src={thumb} alt={deck.title} className="w-full h-full object-cover group-hover:scale-105 group-hover:opacity-80 transition-all duration-500" />
                           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                           
                           {/* Hover Edit Button Overlay */}
                           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="px-3 py-1.5 rounded-md bg-white text-black text-[12px] font-medium flex items-center gap-1.5 shadow-sm transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                Open Editor
                              </div>
                           </div>

                           {/* Top Badges */}
                           <div className="absolute top-2 left-2 flex gap-2 z-10">
                             <span className="px-2 py-0.5 rounded-[4px] bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 text-[10px] font-medium text-zinc-300 uppercase">
                               Draft
                             </span>
                           </div>
                           <div className="absolute top-2 right-2 flex gap-2 z-10">
                             <span className="px-2 py-0.5 rounded-[4px] bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 text-[10px] font-medium text-zinc-300 flex items-center gap-1">
                               <span className="material-symbols-outlined text-[12px]">view_carousel</span>
                               {deck.slides?.length || 0}
                             </span>
                           </div>
                        </CardBody>
                        
                        <CardFooter className="p-4 flex flex-col items-start bg-[#18181b] flex-1 justify-between">
                          <div className="w-full mb-3">
                            <h3 className="text-[14px] font-medium text-zinc-100 truncate w-full mb-1">{deck.title}</h3>
                            <div className="flex items-center gap-1.5 text-zinc-500">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              <p className="text-[11px]">Edited {new Date(deck.updatedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          {/* Card Footer Actions */}
                          <div className="w-full flex items-center justify-between pt-3 border-t border-zinc-800">
                            <div className="flex -space-x-1.5">
                               <div className="w-6 h-6 rounded-full bg-blue-500 border border-zinc-900 flex items-center justify-center text-[10px] text-white font-medium z-20">N</div>
                               <div className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center text-[10px] text-zinc-300 font-medium z-10">+2</div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button 
                                isIconOnly 
                                variant="light" 
                                size="sm" 
                                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors h-7 w-7 min-w-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                title="Share Presentation"
                              >
                                <span className="material-symbols-outlined text-[16px]">share</span>
                              </Button>
                              <Button 
                                isIconOnly 
                                variant="light" 
                                size="sm" 
                                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors h-7 w-7 min-w-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                title="Present"
                              >
                                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                              </Button>
                              
                              <Dropdown classNames={{ content: "bg-zinc-900 border border-zinc-800 min-w-[160px] rounded-md" }}>
                                <DropdownTrigger>
                                  <Button 
                                    isIconOnly 
                                    variant="light" 
                                    size="sm" 
                                    className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md z-20 transition-colors ml-1 h-7 w-7 min-w-0"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                  >
                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu 
                                  aria-label="Deck Actions" 
                                  itemClasses={{ base: "text-zinc-400 hover:text-zinc-100 data-[hover=true]:bg-zinc-800 data-[hover=true]:text-zinc-100 py-2 rounded-md" }}
                                >
                                  <DropdownItem key="edit" startContent={<span className="material-symbols-outlined text-[16px]">edit</span>}>Edit Deck</DropdownItem>
                                  <DropdownItem key="duplicate" startContent={<span className="material-symbols-outlined text-[16px]">content_copy</span>}>Duplicate</DropdownItem>
                                  <DropdownItem key="export" startContent={<span className="material-symbols-outlined text-[16px]">download</span>}>Export PDF</DropdownItem>
                                  <DropdownItem 
                                    key="delete" 
                                    className="text-red-400 mt-1 border-t border-zinc-800/50 pt-2" 
                                    color="danger"
                                    startContent={<span className="material-symbols-outlined text-[16px]">delete</span>}
                                    onClick={(e) => {
                                      handleDelete(deck._id);
                                    }}
                                  >
                                    Delete
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                          </div>
                        </CardFooter>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
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
