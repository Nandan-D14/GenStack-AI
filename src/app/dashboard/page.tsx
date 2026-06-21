"use client";

import { Button, Card, CardBody, Badge, Avatar, AvatarGroup, Chip, Progress, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { FileText, Plus, Sparkles, Users, Clock, TrendingUp, MoreHorizontal, Download, Share2, Copy, Trash2, Settings, LayoutTemplate } from "lucide-react";
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
    <div className="min-h-screen bg-[#08090A] text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.08] bg-[#0F1011]/50 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-default-400 mt-1">Manage your presentations and team decks</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="flat" className="bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] rounded-xl text-default-300" startContent={<LayoutTemplate className="w-4 h-4" />}>Templates</Button>
          <Button variant="flat" className="bg-[#151617] border border-white/[0.06] hover:border-white/[0.12] rounded-xl text-default-300" startContent={<Settings className="w-4 h-4" />}>Brand Kit</Button>
          <Button as={Link} href="/deck/new" className="bg-[#7170FF] text-white hover:bg-[#605eff] font-medium rounded-xl shadow-lg shadow-[#7170FF]/20" startContent={<Plus className="w-4 h-4" />}>New Deck</Button>
        </div>
      </div>

      <div className="px-8 py-8 max-w-7xl mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Decks", value: decks?.length?.toString() || "0", icon: FileText, color: "text-[#7170FF] bg-[#7170FF]/10" },
            { label: "This Month", value: "8", icon: TrendingUp, color: "text-warning bg-warning/10" },
            { label: "Collaborators", value: "12", icon: Users, color: "text-success bg-success/10" },
            { label: "Avg. Time Saved", value: "3.2h", icon: Clock, color: "text-secondary bg-secondary/10" }
          ].map((stat) => (
            <Card key={stat.label} className="bg-[#0F1011] border border-white/[0.06] rounded-2xl shadow-md">
              <CardBody className="flex flex-row items-center gap-4 p-5">
                <div className={`p-3 rounded-xl ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                  <p className="text-xs text-default-400 font-medium uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* List Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white tracking-tight">Recent Decks</h2>
            <div className="flex gap-2">
              <Chip size="sm" variant="solid" className="bg-[#7170FF] text-white">All Decks</Chip>
              <Chip size="sm" variant="flat" className="bg-[#151617] border border-white/[0.06] text-default-400 hover:text-white">Drafts</Chip>
              <Chip size="sm" variant="flat" className="bg-[#151617] border border-white/[0.06] text-default-400 hover:text-white">Published</Chip>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-default-500 font-medium">Loading presentations...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks?.map((deck: any) => (
                <Card key={deck._id} className="bg-[#0F1011] border border-white/[0.06] hover:border-[#7170FF]/40 transition-all duration-300 rounded-2xl group shadow-lg">
                  <CardBody className="p-5 flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <Badge color="primary" variant="flat" className="text-[10px] uppercase font-semibold bg-[#7170FF]/15 text-[#7170FF] border border-[#7170FF]/25 tracking-wider px-2 py-0.5 rounded-full">
                          {deck.status}
                        </Badge>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly variant="light" size="sm" className="text-default-400 hover:text-white"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Deck actions" className="bg-[#0F1011] border border-white/[0.08] text-white">
                            <DropdownItem key="dup" className="hover:bg-[#151617] text-white" startContent={<Copy className="w-4 h-4" />}>Duplicate</DropdownItem>
                            <DropdownItem key="share" className="hover:bg-[#151617] text-white" startContent={<Share2 className="w-4 h-4" />}>Share</DropdownItem>
                            <DropdownItem key="export" as={Link} href={`/deck/${deck._id}/export`} className="hover:bg-[#151617] text-white" startContent={<Download className="w-4 h-4" />}>Export</DropdownItem>
                            <DropdownItem key="del" className="text-danger hover:bg-[#151617]" onPress={() => handleDelete(deck._id)} startContent={<Trash2 className="w-4 h-4" />}>Delete</DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>

                      <Link href={`/deck/${deck._id}/editor`} className="block">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#7170FF] transition-colors mb-2 tracking-tight leading-tight">
                          {deck.title}
                        </h3>
                        <Chip size="sm" variant="flat" className="bg-[#151617] border border-white/[0.06] text-default-400 capitalize font-medium">
                          {deck.type}
                        </Chip>
                      </Link>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-3">
                      <div className="flex items-center justify-between text-xs text-default-400">
                        <span className="font-medium">{deck.slides?.length || 0} slides</span>
                        <span>{new Date(deck.updatedAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <AvatarGroup size="sm" isBordered max={3}>
                          <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deck._id}-0`} className="w-6 h-6 border-white/[0.08]" />
                        </AvatarGroup>
                        <Tooltip content="Edit with AI" className="bg-[#0F1011] text-white border border-white/[0.08] text-xs">
                          <Button isIconOnly size="sm" variant="light" className="text-[#7170FF] hover:bg-[#7170FF]/10 rounded-lg" as={Link} href={`/deck/${deck._id}/editor`}>
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}

              {/* Create Card Button */}
              <Card as={Link} href="/deck/new" className="bg-[#0F1011]/30 border border-white/[0.06] border-dashed hover:border-[#7170FF]/40 hover:bg-[#0F1011]/60 transition-all duration-300 rounded-2xl cursor-pointer shadow-lg min-h-[220px]">
                <CardBody className="p-5 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-12 h-12 bg-[#151617] border border-white/[0.06] rounded-full flex items-center justify-center mb-4 text-[#7170FF] group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <p className="text-white font-semibold tracking-tight text-base">Create New Deck</p>
                  <p className="text-sm text-default-500 mt-1 max-w-[200px]">From prompt, notes, document or web link</p>
                </CardBody>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
