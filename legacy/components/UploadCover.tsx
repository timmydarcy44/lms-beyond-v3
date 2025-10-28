"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Upload, Image as ImageIcon } from "lucide-react";

export function UploadCover({ 
  formationId, 
  onUploaded 
}: { 
  formationId: string; 
  onUploaded: (url: string) => void 
}) {
  const [busy, setBusy] = useState(false);
  const supabase = createClientComponentClient();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${formationId}/${Date.now()}.${ext}`;
      
      // Upload vers Supabase Storage
      const { error: upErr } = await supabase.storage
        .from("covers")
        .upload(path, file, { 
          cacheControl: "3600", 
          upsert: true 
        });
        
      if (upErr) {
        console.error("Upload error:", upErr);
        setBusy(false);
        return;
      }
      
      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from("covers")
        .getPublicUrl(path);
      
      // Persister dans formations.cover_url
      const { error: updateErr } = await supabase
        .from("formations")
        .update({ cover_url: publicUrl })
        .eq("id", formationId);
        
      if (updateErr) {
        console.error("Update error:", updateErr);
        setBusy(false);
        return;
      }
      
      setBusy(false);
      onUploaded(publicUrl);
    } catch (error) {
      console.error("Error:", error);
      setBusy(false);
    }
  }

  return (
    <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors">
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={onFile}
        disabled={busy}
      />
      {busy ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Téléversement…
        </>
      ) : (
        <>
          <Upload className="w-4 h-4" />
          Uploader une cover
        </>
      )}
    </label>
  );
}



