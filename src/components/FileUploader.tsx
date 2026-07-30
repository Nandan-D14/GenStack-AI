"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Card, CardBody, Chip, Progress } from "@heroui/react";
import { Upload, X, FileText, Image, File, CheckCircle2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "complete" | "error";
  url?: string;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type === "application/pdf" || type.includes("document")) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileUploaderProps {
  onFileUploaded?: (fileUrl: string, fileName: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function FileUploader({
  onFileUploaded,
  accept = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.svg",
  maxSizeMB = 10,
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const saveFile = useMutation(api.media.saveFile);

  const uploadFile = useCallback(
    async (file: globalThis.File) => {
      const fileId = `${Date.now()}-${file.name}`;
      const entry: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: "uploading",
      };

      setFiles((prev) => [...prev, entry]);

      try {
        // 1. Get upload URL from Convex
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: 20 } : f))
        );
        const uploadUrl = await generateUploadUrl();

        // 2. Upload file to Convex storage
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: 50 } : f))
        );
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error(`Upload failed with status ${result.status}`);
        }

        const { storageId } = await result.json();

        // 3. Save metadata to the database
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: 80 } : f))
        );
        await saveFile({
          storageId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, progress: 100, status: "complete" }
              : f
          )
        );

        onFileUploaded?.(storageId, file.name);
      } catch (error) {
        console.error("Upload error:", error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: "error" } : f
          )
        );
      }
    },
    [generateUploadUrl, saveFile, onFileUploaded]
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      Array.from(fileList).forEach((file) => {
        if (file.size > maxSizeMB * 1024 * 1024) {
          alert(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
          return;
        }
        uploadFile(file);
      });
    },
    [uploadFile, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-default-200 hover:border-primary/50 hover:bg-content2/30"
        }`}
      >
        <Upload
          className={`w-10 h-10 mx-auto mb-4 transition-colors ${
            isDragOver ? "text-primary" : "text-default-400"
          }`}
        />
        <p className="text-foreground font-medium mb-1">
          {isDragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-default-500 mb-4">
          or click to browse • Max {maxSizeMB}MB per file
        </p>
        <Button
          size="sm"
          color="primary"
          variant="flat"
          startContent={<Upload className="w-4 h-4" />}
          onPress={() => inputRef.current?.click()}
        >
          Choose Files
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            return (
              <Card
                key={file.id}
                className="bg-content2/50 border border-default"
              >
                <CardBody className="p-3 flex flex-row items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      file.status === "complete"
                        ? "bg-success/20"
                        : file.status === "error"
                        ? "bg-danger/20"
                        : "bg-primary/20"
                    }`}
                  >
                    {file.status === "complete" ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${
                          file.status === "error"
                            ? "text-danger"
                            : "text-primary"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-default-500">
                        {formatFileSize(file.size)}
                      </span>
                      {file.status === "uploading" && (
                        <Progress
                          value={file.progress}
                          size="sm"
                          color="primary"
                          className="max-w-[120px]"
                        />
                      )}
                      {file.status === "complete" && (
                        <Chip size="sm" color="success" variant="flat">
                          Uploaded
                        </Chip>
                      )}
                      {file.status === "error" && (
                        <Chip size="sm" color="danger" variant="flat">
                          Failed
                        </Chip>
                      )}
                    </div>
                  </div>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => removeFile(file.id)}
                  >
                    <X className="w-4 h-4 text-default-400" />
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
