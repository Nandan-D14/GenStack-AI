"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import FileUploader from "../../../components/FileUploader";
import { AppShell } from "@/components/AppShell";
import { Chip } from "@/components/ui";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";

const TONES = ["Professional", "Creative", "Persuasive"] as const;
const AUDIENCES = [
  "Executive Board",
  "General Public",
  "Technical Team",
  "Investors",
] as const;

export default function NewDeckPage() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<string>("Professional");
  const [audience, setAudience] = useState<string>("Executive Board");
  const [slidesCount, setSlidesCount] = useState(12);
  const [designSkill, setDesignSkill] = useState<string>("");
  const [skills, setSkills] = useState<
    { id: string; name: string; description: string }[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{
    storageId: string;
    name: string;
  } | null>(null);
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);

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

  const router = useRouter();
  const runCreateDeck = useMutation(api.decks.create);
  const runIngestUrl = useAction(api.rag.ingestUrl);
  const runIngestStorage = useAction(api.rag.ingestStorage);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
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

      try {
        const ingestions: Promise<any>[] = [];
        if (attachedUrl) {
          ingestions.push(runIngestUrl({ deckId: newDeckId, url: attachedUrl }));
        }
        if (uploadedFile) {
          ingestions.push(
            runIngestStorage({
              deckId: newDeckId,
              storageId: uploadedFile.storageId,
              fileName: uploadedFile.name,
            }),
          );
        }
        if (ingestions.length) await Promise.allSettled(ingestions);
      } catch {
        // non-fatal
      }

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
    <AppShell
      title="Create"
      actions={
        <Link href="/dashboard" className="gs-btn-ghost h-8 text-xs">
          Back to decks
        </Link>
      }
    >
      <div className="relative min-h-full flex flex-col items-center justify-center px-4 py-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[360px] bg-gs-accent/10 blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-3xl space-y-8">
          <div className="text-center space-y-3">
            <Chip tone="accent">New deck</Chip>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              What are we building today?
            </h1>
            <p className="text-sm text-gs-secondary max-w-lg mx-auto">
              Describe the deck, attach a PDF/URL for RAG, and pick tone, audience, and design skill.
            </p>
          </div>

          <div className="gs-card overflow-hidden p-0 shadow-gs">
            <div className="p-5 md:p-6">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A Series A pitch for a B2B AI infrastructure startup focusing on traction and the ask…"
                className="w-full h-36 bg-transparent border-none outline-none text-[15px] leading-relaxed text-gs-text placeholder:text-gs-muted resize-none"
              />

              {(uploadedFile || attachedUrl) && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gs-border">
                  {uploadedFile && (
                    <Chip tone="accent">
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      {uploadedFile.name}
                      <button
                        type="button"
                        onClick={() => setUploadedFile(null)}
                        className="hover:text-white ml-0.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </Chip>
                  )}
                  {attachedUrl && (
                    <Chip tone="info">
                      <span className="material-symbols-outlined text-[14px]">link</span>
                      <span className="truncate max-w-[180px]">{attachedUrl}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedUrl(null)}
                        className="hover:text-white ml-0.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </Chip>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 py-3 bg-gs-elevated border-t border-gs-border flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="gs-btn-icon"
                title="Upload file"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
              </button>
              <button
                type="button"
                onClick={() => setShowUrlModal(true)}
                className="gs-btn-icon"
                title="Attach URL"
              >
                <span className="material-symbols-outlined text-[18px]">link</span>
              </button>

              <div className="w-px h-5 bg-gs-border mx-1" />

              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="h-8 rounded-md border border-gs-border bg-gs-surface-2 px-2 text-xs text-gs-secondary"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="h-8 rounded-md border border-gs-border bg-gs-surface-2 px-2 text-xs text-gs-secondary max-w-[140px]"
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              {skills.length > 0 && (
                <select
                  value={designSkill}
                  onChange={(e) => setDesignSkill(e.target.value)}
                  className="h-8 rounded-md border border-gs-border bg-gs-surface-2 px-2 text-xs text-gs-secondary max-w-[160px]"
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="hidden sm:flex items-center gap-2 h-8 rounded-md border border-gs-border bg-gs-surface-2 px-3">
                <span className="text-xs text-gs-secondary tabular-nums">{slidesCount} slides</span>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={slidesCount}
                  onChange={(e) => setSlidesCount(parseInt(e.target.value, 10))}
                  className="w-20 accent-[#7170FF]"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={
                  isGenerating || (!prompt.trim() && !uploadedFile && !attachedUrl)
                }
                className="gs-btn-primary ml-auto h-9"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isGenerating ? "hourglass_empty" : "auto_awesome"}
                </span>
                {isGenerating ? "Creating…" : "Generate plan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        size="lg"
        backdrop="blur"
        classNames={{
          base: "bg-gs-surface-2 border border-gs-border rounded-xl text-gs-text",
        }}
      >
        <ModalContent>
          <ModalHeader className="font-semibold text-base">Upload reference</ModalHeader>
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
              className="rounded-md bg-gs-surface text-gs-text"
              onPress={() => setShowUploadModal(false)}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        size="md"
        backdrop="blur"
        classNames={{
          base: "bg-gs-surface-2 border border-gs-border rounded-xl text-gs-text",
        }}
      >
        <ModalContent>
          <ModalHeader className="font-semibold text-base">Attach web URL</ModalHeader>
          <ModalBody className="py-4 space-y-3">
            <p className="text-xs text-gs-secondary">
              GenStack will ingest the page for RAG during planning and slide generation.
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
                  "border-gs-border hover:border-gs-border-strong focus-within:!border-gs-accent rounded-md bg-gs-bg",
                input: "text-gs-text",
                label: "text-gs-secondary",
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              className="rounded-md bg-gs-surface text-gs-text"
              onPress={() => setShowUrlModal(false)}
            >
              Cancel
            </Button>
            <Button className="rounded-md bg-gs-accent text-white" onPress={handleAttachUrl}>
              Attach URL
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AppShell>
  );
}
