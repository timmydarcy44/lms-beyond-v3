'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, BookOpen } from 'lucide-react';
import { usePathways, useCreatePathway, useDeletePathway } from '@/hooks/usePathways';
import { useToast } from '@/components/toast';
import Modal from '@/components/modal';

interface ParcoursListPageProps {
  orgSlug: string;
}

export default function ParcoursListPage({ orgSlug }: ParcoursListPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPathwayTitle, setNewPathwayTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { data: pathwaysResponse, isLoading, error } = usePathways(orgSlug);
  const createPathway = useCreatePathway(orgSlug);
  const deletePathway = useDeletePathway(orgSlug);
  const { success, error: showError } = useToast();

  const pathways = pathwaysResponse?.data || [];

  const handleCreatePathway = async () => {
    if (!newPathwayTitle.trim()) return;

    setIsCreating(true);
    try {
      const result = await createPathway.mutateAsync({
        title: newPathwayTitle.trim(),
        reading_mode: 'linear',
      });

      if (result.ok) {
        success('Parcours créé', 'Le parcours a été créé avec succès');
        setIsCreateModalOpen(false);
        setNewPathwayTitle('');
      } else {
        showError('Erreur', result.error || 'Impossible de créer le parcours');
      }
    } catch (err) {
      showError('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePathway = async (id: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le parcours "${title}" ?`)) {
      return;
    }

    try {
      const result = await deletePathway.mutateAsync(id);
      if (result.ok) {
        success('Parcours supprimé', 'Le parcours a été supprimé avec succès');
      } else {
        showError('Erreur', result.error || 'Impossible de supprimer le parcours');
      }
    } catch (err) {
      showError('Erreur', 'Une erreur inattendue s\'est produite');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
        <p className="text-red-300">Erreur lors du chargement des parcours</p>
        <p className="text-sm text-red-400 mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Parcours</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Gérez les parcours d'apprentissage de votre organisation
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
          Nouveau parcours
        </button>
      </div>

      {pathways.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
          <BookOpen size={48} className="mx-auto text-neutral-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun parcours</h3>
          <p className="text-neutral-400 mb-4">
            Créez votre premier parcours d'apprentissage pour commencer.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Créer un parcours
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pathways.map((pathway) => (
            <div
              key={pathway.id}
              className="group rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium line-clamp-2">{pathway.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <Calendar size={12} />
                    {new Date(pathway.updated_at).toLocaleDateString()}
                  </div>
                </div>
                
                {pathway.description && (
                  <p className="text-sm text-neutral-400 line-clamp-2 mb-3">
                    {pathway.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-md bg-white/10">
                      {pathway.reading_mode === 'linear' ? 'Linéaire' : 'Libre'}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {pathway.pathway_items?.length || 0} élément{(pathway.pathway_items?.length || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/admin/${orgSlug}/parcours/${pathway.id}`}
                      className="rounded-md px-2 py-1 text-xs hover:bg-white/10 transition-colors"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDeletePathway(pathway.id, pathway.title)}
                      className="rounded-md px-2 py-1 text-xs hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouveau parcours"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Titre du parcours
            </label>
            <input
              id="title"
              type="text"
              value={newPathwayTitle}
              onChange={(e) => setNewPathwayTitle(e.target.value)}
              placeholder="Ex: Formation complète React"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm hover:bg-white/10 transition-colors"
              disabled={isCreating}
            >
              Annuler
            </button>
            <button
              onClick={handleCreatePathway}
              disabled={!newPathwayTitle.trim() || isCreating}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}