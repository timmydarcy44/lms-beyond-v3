"use client";
import { useState } from "react";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CoverUploadProps {
  courseId: string;
  currentCoverUrl?: string;
  onUploadComplete: (url: string) => void;
}

export function CoverUpload({ courseId, currentCoverUrl, onUploadComplete }: CoverUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentCoverUrl || null);

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      alert('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${courseId}.${fileExt}`;
      const filePath = `courses/${courseId}/${fileName}`;

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Erreur lors de l\'upload');
        return;
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Mettre à jour la base de données
      const { error: dbError } = await supabase
        .from('formations')
        .update({ cover_url: publicUrl })
        .eq('id', courseId);

      if (dbError) {
        console.error('Database error:', dbError);
        alert('Erreur lors de la sauvegarde');
        return;
      }

      setPreview(publicUrl);
      onUploadComplete(publicUrl);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }

  function removeCover() {
    setPreview(null);
    onUploadComplete('');
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative group">
          <img 
            src={preview} 
            alt="Cover preview" 
            className="w-full h-48 object-cover rounded-xl"
          />
          <button
            onClick={removeCover}
            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/40 transition-colors">
          <Upload size={32} className="mx-auto mb-4 text-white/40" />
          <p className="text-white/60 mb-4">Ajouter une image de couverture</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="cover-upload"
          />
          <label
            htmlFor="cover-upload"
            className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              uploading 
                ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                : 'bg-[#5B7CFF]/20 hover:bg-[#5B7CFF]/30 text-[#5B7CFF]'
            }`}
          >
            {uploading ? 'Upload en cours...' : 'Sélectionner une image'}
          </label>
        </div>
      )}
    </div>
  );
}
