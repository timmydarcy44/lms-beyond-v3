'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, Users, UserCheck, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionsProps {
  contentType: 'formation' | 'test' | 'resource' | 'pathway';
  contentId: string;
  contentTitle: string;
}

export default function QuickActions({ contentType, contentId, contentTitle }: QuickActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<'learners' | 'groups' | 'pathways' | null>(null);

  const handleAssign = async (type: 'learners' | 'groups' | 'pathways', targetIds: string[]) => {
    try {
      let endpoint = '';
      
      switch (contentType) {
        case 'formation':
          endpoint = `/api/formations/${contentId}/assign`;
          break;
        case 'test':
          endpoint = `/api/tests/${contentId}/assign`;
          break;
        case 'resource':
          endpoint = `/api/resources/${contentId}/assign`;
          break;
        case 'pathway':
          endpoint = `/api/pathways/${contentId}/assign`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [type]: targetIds,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success(`${contentTitle} assigné avec succès !`);
        setShowAssignModal(false);
        setShowMenu(false);
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Error assigning content:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const handleAddToPathway = async (pathwayId: string) => {
    try {
      const response = await fetch(`/api/pathways/${pathwayId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            content_id: contentId,
            content_type: contentType,
            position: 1
          }]
        }),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success(`${contentTitle} ajouté au parcours !`);
        setShowAssignModal(false);
        setShowMenu(false);
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Error adding to pathway:', error);
      toast.error('Erreur lors de l\'ajout au parcours');
    }
  };

  return (
    <>
      {/* Bouton menu */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Actions rapides"
        >
          <MoreHorizontal className="w-4 h-4 text-white/50" />
        </button>

        {/* Menu dropdown */}
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-8 z-50 w-48 bg-[#252525] border border-white/10 rounded-lg shadow-xl">
              <div className="py-1">
                <button
                  onClick={() => {
                    setAssignType('learners');
                    setShowAssignModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Assigner à des apprenants
                </button>
                
                <button
                  onClick={() => {
                    setAssignType('groups');
                    setShowAssignModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Assigner à des groupes
                </button>
                
                {contentType !== 'pathway' && (
                  <button
                    onClick={() => {
                      setAssignType('pathways');
                      setShowAssignModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Ajouter au parcours
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal d'assignation */}
      {showAssignModal && assignType && (
        <AssignModal
          contentType={contentType}
          contentTitle={contentTitle}
          assignType={assignType}
          onAssign={handleAssign}
          onAddToPathway={handleAddToPathway}
          onClose={() => {
            setShowAssignModal(false);
            setAssignType(null);
          }}
        />
      )}
    </>
  );
}

// Composant modal d'assignation simplifié
function AssignModal({ 
  contentType, 
  contentTitle, 
  assignType, 
  onAssign, 
  onAddToPathway, 
  onClose 
}: {
  contentType: string;
  contentTitle: string;
  assignType: 'learners' | 'groups' | 'pathways';
  onAssign: (type: 'learners' | 'groups' | 'pathways', ids: string[]) => void;
  onAddToPathway: (pathwayId: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, [assignType]);

  const loadItems = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (assignType) {
        case 'learners':
          endpoint = '/api/admin/contents?type=learners';
          break;
        case 'groups':
          endpoint = '/api/admin/contents?type=groups';
          break;
        case 'pathways':
          endpoint = '/api/pathways';
          break;
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      
      switch (assignType) {
        case 'learners':
          setItems(data.learners || []);
          break;
        case 'groups':
          setItems(data.groups || []);
          break;
        case 'pathways':
          setItems(data.pathways || []);
          break;
      }
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (assignType === 'pathways' && selected.length > 0) {
      onAddToPathway(selected[0]);
    } else {
      onAssign(assignType, selected);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#252525] rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          Assigner {contentTitle}
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-iris-400 border-t-transparent rounded-full mx-auto mb-2" />
            <span className="text-white/70">Chargement...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-40 overflow-y-auto border border-white/10 rounded-lg">
              {items.map((item) => (
                <label key={item.id} className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected([...selected, item.id]);
                      } else {
                        setSelected(selected.filter(id => id !== item.id));
                      }
                    }}
                    className="w-4 h-4 text-iris-600 border-white/20 rounded focus:ring-iris-500/40"
                  />
                  <span className="text-white text-sm">
                    {item.name || item.title || item.email}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={selected.length === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-iris-500 to-blush-500 hover:from-iris-600 hover:to-blush-600 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assigner
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
