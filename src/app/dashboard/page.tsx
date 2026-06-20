"use client";

import { Button, Card, CardBody, Badge, Avatar, AvatarGroup, Chip, Progress, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { FileText, Plus, Sparkles, Users, Clock, TrendingUp, MoreHorizontal, Download, Share2, Copy, Trash2, Settings, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DashboardPage() {
  const decks = useQuery(api.decks.list);
  const isLoading = decks === undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-8 py-6 border-b border-divider">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-default-400 mt-1">Manage your presentations and team decks</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="flat" startContent={<LayoutTemplate className="w-4 h-4" />}>Templates</Button>
          <Button variant="flat" startContent={<Settings className="w-4 h-4" />}>Brand Kit</Button>
          <Button as={Link} href="/deck/new" color="primary" startContent={<Plus className="w-4 h-4" />}>New Deck</Button>
        </div>
      </div>
      <div className="px-8 py-6">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[{ label: "Total Decks", value: decks?.length?.toString() || "0", icon: FileText }, { label: "This Month", value: "8", icon: TrendingUp }, { label: "Collaborators", value: "12", icon: Users }, { label: "Avg. Time Saved", value: "3.2h", icon: Clock }].map((stat) => (
            <Card key={stat.label} className="bg-content1 border border-default">
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3 bg-content2 rounded-xl"><stat.icon className="w-5 h-5 text-primary" /></div>
                <div><p className="text-2xl font-bold text-foreground">{stat.value}</p><p className="text-sm text-default-400">{stat.label}</p></div>
              </CardBody>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Decks</h2>
          <div className="flex gap-2">
            <Chip variant="flat" className="bg-content2 text-default-300">All</Chip>
            <Chip variant="flat" className="bg-content2/50 text-default-500">Drafts</Chip>
            <Chip variant="flat" className="bg-content2/50 text-default-500">Published</Chip>
          </div>
        </div>
        {isLoading ? (
          <div className="text-center py-20 text-default-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {decks?.map((deck: any) => (
              <Card key={deck._id} className="bg-content1 border border-default hover:border-default-200 transition-colors">
                <CardBody className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge color="default" variant="flat" className="text-xs capitalize">{deck.status}</Badge>
                    <Dropdown>
                      <DropdownTrigger><Button isIconOnly variant="light" size="sm"><MoreHorizontal className="w-4 h-4 text-default-400" /></Button></DropdownTrigger>
                      <DropdownMenu aria-label="Deck actions">
                        <DropdownItem key="dup" startContent={<Copy className="w-4 h-4" />}>Duplicate</DropdownItem>
                        <DropdownItem key="share" startContent={<Share2 className="w-4 h-4" />}>Share</DropdownItem>
                        <DropdownItem key="export" startContent={<Download className="w-4 h-4" />}>Export</DropdownItem>
                        <DropdownItem key="del" className="text-danger" startContent={<Trash2 className="w-4 h-4" />}>Delete</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                  <Link href={`/deck/${deck._id}/editor`} className="block group">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">{deck.title}</h3>
                    <Chip size="sm" variant="flat" color="secondary">{deck.type}</Chip>
                  </Link>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-default-500">{deck.slides?.length || 0} slides</span>
                      <span className="text-default-500">{new Date(deck.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <Progress value={75} color="primary" size="sm" className="h-1" />
                    <div className="flex items-center justify-between">
                      <AvatarGroup size="sm" isBordered max={3}>
                        <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${deck._id}-0`} className="w-6 h-6" />
                      </AvatarGroup>
                      <Tooltip content="Edit with AI">
                        <Button isIconOnly size="sm" variant="light" className="text-primary" as={Link} href={`/deck/${deck._id}/editor`}><Sparkles className="w-4 h-4" /></Button>
                      </Tooltip>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
            <Card className="bg-content1/50 border border-default border-dashed hover:border-default-200 transition-colors cursor-pointer">
              <CardBody className="p-5 flex flex-col items-center justify-center h-full min-h-[200px]">
                <Link href="/deck/new" className="text-center">
                  <div className="w-12 h-12 bg-content2 rounded-full flex items-center justify-center mx-auto mb-3"><Plus className="w-6 h-6 text-default-400" /></div>
                  <p className="text-foreground font-medium">Create New Deck</p>
                  <p className="text-sm text-default-500 mt-1">From prompt, notes, or upload</p>
                </Link>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
