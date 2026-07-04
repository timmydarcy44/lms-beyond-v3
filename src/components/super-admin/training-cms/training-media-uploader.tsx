"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  courseId: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  kind?: "cover" | "instructor" | "illustration";
  className?: string;
};

export function TrainingMediaUploader({
  courseId,
  value,
  onChange,
  label = "Média",
  kind = "cover",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("courseId", courseId);
      fd.append("kind", kind);
      const res = await fetch("/api/super/training-courses/media", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload échoué");
      onChange(json.url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload échoué");
    } finally {
      setUploading(false);
      setDragOver(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <span className="block text-sm font-medium text-gray-700">{label}</span>
      {value ? (
        <div className="relative aspect-[16/9] max-h-40 overflow-hidden rounded-xl border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition",
          dragOver ? "border-[#635BFF] bg-[#635BFF]/5" : "border-gray-200 bg-gray-50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) void upload(file);
        }}
      >
        <p className="text-sm text-gray-600">Glissez une image ou</p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-lg bg-[#635BFF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7B74FF] disabled:opacity-50"
        >
          {uploading ? "Upload…" : "Uploader"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>
    </div>
  );
}
