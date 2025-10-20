'use client';

import { useState, useEffect } from 'react';
import { X, UserPlus, GraduationCap, FileText, ClipboardList, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Formation {
  id: string;
  title: string;
  cover_url?: string;
}

interface Pathway {
  id: string;
  title: string;
  cover_url?: string;
}

interface InviteLearnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: {
    email: string;
    formationIds: string[];
    testIds: string[];
    resourceIds: string[];
    pathwayIds: string[];
  }) => Promise<void>;
}

export default function InviteLearnerModal({ isOpen, onClose, onInvite }: InviteLearnerModalProps) {
  const [email, setEmail] = useState('');
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [selectedPathways, setSelectedPathways] = useState<string[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les formations et parcours au montage
  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen]);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Charger les formations
      const formationsRes = await fetch('/api/admin/contents?type=formations');
      const formationsData = await formationsRes.json();
      setFormations(formationsData.formations || []);

      // Charger les parcours
      const pathwaysRes = await fetch('/api/admin/contents?type=pathways');
      const pathwaysData = await pathwaysRes.json();
      setPathways(pathwaysData.pathways || []);

      console.log('🔍 InviteModal: Loaded content', {
        formations: formationsData.formations?.length || 0,
        pathways: pathwaysData.pathways?.length || 0
      });
    } catch (error) {
      console.error('🔍 InviteModal: Error loading content:', error);
      toast.error('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Veuillez saisir un email');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Veuillez saisir un email valide');
      return;
    }

    setIsSubmitting(true);

    try {
      await onInvite({
        email: email.trim(),
        formationIds: selectedFormations,
        testIds: [], // Placeholder pour l'instant
        resourceIds: [], // Placeholder pour l'instant
        pathwayIds: selectedPathways
      });

      // Reset form
      setEmail('');
      setSelectedFormations([]);
      setSelectedPathways([]);
      onClose();
      
      toast.success('Invitation envoyée avec succès !');
    } catch (error) {
      console.error('🔍 InviteModal: Error inviting learner:', error);
      toast.error('Erreur lors de l\'invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFormation = (formationId: string) => {
    setSelectedFormations(prev => 
      prev.includes(formationId) 
        ? prev.filter(id => id !== formationId)
        : [...prev, formationId]
    );
  };

  const togglePathway = (pathwayId: string) => {
    setSelectedPathways(prev => 
      prev.includes(pathwayId) 
        ? prev.filter(id => id !== pathwayId)
        : [...prev, pathwayId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Inviter un apprenant</h2>
              <p className="text-gray-600 text-sm">Créez un compte et assignez du contenu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de l'apprenant *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Formations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <GraduationCap className="w-4 h-4 inline mr-2" />
              Formations à assigner
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            ) : formations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune formation disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                {formations.map((formation) => (
                  <label
                    key={formation.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFormations.includes(formation.id)}
                      onChange={() => toggleFormation(formation.id)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{formation.title}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Parcours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Parcours à assigner
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                <span className="ml-2 text-gray-600">Chargement...</span>
              </div>
            ) : pathways.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun parcours disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto">
                {pathways.map((pathway) => (
                  <label
                    key={pathway.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPathways.includes(pathway.id)}
                      onChange={() => togglePathway(pathway.id)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{pathway.title}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Placeholders pour Tests et Ressources */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600">
                <ClipboardList className="w-4 h-4" />
                <span className="text-sm font-medium">Tests</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">Bientôt disponible</span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Ressources</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded">Bientôt disponible</span>
              </div>
            </div>
          </div>

          {/* Résumé */}
          {(selectedFormations.length > 0 || selectedPathways.length > 0) && (
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">Contenu assigné :</h3>
              <div className="space-y-1 text-sm text-purple-800">
                {selectedFormations.length > 0 && (
                  <p>• {selectedFormations.length} formation(s)</p>
                )}
                {selectedPathways.length > 0 && (
                  <p>• {selectedPathways.length} parcours</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Invitation...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Inviter et assigner
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
