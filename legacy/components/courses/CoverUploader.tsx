"use client";
import { useRef, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";

export default function CoverUploader({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const sb = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: upErr } = await sb.storage.from("course-covers").upload(fileName, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = sb.storage.from("course-covers").getPublicUrl(fileName);
      if (data?.publicUrl) onChange(data.publicUrl);
    } catch (e: any) {
      console.error("Upload cover error:", e?.message || e);
      alert("Échec de l'upload de la couverture.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm">Couverture</span>
      {value && (
        <Image src={value} alt="Cover" width={400} height={200} className="rounded-xl object-cover" />
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition text-sm"
        >
          {uploading ? "Upload..." : value ? "Changer" : "Ajouter une couverture"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange(undefined)} className="text-xs text-white/60">
            Supprimer
          </button>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
        }}
      />
    </div>
  );
}




