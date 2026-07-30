"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import FileUploader from "../../../components/FileUploader";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

export default function NewDeckPage() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Professional");
  const [audience, setAudience] = useState("Executive Board");
  const [slidesCount, setSlidesCount] = useState(12);
  const [designSkill, setDesignSkill] = useState<string>("");
  const [skills, setSkills] = useState<
    { id: string; name: string; description: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.skills)) {
          setSkills(d.skills);
          if (d.skills.length > 0) setDesignSkill(d.skills[0].id);
        }
      })
      .catch(() => {});
  }, []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals and source attachment states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{
    storageId: string;
    name: string;
  } | null>(null);
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);

  const router = useRouter();
  const runCreateDeck = useMutation(api.decks.create);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      // Build a comprehensive objective description incorporating attachments
      let finalObjective = prompt;
      if (uploadedFile) {
        finalObjective += `\n[Attached Reference File: ${uploadedFile.name} (ID: ${uploadedFile.storageId})]`;
      }
      if (attachedUrl) {
        finalObjective += `\n[Attached Reference URL: ${attachedUrl}]`;
      }

      const newDeckId = await runCreateDeck({
        title: prompt.slice(0, 60) || "New Presentation",
        type: "pitch",
        tone: tone.toLowerCase(),
        objective: finalObjective || "General outline generation",
        audience: audience,
        slidesCount: slidesCount,
        designSkill: designSkill || undefined,
      });
      router.push(`/deck/${newDeckId}/plan`);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };

  const handleAttachUrl = () => {
    if (urlInput.trim()) {
      setAttachedUrl(urlInput.trim());
      setUrlInput("");
      setShowUrlModal(false);
    }
  };

  return (
    <div className="bg-[#08090A] text-[#F7F8F8] font-body-md antialiased overflow-hidden selection:bg-[#7170FF]/30 selection:text-[#F7F8F8]">
      <div className="flex h-screen w-full">
        {/* SideNavBar Component */}
        <nav 
          className={`hidden md:flex flex-col h-screen sticky top-0 py-6 bg-[#08090A] border-r border-[#FFFFFF0D] shrink-0 z-20 transition-all duration-300 ${isSidebarOpen ? 'w-64 px-4' : 'w-20 px-2'}`}
        >
          {/* Header */}
          <div className={`mb-8 flex items-start gap-3 ${isSidebarOpen ? 'px-2' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7170FF]/20 to-[#FFFFFF0D] border border-[#FFFFFF1A] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(113,112,255,0.1)]">
              <span className="material-symbols-outlined text-[20px] text-[#F7F8F8]">layers</span>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col justify-center h-10 overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
                <h2 className="text-[15px] font-semibold text-[#F7F8F8] tracking-tight leading-none">
                  GenStackAI
                </h2>
                <span className="text-[11px] font-medium text-[#7170FF] mt-1 tracking-wide uppercase">
                  Workspace Pro
                </span>
              </div>
            )}
          </div>
          
          {/* CTA */}
          <div className="mb-8 px-1">
            <button className={`w-full bg-[#F7F8F8] text-[#08090A] rounded-full font-medium flex items-center justify-center gap-2 hover:bg-[#E5E5E6] transition-all overflow-hidden ${isSidebarOpen ? 'h-11 text-[13px] px-4' : 'h-10 w-10 mx-auto text-transparent'}`}>
              <span className={`material-symbols-outlined ${isSidebarOpen ? 'text-[18px]' : 'text-[20px] text-[#08090A]'}`}>add</span>
              {isSidebarOpen && <span>New Presentation</span>}
            </button>
          </div>
          
          {/* Navigation Links */}
          <div className="flex-1 space-y-1.5 overflow-y-auto px-1 hide-scrollbar">
            <Link href="/dashboard" className={`flex items-center gap-3 text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0D] rounded-xl transition-all ${isSidebarOpen ? 'px-4 py-3' : 'justify-center p-3 mx-auto w-12 h-12'}`} title="My Decks">
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              {isSidebarOpen && <span className="text-[14px] font-medium whitespace-nowrap">My Decks</span>}
            </Link>
            <Link href="#" className={`flex items-center gap-3 text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0D] rounded-xl transition-all ${isSidebarOpen ? 'px-4 py-3' : 'justify-center p-3 mx-auto w-12 h-12'}`} title="Templates">
              <span className="material-symbols-outlined text-[20px]">collections_bookmark</span>
              {isSidebarOpen && <span className="text-[14px] font-medium whitespace-nowrap">Templates</span>}
            </Link>
            <Link href="#" className={`flex items-center gap-3 text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0D] rounded-xl transition-all ${isSidebarOpen ? 'px-4 py-3' : 'justify-center p-3 mx-auto w-12 h-12'}`} title="Assets">
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
              {isSidebarOpen && <span className="text-[14px] font-medium whitespace-nowrap">Assets</span>}
            </Link>
            <Link href="#" className={`flex items-center gap-3 text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0D] rounded-xl transition-all ${isSidebarOpen ? 'px-4 py-3' : 'justify-center p-3 mx-auto w-12 h-12'}`} title="Analytics">
              <span className="material-symbols-outlined text-[20px]">insights</span>
              {isSidebarOpen && <span className="text-[14px] font-medium whitespace-nowrap">Analytics</span>}
            </Link>
            <Link href="#" className={`flex items-center gap-3 text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0D] rounded-xl transition-all ${isSidebarOpen ? 'px-4 py-3' : 'justify-center p-3 mx-auto w-12 h-12'}`} title="Settings">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              {isSidebarOpen && <span className="text-[14px] font-medium whitespace-nowrap">Settings</span>}
            </Link>
          </div>
          
          {/* Footer Links */}
          <div className="mt-auto space-y-1.5 px-1 pb-2">
            <Link href="#" className={`flex items-center gap-3 text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0D] rounded-xl transition-all ${isSidebarOpen ? 'px-4 py-3' : 'justify-center p-3 mx-auto w-12 h-12'}`} title="Help">
              <span className="material-symbols-outlined text-[20px]">help</span>
              {isSidebarOpen && <span className="text-[14px] font-medium whitespace-nowrap">Help</span>}
            </Link>
            <Link href="/" className={`flex items-center gap-3 text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0D] rounded-xl transition-all mt-2 ${isSidebarOpen ? 'px-4 py-3' : 'justify-center p-2 mx-auto w-12 h-12'}`} title="Logout">
              <div className="w-8 h-8 rounded-full bg-[#FFFFFF1A] border border-[#FFFFFF1A] flex items-center justify-center text-[12px] text-[#F7F8F8] shrink-0">N</div>
              {isSidebarOpen && <span className="text-[14px] font-medium whitespace-nowrap">Logout</span>}
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Top Navbar for Sidebar Toggle */}
          <header className="absolute top-0 left-0 right-0 h-16 flex items-center px-6 z-30 pointer-events-none">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-10 h-10 rounded-full bg-[#FFFFFF0A] border border-[#FFFFFF0D] hover:bg-[#FFFFFF1A] text-[#A1A5AE] hover:text-[#F7F8F8] flex items-center justify-center transition-colors pointer-events-auto shadow-sm backdrop-blur-md"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSidebarOpen ? 'dock_to_left' : 'menu'}
              </span>
            </button>
          </header>

          {/* Atmospheric Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-[#7170FF]/10 to-transparent blur-[120px] pointer-events-none z-0"></div>
          
          <div className="flex-1 overflow-y-auto px-8 py-20 relative z-10 flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl flex flex-col items-center gap-8">
              
              {/* Header */}
              <div className="text-center space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                <h1 className="text-[48px] font-medium leading-tight tracking-tight text-[#F7F8F8]">
                  What are we building today?
                </h1>
                <p className="text-[16px] text-[#A1A5AE] max-w-xl mx-auto leading-relaxed">
                  Provide a topic, upload your documents, or link a URL.
                </p>
              </div>

              {/* Redesigned Input Command Center */}
              <div className="w-full relative group animate-in slide-in-from-bottom-8 duration-700 fade-in delay-150">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7170FF]/20 via-[#FFFFFF1A] to-[#7170FF]/20 rounded-3xl blur opacity-30 group-focus-within:opacity-100 transition duration-700"></div>
                
                <div className="relative bg-[#0A0B0C] border border-[#FFFFFF1A] rounded-3xl overflow-hidden shadow-2xl transition-all focus-within:border-[#7170FF]/50 flex flex-col">
                  
                  {/* Text Area */}
                  <div className="p-6 pb-2 relative">
                    <textarea
                       value={prompt}
                       onChange={(e) => setPrompt(e.target.value)}
                       placeholder="e.g., A sleek quarterly business review focusing on Q3 SaaS growth..."
                       className="w-full h-36 bg-transparent border-none outline-none text-[18px] leading-relaxed text-[#F7F8F8] placeholder:text-[#6C707A] resize-none"
                    />
                    
                    {/* Attachments */}
                    {(uploadedFile || attachedUrl) && (
                      <div className="flex flex-wrap gap-2 mt-2 pt-4 border-t border-[#FFFFFF0D]">
                        {uploadedFile && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFFFFF08] border border-[#FFFFFF1A] text-[13px] text-[#A1A5AE]">
                            <span className="material-symbols-outlined text-[16px] text-[#7170FF]">description</span>
                            <span>{uploadedFile.name}</span>
                            <button onClick={() => setUploadedFile(null)} className="hover:text-[#F7F8F8] ml-1 transition-colors">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        )}
                        {attachedUrl && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFFFFF08] border border-[#FFFFFF1A] text-[13px] text-[#A1A5AE]">
                            <span className="material-symbols-outlined text-[16px] text-[#7170FF]">link</span>
                            <span className="truncate max-w-[200px]">{attachedUrl}</span>
                            <button onClick={() => setAttachedUrl(null)} className="hover:text-[#F7F8F8] ml-1 transition-colors">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom Control Bar */}
                  <div className="px-4 py-3 bg-[#0F1011] border-t border-[#FFFFFF0D] flex flex-wrap items-center justify-between gap-4">
                    
                    {/* Inline Settings & Attachments */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => setShowUploadModal(true)} className="w-10 h-10 rounded-full bg-[#FFFFFF08] hover:bg-[#FFFFFF1A] border border-[#FFFFFF0D] flex items-center justify-center text-[#A1A5AE] hover:text-[#F7F8F8] transition-colors" title="Upload File">
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                      </button>
                      <button onClick={() => setShowUrlModal(true)} className="w-10 h-10 rounded-full bg-[#FFFFFF08] hover:bg-[#FFFFFF1A] border border-[#FFFFFF0D] flex items-center justify-center text-[#A1A5AE] hover:text-[#F7F8F8] transition-colors" title="Attach URL">
                        <span className="material-symbols-outlined text-[18px]">link</span>
                      </button>
                      
                      <div className="w-[1px] h-6 bg-[#FFFFFF1A] mx-1"></div>
                      
                      {/* Tone Dropdown */}
                      <Dropdown classNames={{ content: "bg-[#0F1011] border border-[#FFFFFF1A] min-w-[150px]" }}>
                        <DropdownTrigger>
                          <div className="relative group/tone flex items-center h-10 rounded-full bg-[#FFFFFF08] border border-[#FFFFFF0D] px-3 hover:bg-[#FFFFFF1A] transition-colors cursor-pointer">
                             <span className="material-symbols-outlined text-[16px] text-[#A1A5AE] mr-1.5">palette</span>
                             <span className="text-[13px] font-medium text-[#A1A5AE] pr-4">{tone}</span>
                             <span className="material-symbols-outlined absolute right-2 text-[16px] text-[#A1A5AE] pointer-events-none">arrow_drop_down</span>
                          </div>
                        </DropdownTrigger>
                        <DropdownMenu 
                          aria-label="Tone selection"
                          onAction={(key) => setTone(key as string)}
                          itemClasses={{
                            base: "text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0A] data-[hover=true]:bg-[#FFFFFF0A] data-[hover=true]:text-[#F7F8F8]",
                          }}
                        >
                          <DropdownItem key="Professional">Professional</DropdownItem>
                          <DropdownItem key="Creative">Creative</DropdownItem>
                          <DropdownItem key="Persuasive">Persuasive</DropdownItem>
                        </DropdownMenu>
                      </Dropdown>

                      {/* Audience Dropdown */}
                      <Dropdown classNames={{ content: "bg-[#0F1011] border border-[#FFFFFF1A] min-w-[150px]" }}>
                        <DropdownTrigger>
                          <div className="relative flex items-center h-10 rounded-full bg-[#FFFFFF08] border border-[#FFFFFF0D] px-3 hover:bg-[#FFFFFF1A] transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-[16px] text-[#A1A5AE] mr-1.5">groups</span>
                            <span className="text-[13px] font-medium text-[#A1A5AE] pr-4 whitespace-nowrap">{audience}</span>
                            <span className="material-symbols-outlined absolute right-2 text-[16px] text-[#A1A5AE] pointer-events-none">arrow_drop_down</span>
                          </div>
                        </DropdownTrigger>
                        <DropdownMenu 
                          aria-label="Audience selection"
                          onAction={(key) => setAudience(key as string)}
                          itemClasses={{
                            base: "text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0A] data-[hover=true]:bg-[#FFFFFF0A] data-[hover=true]:text-[#F7F8F8]",
                          }}
                        >
                          <DropdownItem key="Executive Board">Exec Board</DropdownItem>
                          <DropdownItem key="General Public">General</DropdownItem>
                          <DropdownItem key="Technical Team">Technical</DropdownItem>
                          <DropdownItem key="Investors">Investors</DropdownItem>
                        </DropdownMenu>
                      </Dropdown>

                      {/* Design Skill Dropdown */}
                      {skills.length > 0 && (
                        <Dropdown classNames={{ content: "bg-[#0F1011] border border-[#FFFFFF1A] min-w-[200px]" }}>
                          <DropdownTrigger>
                            <div className="relative flex items-center h-10 rounded-full bg-[#FFFFFF08] border border-[#FFFFFF0D] px-3 hover:bg-[#FFFFFF1A] transition-colors cursor-pointer">
                              <span className="material-symbols-outlined text-[16px] text-[#A1A5AE] mr-1.5">brush</span>
                              <span className="text-[13px] font-medium text-[#A1A5AE] pr-4 whitespace-nowrap max-w-[140px] truncate">
                                {skills.find((s) => s.id === designSkill)?.name || "Design"}
                              </span>
                              <span className="material-symbols-outlined absolute right-2 text-[16px] text-[#A1A5AE] pointer-events-none">arrow_drop_down</span>
                            </div>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Design skill selection"
                            onAction={(key) => setDesignSkill(key as string)}
                            itemClasses={{
                              base: "text-[#A1A5AE] hover:text-[#F7F8F8] hover:bg-[#FFFFFF0A] data-[hover=true]:bg-[#FFFFFF0A] data-[hover=true]:text-[#F7F8F8]",
                            }}
                          >
                            {skills.map((s) => (
                              <DropdownItem key={s.id}>{s.name}</DropdownItem>
                            ))}
                          </DropdownMenu>
                        </Dropdown>
                      )}

                      {/* Slides Slider inside popover or inline */}
                      <div className="hidden sm:flex items-center gap-2 h-10 rounded-full bg-[#FFFFFF08] border border-[#FFFFFF0D] px-4">
                        <span className="text-[13px] font-medium text-[#A1A5AE] min-w-[65px]">{slidesCount} Slides</span>
                        <input
                          type="range"
                          min="5"
                          max="30"
                          value={slidesCount}
                          onChange={(e) => setSlidesCount(parseInt(e.target.value))}
                          className="w-20 accent-[#7170FF] h-1 bg-[#FFFFFF1A] rounded-full appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    {/* Primary Generate Action */}
                    <button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || (!prompt.trim() && !uploadedFile && !attachedUrl)} 
                      className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F7F8F8] text-[#08090A] text-[14px] font-semibold hover:bg-[#E5E5E6] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed ml-auto shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isGenerating ? 'hourglass_empty' : 'auto_awesome'}
                      </span>
                      {isGenerating ? "Generating..." : "Generate Deck"}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* Upload File Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        size="lg"
        backdrop="blur"
        classNames={{
          base: "bg-[#0F1011] border border-[#FFFFFF1A] rounded-2xl text-[#F7F8F8]",
        }}
      >
        <ModalContent>
          <ModalHeader className="font-semibold text-lg pb-2 text-[#F7F8F8]">
            Upload Reference Material
          </ModalHeader>
          <ModalBody className="py-4">
            <FileUploader
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
              maxSizeMB={10}
              onFileUploaded={(storageId, fileName) => {
                setUploadedFile({ storageId, name: fileName });
                setShowUploadModal(false);
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              className="rounded-full bg-[#FFFFFF0A] text-[#F7F8F8] hover:bg-[#FFFFFF1A]"
              onPress={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add URL Modal */}
      <Modal
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        size="md"
        backdrop="blur"
        classNames={{
          base: "bg-[#0F1011] border border-[#FFFFFF1A] rounded-2xl text-[#F7F8F8]",
        }}
      >
        <ModalContent>
          <ModalHeader className="font-semibold text-lg pb-2 text-[#F7F8F8]">
            Attach Web URL
          </ModalHeader>
          <ModalBody className="py-4 space-y-3">
            <p className="text-[13px] text-[#A1A5AE]">
              Provide a webpage URL to extract content and reference it for
              generating your slides.
            </p>
            <Input
              autoFocus
              label="Website URL"
              placeholder="https://example.com/article"
              value={urlInput}
              onValueChange={setUrlInput}
              variant="bordered"
              classNames={{
                inputWrapper:
                  "border-[#FFFFFF1A] hover:border-[#FFFFFF33] focus-within:!border-[#7170FF] rounded-xl bg-transparent transition-colors",
                input: "text-[#F7F8F8]",
                label: "text-[#A1A5AE]"
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              className="rounded-full bg-[#FFFFFF0A] text-[#F7F8F8] hover:bg-[#FFFFFF1A]"
              onPress={() => setShowUrlModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-[#F7F8F8] text-[#08090A]"
              onPress={handleAttachUrl}
            >
              Attach URL
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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

