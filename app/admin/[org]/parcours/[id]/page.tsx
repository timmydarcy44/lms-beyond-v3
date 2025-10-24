'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Users, BookOpen, AlertCircle } from 'lucide-react';
import { usePathway, useUpdatePathway, useUpdatePathwayItems, useUpdatePathwayAssignments } from '@/hooks/usePathways';
import { useFormationsList, useResourcesList, useTestsList, useLearnersList, useGroupsList } from '@/hooks/useLists';
import { useToast } from '@/components/toast';
import Modal from '@/components/modal';
import MultiSelect, { MultiSelectOption } from '@/components/multiselect';
import ItemPill from '@/components/item-pill';
import SortableList from '@/components/sortable-list';
import { pathwayMetaInputClient, pathwayItemsInputClient, pathwayAssignmentsInputClient } from '@/lib/validation/pathways.client';

interface PathwayEditPageProps {
  orgSlug: string;
  pathwayId: string;
}

type TabType = 'formations' | 'tests' | 'resources';

export default function PathwayEditPage({ orgSlug, pathwayId }: PathwayEditPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cover_url: '',
    reading_mode: 'linear' as 'linear' | 'free',
  });
  const [items, setItems] = useState<Array<{
    id: string;
    type: 'formation' | 'test' | 'resource';
    title: string;
    position: number;
  }>>([]);
  const [assignments, setAssignments] = useState({
    learners: [] as string[],
    groups: [] as string[],
  });
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('formations');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: pathwayResponse, isLoading, error } = usePathway(pathwayId);
  const updatePathway = useUpdatePathway();
  const updateItems = useUpdatePathwayItems(pathwayId);
  const updateAssignments = useUpdatePathwayAssignments(pathwayId);
  const { success, error: showError } = useToast();

  // Charger les listes pour les modals
  const { data: formationsResponse } = useFormationsList(orgSlug);
  const { data: resourcesResponse } = useResourcesList(orgSlug);
  const { data: testsResponse } = useTestsList(orgSlug);
  const { data: learnersResponse } = useLearnersList(orgSlug);
  const { data: groupsResponse } = useGroupsList(orgSlug);

  const pathway = pathwayResponse?.data;

  // Initialiser les données du formulaire
  useEffect(() => {
    if (pathway) {
      setFormData({
        title: pathway.title,
        description: pathway.description || '',
        cover_url: pathway.cover_url || '',
        reading_mode: pathway.reading_mode,
      });

      // Convertir les items du parcours
      const pathwayItems = pathway.pathway_items?.map((item, index) => ({
        id: item.item_id,
        type: item.item_type,
        title: `Item ${item.item_id}`, // TODO: Récupérer le vrai titre
        position: index,
      })) || [];
      setItems(pathwayItems);

      // Convertir les assignations
      const learners = pathway.pathway_assignments?.filter(a => a.learner_id).map(a => a.learner_id!) || [];
      const groups = pathway.pathway_assignments?.filter(a => a.group_id).map(a => a.group_id!) || [];
      setAssignments({ learners, groups });
    }
  }, [pathway]);

  const handleSaveMeta = async () => {
    const validation = pathwayMetaInputClient.safeParse(formData);
    if (!validation.success) {
      showError('Erreur de validation', validation.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updatePathway.mutateAsync({
        id: pathwayId,
        input: validation.data,
      });

      if (result.ok) {
        success('Parcours sauvegardé', 'Les informations du parcours ont été mises à jour');
      } else {
        showError('Erreur', result.error || 'Impossible de sauvegarder le parcours');
      }
    } catch (err) {
      showError('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveItems = async () => {
    const validation = pathwayItemsInputClient.safeParse(items);
    if (!validation.success) {
      showError('Erreur de validation', validation.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateItems.mutateAsync({
        items: validation.data.map((item, index) => ({
          type: item.type,
          id: item.id,
          position: index,
        })),
      });

      if (result.ok) {
        success('Ordre sauvegardé', 'L\'ordre des éléments a été mis à jour');
      } else {
        showError('Erreur', result.error || 'Impossible de sauvegarder l\'ordre');
      }
    } catch (err) {
      showError('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAssignments = async () => {
    const validation = pathwayAssignmentsInputClient.safeParse(assignments);
    if (!validation.success) {
      showError('Erreur de validation', validation.error.issues[0].message);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateAssignments.mutateAsync(validation.data);

      if (result.ok) {
        success('Assignations sauvegardées', 'Les assignations ont été mises à jour');
      } else {
        showError('Erreur', result.error || 'Impossible de sauvegarder les assignations');
      }
    } catch (err) {
      showError('Erreur', 'Une erreur inattendue s\'est produite');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItems = () => {
    const newItems = [...items];
    let nextPosition = items.length;

    selectedItems.forEach(itemId => {
      const existingItem = newItems.find(item => item.id === itemId);
      if (!existingItem) {
        newItems.push({
          id: itemId,
          type: activeTab.slice(0, -1) as 'formation' | 'test' | 'resource',
          title: `Item ${itemId}`, // TODO: Récupérer le vrai titre
          position: nextPosition++,
        });
      }
    });

    setItems(newItems);
    setSelectedItems([]);
    setIsAddItemModalOpen(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleReorderItems = (newItems: typeof items) => {
    setItems(newItems.map((item, index) => ({ ...item, position: index })));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-64 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-32 bg-white/5 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !pathway) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
        <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
        <p className="text-red-300">Erreur lors du chargement du parcours</p>
        <p className="text-sm text-red-400 mt-1">{error?.message}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  const formations = formationsResponse?.data || [];
  const resources = resourcesResponse?.data || [];
  const tests = testsResponse?.data || [];
  const learners = learnersResponse?.data || [];
  const groups = groupsResponse?.data || [];

  const formationsOptions: MultiSelectOption[] = formations.map((f: any) => ({ id: f.id, label: f.title }));
  const resourcesOptions: MultiSelectOption[] = resources.map((r: any) => ({ id: r.id, label: r.title }));
  const testsOptions: MultiSelectOption[] = tests.map((t: any) => ({ id: t.id, label: t.title }));
  const learnersOptions: MultiSelectOption[] = learners.map((l: any) => ({ id: l.id, label: l.email }));
  const groupsOptions: MultiSelectOption[] = groups.map((g: any) => ({ id: g.id, label: g.name }));

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-neutral-400 hover:text-white transition-colors mb-4"
        >
          ← Retour aux parcours
        </button>
        <h2 className="text-xl font-semibold">Édition du parcours</h2>
      </div>

      <div className="space-y-8">
        {/* Informations générales */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BookOpen size={20} />
            Informations générales
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Titre
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="reading_mode" className="block text-sm font-medium mb-2">
                Mode de lecture
              </label>
              <select
                id="reading_mode"
                value={formData.reading_mode}
                onChange={(e) => setFormData(prev => ({ ...prev, reading_mode: e.target.value as 'linear' | 'free' }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="linear">Linéaire</option>
                <option value="free">Libre</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="cover_url" className="block text-sm font-medium mb-2">
              URL de l'image de couverture
            </label>
            <input
              id="cover_url"
              type="url"
              value={formData.cover_url}
              onChange={(e) => setFormData(prev => ({ ...prev, cover_url: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveMeta}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Éléments du parcours */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <BookOpen size={20} />
              Éléments du parcours
            </h3>
            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Plus size={16} />
              Ajouter
            </button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/10 p-8 text-center">
              <BookOpen size={48} className="mx-auto text-neutral-400 mb-4" />
              <p className="text-neutral-400 mb-4">Aucun élément dans ce parcours</p>
              <button
                onClick={() => setIsAddItemModalOpen(true)}
                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Ajouter des éléments
              </button>
            </div>
          ) : (
            <>
              <SortableList
                items={items}
                onReorder={handleReorderItems}
                renderItem={(item) => (
                  <ItemPill
                    id={item.id}
                    type={item.type}
                    title={item.title}
                    onRemove={() => handleRemoveItem(item.id)}
                  />
                )}
                disabled={isSaving}
              />
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveItems}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder l\'ordre'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Assignations */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Users size={20} />
            Assignations
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Apprenants
              </label>
              <MultiSelect
                options={learnersOptions}
                selected={assignments.learners}
                onChange={(selected) => setAssignments(prev => ({ ...prev, learners: selected }))}
                placeholder="Sélectionner des apprenants..."
                searchPlaceholder="Rechercher un apprenant..."
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Groupes
              </label>
              <MultiSelect
                options={groupsOptions}
                selected={assignments.groups}
                onChange={(selected) => setAssignments(prev => ({ ...prev, groups: selected }))}
                placeholder="Sélectionner des groupes..."
                searchPlaceholder="Rechercher un groupe..."
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveAssignments}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder les assignations'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'éléments */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Ajouter des éléments"
        size="lg"
      >
        <div className="space-y-4">
          {/* Onglets */}
          <div className="flex border-b border-white/10">
            {(['formations', 'tests', 'resources'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-300'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                {tab === 'formations' ? 'Formations' : tab === 'tests' ? 'Tests' : 'Ressources'}
              </button>
            ))}
          </div>

          {/* Liste des éléments */}
          <div className="max-h-64 overflow-y-auto">
            {activeTab === 'formations' && (
              <div className="space-y-2">
                {formationsOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(option.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, option.id]);
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== option.id));
                        }
                      }}
                      className="rounded border-white/20"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            )}

            {activeTab === 'tests' && (
              <div className="space-y-2">
                {testsOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(option.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, option.id]);
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== option.id));
                        }
                      }}
                      className="rounded border-white/20"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-2">
                {resourcesOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(option.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, option.id]);
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== option.id));
                        }
                      }}
                      className="rounded border-white/20"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setIsAddItemModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm hover:bg-white/10 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAddItems}
              disabled={selectedItems.length === 0}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajouter ({selectedItems.length})
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
