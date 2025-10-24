'use client';

import { useState, useEffect } from 'react';
import { X, Settings, Users, User } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { assignContentAction, updateFormationReadingMode } from '@/app/admin/[org]/formations/[id]/actions';

interface PropertiesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  orgId: string;
  chapterId?: string;
  subchapterId?: string;
  readingMode: 'free' | 'linear';
  published: boolean;
}

interface Group {
  id: string;
  name: string;
}

interface Learner {
  id: string;
  email: string;
  full_name: string | null;
}

export default function PropertiesSheet({
  isOpen,
  onClose,
  formationId,
  orgId,
  chapterId,
  subchapterId,
  readingMode,
  published
}: PropertiesSheetProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedLearner, setSelectedLearner] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGroupsAndLearners();
    }
  }, [isOpen, orgId]);

  const loadGroupsAndLearners = async () => {
    const sb = supabaseBrowser();
    
    try {
      // Charger les groupes
      const { data: groupsData } = await sb
        .from('groups')
        .select('id, name')
        .eq('org_id', orgId);
      
      setGroups(groupsData || []);

      // Charger les apprenants
      const { data: learnersData } = await sb
        .from('org_memberships')
        .select(`
          profiles!inner(id, email, full_name)
        `)
        .eq('org_id', orgId)
        .eq('role', 'learner');

      const learners = learnersData?.map((item: any) => ({
        id: item.profiles.id,
        email: item.profiles.email,
        full_name: item.profiles.full_name
      })) || [];

      setLearners(learners);
    } catch (error) {
      console.error('Error loading groups and learners:', error);
    }
  };

  const handleReadingModeChange = async (mode: 'free' | 'linear') => {
    setIsLoading(true);
    try {
      await updateFormationReadingMode(formationId, mode);
      // Optionnel: recharger la page ou mettre à jour l'état parent
    } catch (error) {
      console.error('Error updating reading mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToGroup = async () => {
    if (!selectedGroup) return;
    
    setIsLoading(true);
    try {
      await assignContentAction(
        formationId,
        'formation',
        'group',
        selectedGroup
      );
      alert('Contenu assigné au groupe avec succès !');
      setSelectedGroup('');
    } catch (error) {
      console.error('Error assigning to group:', error);
      alert('Erreur lors de l\'assignation au groupe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToLearner = async () => {
    if (!selectedLearner) return;
    
    setIsLoading(true);
    try {
      await assignContentAction(
        formationId,
        'formation',
        'learner',
        selectedLearner
      );
      alert('Contenu assigné à l\'apprenant avec succès !');
      setSelectedLearner('');
    } catch (error) {
      console.error('Error assigning to learner:', error);
      alert('Erreur lors de l\'assignation à l\'apprenant');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-[#252525] border-l border-white/10 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-iris-400" />
              <h2 className="text-lg font-semibold text-white">Propriétés</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Mode de lecture */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Mode de lecture</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="readingMode"
                    value="free"
                    checked={readingMode === 'free'}
                    onChange={() => handleReadingModeChange('free')}
                    className="w-4 h-4 text-iris-500 bg-white/5 border-white/10 rounded focus:ring-iris-500/50"
                  />
                  <span className="text-sm text-white/80">Libre (navigation libre)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="readingMode"
                    value="linear"
                    checked={readingMode === 'linear'}
                    onChange={() => handleReadingModeChange('linear')}
                    className="w-4 h-4 text-iris-500 bg-white/5 border-white/10 rounded focus:ring-iris-500/50"
                  />
                  <span className="text-sm text-white/80">Linéaire (ordre imposé)</span>
                </label>
              </div>
            </div>

            {/* Assignations */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Assignations</h3>
              
              {/* Assigner à un groupe */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-white/70" />
                  <span className="text-sm text-white/80">Assigner au groupe</span>
                </div>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-iris-500/50"
                >
                  <option value="">Sélectionner un groupe</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssignToGroup}
                  disabled={!selectedGroup || isLoading}
                  className="w-full px-3 py-2 bg-iris-500/20 text-iris-400 text-sm rounded-lg hover:bg-iris-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Assigner au groupe
                </button>
              </div>

              {/* Assigner à un apprenant */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-white/70" />
                  <span className="text-sm text-white/80">Assigner à l'apprenant</span>
                </div>
                <select
                  value={selectedLearner}
                  onChange={(e) => setSelectedLearner(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-iris-500/50"
                >
                  <option value="">Sélectionner un apprenant</option>
                  {learners.map(learner => (
                    <option key={learner.id} value={learner.id}>
                      {learner.full_name || learner.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignToLearner}
                  disabled={!selectedLearner || isLoading}
                  className="w-full px-3 py-2 bg-blush-500/20 text-blush-400 text-sm rounded-lg hover:bg-blush-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Assigner à l'apprenant
                </button>
              </div>
            </div>

            {/* Métadonnées */}
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Métadonnées</h3>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <span className="w-20">Statut:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {published ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20">Mode:</span>
                  <span className="text-white/80">{readingMode === 'free' ? 'Libre' : 'Linéaire'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}