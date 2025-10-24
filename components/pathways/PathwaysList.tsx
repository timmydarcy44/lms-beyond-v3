'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, BookOpen, Search } from 'lucide-react';
import { usePathways, useCreatePathway, useDeletePathway } from '@/hooks/usePathways';
import { useToast } from '@/components/toast';
import Modal from '@/components/modal';
import { Rail } from '@/components/cine/Rail';
import { CardPoster } from '@/components/cine/CardPoster';
import Button from '@/components/cine/Button';

interface PathwaysListProps {
  org: string;
}

export default function PathwaysList({ org }: PathwaysListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPathwayTitle, setNewPathwayTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: pathwaysResponse, isLoading, error } = usePathways(org);
  const createPathway = useCreatePathway(org);
  const deletePathway = useDeletePathway(org);
  const { success, error: showError } = useToast();

  const pathways = pathwaysResponse?.data || [];
  
  // Filtrer les parcours selon la recherche
  const filteredPathways = pathways.filter(pathway =>
    pathway.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Grouper par catégories pour les rails
  const recentPathways = filteredPathways
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  const allPathways = filteredPathways;

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

  const handlePathwayClick = (pathway: any) => {
    // Navigation vers l'édition du parcours
    window.location.href = `/admin/${org}/parcours/${pathway.id}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-surfaceAlt rounded-lg animate-pulse" />
        <div className="space-y-4">
          <div className="h-6 bg-surfaceAlt rounded animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-[220px] h-[320px] bg-surfaceAlt rounded-2xl animate-pulse" />
            ))}
          </div>
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
      {/* Header avec recherche */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Parcours</h2>
          <p className="text-muted mt-1">
            Gérez les parcours d'apprentissage de votre organisation
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
          <Plus size={16} className="mr-2" />
          Nouveau parcours
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher un parcours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surfaceAlt border border-border rounded-xl text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/70"
          />
        </div>
      </div>

      {filteredPathways.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <BookOpen size={48} className="mx-auto text-muted mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun parcours</h3>
          <p className="text-muted mb-4">
            {searchQuery ? 'Aucun parcours ne correspond à votre recherche.' : 'Créez votre premier parcours d\'apprentissage pour commencer.'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
              Créer un parcours
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Rail des parcours récents */}
          {recentPathways.length > 0 && (
            <Rail title="Récents">
              {recentPathways.map((pathway) => (
                <CardPoster
                  key={pathway.id}
                  title={pathway.title}
                  subtitle={`Mis à jour ${new Date(pathway.updated_at).toLocaleDateString()}`}
                  coverUrl={pathway.cover_url}
                  onClick={() => handlePathwayClick(pathway)}
                />
              ))}
            </Rail>
          )}

          {/* Rail de tous les parcours */}
          <Rail title="Tous les parcours">
            {allPathways.map((pathway) => (
              <CardPoster
                key={pathway.id}
                title={pathway.title}
                subtitle={`${pathway.pathway_items?.length || 0} éléments`}
                coverUrl={pathway.cover_url}
                onClick={() => handlePathwayClick(pathway)}
              />
            ))}
          </Rail>
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
              className="w-full rounded-lg border border-border bg-surfaceAlt px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/70"
              autoFocus
            />
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={() => setIsCreateModalOpen(false)}
              variant="ghost"
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreatePathway}
              disabled={!newPathwayTitle.trim() || isCreating}
              loading={isCreating}
              variant="primary"
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
