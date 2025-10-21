// app/(dashboard)/admin/parcours/new/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function NewParcoursPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cover_url: '',
    published: false,
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverPreview = () => {
    setCoverPreview(null);
    setFormData(prev => ({ ...prev, cover_url: '' }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/pathways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { pathway } = await response.json();
        router.push(`/admin/parcours/${pathway.id}`);
      } else {
        const error = await response.json();
        console.error('Error creating pathway:', error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#252525] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/parcours"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Retour aux parcours
          </Link>
          
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Créer un nouveau parcours
          </h1>
          <p className="text-neutral-400">
            Concevez un parcours d'apprentissage structuré avec des étapes claires
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="max-w-4xl mx-auto space-y-8">
          {/* Informations de base */}
          <div className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Informations de base
            </h2>
            
            <div className="space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Titre du parcours *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="Ex: Formation Commerciale Complète"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                  placeholder="Décrivez les objectifs et le contenu de ce parcours..."
                />
              </div>
            </div>
          </div>

          {/* Image de couverture */}
          <div className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Image de couverture
            </h2>
            
            <div className="space-y-4">
              {/* Upload de fichier */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Upload d'image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-center">
                      <Upload size={24} className="mx-auto text-neutral-400 mb-2" />
                      <p className="text-sm text-neutral-400">Cliquez pour uploader</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL alternative */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Ou URL d'image
                </label>
                <input
                  type="url"
                  value={formData.cover_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_url: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  placeholder="https://exemple.com/image.jpg"
                />
              </div>

              {/* Aperçu */}
              {(coverPreview || formData.cover_url) && (
                <div className="relative">
                  <img
                    src={coverPreview || formData.cover_url}
                    alt="Aperçu de couverture"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={removeCoverPreview}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Paramètres avancés */}
          <div className="glass rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Paramètres
            </h2>
            
            <div className="space-y-4">
              {/* Publication */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <h3 className="font-medium text-white">Publier immédiatement</h3>
                  <p className="text-sm text-neutral-400">Le parcours sera visible par les apprenants</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link
              href="/admin/parcours"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-center"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-neutral-500 disabled:to-neutral-500 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Création...' : 'Créer le parcours'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
