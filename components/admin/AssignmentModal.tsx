'use client';

import { useState, useEffect } from 'react';
import { X, Search, Check, Users, GraduationCap, Route } from 'lucide-react';
import { toast } from 'sonner';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'learner' | 'group' | 'pathway';
  formationId: string;
  orgId: string;
  onAssign: (targetType: string, targetId: string) => void;
}

interface Item {
  id: string;
  name: string;
  email?: string;
  description?: string;
  assigned?: boolean;
}

export default function AssignmentModal({ 
  isOpen, 
  onClose, 
  type, 
  formationId, 
  orgId, 
  onAssign 
}: AssignmentModalProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const typeLabels = {
    learner: { title: 'Assigner à des Apprenants', icon: Users, placeholder: 'Rechercher un apprenant...' },
    group: { title: 'Assigner à des Groupes', icon: GraduationCap, placeholder: 'Rechercher un groupe...' },
    pathway: { title: 'Assigner à des Parcours', icon: Route, placeholder: 'Rechercher un parcours...' }
  };

  const currentType = typeLabels[type];

  // Charger les données
  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, type]);

  // Filtrer les éléments
  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredItems(filtered);
  }, [items, searchTerm]);

  const loadItems = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (type) {
        case 'learner':
          endpoint = '/api/learners';
          break;
        case 'group':
          endpoint = '/api/groups';
          break;
        case 'pathway':
          endpoint = '/api/pathways';
          break;
      }

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (selectedItems.size === 0) {
      toast.error('Sélectionnez au moins un élément');
      return;
    }

    try {
      for (const itemId of selectedItems) {
        await onAssign(type, itemId);
      }
      toast.success(`${selectedItems.size} assignation(s) effectuée(s)`);
      onClose();
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error assigning:', error);
      toast.error('Erreur lors de l\'assignation');
    }
  };

  const toggleSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#252525] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <currentType.icon size={24} className="text-blue-400" />
            <h2 className="text-xl font-semibold text-white">{currentType.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder={currentType.placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              Aucun {type === 'learner' ? 'apprenant' : type === 'group' ? 'groupe' : 'parcours'} trouvé
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleSelection(item.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedItems.has(item.id)
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedItems.has(item.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-neutral-400'
                  }`}>
                    {selectedItems.has(item.id) && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.name}</div>
                    {item.email && (
                      <div className="text-sm text-neutral-400">{item.email}</div>
                    )}
                    {item.description && (
                      <div className="text-sm text-neutral-500">{item.description}</div>
                    )}
                  </div>
                  
                  {item.assigned && (
                    <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Assigné
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <div className="text-sm text-neutral-400">
            {selectedItems.size} élément(s) sélectionné(s)
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleAssign}
              disabled={selectedItems.size === 0}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-medium"
            >
              Assigner ({selectedItems.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
