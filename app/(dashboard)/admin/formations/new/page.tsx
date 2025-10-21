'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createFormationAction } from './actions';
import { Upload, Image, Eye, EyeOff, X } from 'lucide-react';

const themes = [
  { id: 'business', label: 'Business', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-500/20' },
  { id: 'marketing', label: 'Marketing', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-500/20' },
  { id: 'negociation', label: 'Négociation', color: 'from-green-500 to-green-600', bgColor: 'bg-green-500/20' },
  { id: 'management', label: 'Management', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-500/20' },
  { id: 'rh', label: 'RH', color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-500/20' },
  { id: 'vente', label: 'Vente', color: 'from-red-500 to-red-600', bgColor: 'bg-red-500/20' },
  { id: 'iris', label: 'Iris', color: 'from-indigo-500 to-purple-500', bgColor: 'bg-indigo-500/20' },
  { id: 'blush', label: 'Blush', color: 'from-rose-500 to-pink-500', bgColor: 'bg-rose-500/20' },
];

export default function NewFormationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get('org');
  
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); 
    setErr(null); 
    setLoading(true);
    
    try { 
      const formData = new FormData(e.currentTarget);
      formData.set('theme', selectedTheme);
      
      // Upload de l'image si présente
      if (coverFile) {
        const uploadResult = await uploadCoverImage(coverFile);
        if (uploadResult.ok) {
          formData.set('cover_url', uploadResult.url);
        }
      }
      
      const result = await createFormationAction(formData, orgSlug || undefined);
      if (result.ok) {
        // Rediriger vers la page de l'organisation si spécifiée
        const redirectUrl = orgSlug ? `/admin/${orgSlug}/formations/${result.formation.id}` : `/admin/formations/${result.formation.id}`;
        router.push(redirectUrl);
      } else {
        setErr('Erreur lors de la création');
        setLoading(false);
      }
    }
    catch (e: any) { 
      setErr(e?.message || 'Erreur inconnue'); 
      setLoading(false); 
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction d'upload d'image
  async function uploadCoverImage(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'lms-assets');
      
      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (result.ok) {
        return { ok: true, url: result.publicUrl };
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Créer une nouvelle formation
          </h1>
          <p className="text-neutral-400">Concevez votre formation avec un design moderne et professionnel</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Section principale */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Informations générales</h2>
            
            <div className="space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Titre de la formation *
                </label>
                <input 
                  name="title" 
                  placeholder="Ex: Formation en Management d'Équipe" 
                  required 
                  className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" 
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Description
                </label>
                <textarea 
                  name="description" 
                  rows={4} 
                  placeholder="Décrivez le contenu et les objectifs de votre formation..." 
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none" 
                />
              </div>

              {/* Photo de couverture */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Photo de couverture
                </label>
                
                {coverPreview ? (
                  <div className="relative">
                    <img 
                      src={coverPreview} 
                      alt="Aperçu" 
                      className="w-full h-48 object-cover rounded-xl border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverPreview('')}
                      className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/30 transition-colors">
                    <Upload size={32} className="mx-auto text-neutral-400 mb-3" />
                    <p className="text-neutral-400 mb-4">Glissez-déposez une image ou cliquez pour sélectionner</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                      id="cover-upload"
                    />
                    <label
                      htmlFor="cover-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all cursor-pointer"
                    >
                      <Image size={16} />
                      Choisir une image
                    </label>
                  </div>
                )}
                
                {/* URL alternative */}
                <div className="mt-4">
                  <input 
                    name="cover_url" 
                    placeholder="Ou entrez une URL d'image..." 
                    className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section thèmes */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Thème de la formation</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedTheme === theme.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-full h-16 rounded-lg ${theme.bgColor} mb-3 flex items-center justify-center`}>
                    <span className="text-white font-semibold">{theme.label}</span>
                  </div>
                  <p className="text-sm text-neutral-300 text-center">{theme.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Section avancée */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Paramètres avancés</h2>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              >
                {showAdvanced ? <EyeOff size={20} /> : <Eye size={20} />}
                {showAdvanced ? 'Masquer' : 'Afficher'}
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Visibilité
                    </label>
                    <select name="visibility_mode" className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50">
                      <option value="private">Privée</option>
                      <option value="catalog_only">Catalogue uniquement</option>
                      <option value="public">Publique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Mode de lecture
                    </label>
                    <select name="reading_mode" className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50">
                      <option value="free">Libre</option>
                      <option value="linear">Linéaire</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    name="published" 
                    id="published"
                    className="w-4 h-4 text-blue-500 bg-white/5 border-white/10 rounded focus:ring-blue-500/50"
                  />
                  <label htmlFor="published" className="text-neutral-300">
                    Publier immédiatement la formation
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Erreur */}
          {err && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
              <p className="text-red-400 text-sm">{err}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-neutral-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              {loading ? 'Création en cours...' : 'Créer la formation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}