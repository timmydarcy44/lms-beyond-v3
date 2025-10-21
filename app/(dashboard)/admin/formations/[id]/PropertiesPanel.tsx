'use client';
import { useState, useTransition } from 'react';
import { Settings, Eye, EyeOff, BookOpen, Lock, Globe, Users, GraduationCap, Route } from 'lucide-react';
import { updateFormationReadingMode } from './actions';
import AssignmentModal from '@/components/admin/AssignmentModal';

type Formation = { 
  id: string; 
  org_id: string; 
  title: string; 
  reading_mode: 'free' | 'linear'; 
  visibility_mode: 'private' | 'catalog_only' | 'public'; 
  published: boolean 
};

interface PropertiesPanelProps {
  formation: Formation;
}

export default function PropertiesPanel({ formation }: PropertiesPanelProps) {
  const [readingMode, setReadingMode] = useState(formation.reading_mode);
  const [visibilityMode, setVisibilityMode] = useState(formation.visibility_mode);
  const [published, setPublished] = useState(formation.published);
  const [pending, startTransition] = useTransition();
  const [showAssignmentModal, setShowAssignmentModal] = useState<{
    type: 'learner' | 'group' | 'pathway';
    isOpen: boolean;
  }>({ type: 'learner', isOpen: false });

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateFormationReadingMode(formation.id, readingMode);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    });
  };

  const handleAssign = async (targetType: string, targetId: string) => {
    // TODO: Implémenter l'assignation
    console.log('Assigning', targetType, targetId, 'to formation', formation.id);
  };

  const hasChanges = 
    readingMode !== formation.reading_mode ||
    visibilityMode !== formation.visibility_mode ||
    published !== formation.published;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-iris-400" />
        <h3 className="text-lg font-semibold text-iris-grad">Propriétés</h3>
      </div>

      <div className="space-y-6">
        {/* Mode de lecture */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            <BookOpen className="h-4 w-4 inline mr-2" />
            Mode de lecture
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="reading_mode"
                value="free"
                checked={readingMode === 'free'}
                onChange={(e) => setReadingMode(e.target.value as 'free' | 'linear')}
                className="text-iris-500 focus:ring-iris-500"
              />
              <span className="text-white">Libre</span>
              <span className="text-xs text-white/50">(Navigation libre)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="reading_mode"
                value="linear"
                checked={readingMode === 'linear'}
                onChange={(e) => setReadingMode(e.target.value as 'free' | 'linear')}
                className="text-iris-500 focus:ring-iris-500"
              />
              <span className="text-white">Linéaire</span>
              <span className="text-xs text-white/50">(Séquence obligatoire)</span>
            </label>
          </div>
        </div>

        {/* Visibilité */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            <Eye className="h-4 w-4 inline mr-2" />
            Visibilité
          </label>
          <select
            value={visibilityMode}
            onChange={(e) => setVisibilityMode(e.target.value as 'private' | 'catalog_only' | 'public')}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-iris-500/50"
          >
            <option value="private">
              <Lock className="h-4 w-4 inline mr-2" />
              Privée
            </option>
            <option value="catalog_only">Catalogue uniquement</option>
            <option value="public">
              <Globe className="h-4 w-4 inline mr-2" />
              Publique
            </option>
          </select>
          <div className="text-xs text-white/50 mt-1">
            {visibilityMode === 'private' && 'Visible uniquement par les membres de l\'organisation'}
            {visibilityMode === 'catalog_only' && 'Visible dans le catalogue mais nécessite une inscription'}
            {visibilityMode === 'public' && 'Visible et accessible à tous'}
          </div>
        </div>

        {/* Statut de publication */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-iris-500 bg-white/5 border-white/10 rounded focus:ring-iris-500 focus:ring-2"
            />
            <div>
              <div className="text-white font-medium">
                {published ? (
                  <>
                    <Eye className="h-4 w-4 inline mr-2" />
                    Publiée
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 inline mr-2" />
                    Brouillon
                  </>
                )}
              </div>
              <div className="text-xs text-white/50">
                {published ? 'La formation est visible et accessible' : 'La formation est en cours de création'}
              </div>
            </div>
          </label>
        </div>

        {/* Section Assignations */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Assignations
          </label>
          <div className="space-y-3">
            <button
              onClick={() => setShowAssignmentModal({ type: 'learner', isOpen: true })}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200 font-medium"
            >
              <Users size={18} />
              Assigner à des apprenants
            </button>
            
            <button
              onClick={() => setShowAssignmentModal({ type: 'group', isOpen: true })}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 font-medium"
            >
              <GraduationCap size={18} />
              Assigner à des groupes
            </button>
            
            <button
              onClick={() => setShowAssignmentModal({ type: 'pathway', isOpen: true })}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 font-medium"
            >
              <Route size={18} />
              Assigner à des parcours
            </button>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={pending}
            className="w-full btn-cta-lg"
          >
            {pending ? 'Enregistrement…' : 'Enregistrer les propriétés'}
          </button>
        )}

        {pending && (
          <div className="text-xs text-white/50 text-center">Mise à jour en cours…</div>
        )}
      </div>

      {/* Modal d'assignation */}
      <AssignmentModal
        isOpen={showAssignmentModal.isOpen}
        onClose={() => setShowAssignmentModal({ type: 'learner', isOpen: false })}
        type={showAssignmentModal.type}
        formationId={formation.id}
        orgId={formation.org_id}
        onAssign={handleAssign}
      />
    </div>
  );
}
