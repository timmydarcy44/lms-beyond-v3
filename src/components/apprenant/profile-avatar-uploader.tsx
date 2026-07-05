"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_OUTPUT = 512;

type Props = {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  className?: string;
};

async function cropSquareToBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - size) / 2;
  const sy = (bitmap.height - size) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = MAX_OUTPUT;
  canvas.height = MAX_OUTPUT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, MAX_OUTPUT, MAX_OUTPUT);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Compression impossible"))),
      "image/jpeg",
      0.88,
    );
  });
}

export function ProfileAvatarUploader({ currentUrl, onUploaded, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Choisissez une image (JPG, PNG, WebP).");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const blob = await cropSquareToBlob(file);
        const cropped = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        const formData = new FormData();
        formData.append("file", cropped);
        const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) throw new Error(data.error ?? "Upload impossible");
        setPreview(data.url);
        onUploaded(data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors du téléversement");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition",
          dragging
            ? "border-[#3D7BFF]/60 bg-[#3D7BFF]/10"
            : "border-white/15 bg-white/[0.03] hover:border-[#3D7BFF]/35 hover:bg-white/[0.05]",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
        {preview ? (
          <img
            src={preview}
            alt="Photo de profil"
            className="mb-4 h-24 w-24 rounded-2xl object-cover ring-2 ring-white/10"
          />
        ) : (
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10">
            <Camera className="h-8 w-8 text-white/40" />
          </div>
        )}
        <p className="text-sm font-medium text-white">Téléverser une photo</p>
        <p className="mt-1 text-xs text-white/45">Glisser-déposer ou cliquer · recadrage carré automatique</p>
        {uploading ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-white/50">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Téléversement…
          </p>
        ) : (
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#3D7BFF]">
            <Upload className="h-3.5 w-3.5" />
            Sélectionner un fichier
          </span>
        )}
      </div>
      {error ? <p className="text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
