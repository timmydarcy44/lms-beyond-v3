'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, GraduationCap, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Learner {
  id: string;
  email: string;
  name?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface Pathway {
  id: string;
  title: string;
  description?: string;
}

interface AssignmentsPanelProps {
  formationId: string;
  onClose: () => void;
}

export default function AssignmentsPanel({ formationId, onClose }: AssignmentsPanelProps) {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedPathways, setSelectedPathways] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les apprenants
      const learnersRes = await fetch('/api/admin/contents?type=learners');
      const learnersData = await learnersRes.json();
      setLearners(learnersData.learners || []);

      // Charger les groupes
      const groupsRes = await fetch('/api/admin/contents?type=groups');
      const groupsData = await groupsRes.json();
      setGroups(groupsData.groups || []);

      // Charger les parcours
      const pathwaysRes = await fetch('/api/pathways');
      const pathwaysData = await pathwaysRes.json();
      setPathways(pathwaysData.pathways || []);

    } catch (error) {
      console.error('Error loading assignment data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/formations/${formationId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          learners: selectedLearners,
          groups: selectedGroups,
          pathways: selectedPathways,
        }),
      });

      const result = await response.json();

      if (result.ok) {
        toast.success('Assignations enregistrées avec succès !');
        onClose();
      } else {
        toast.error(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const MultiSelect = ({ 
    items, 
    selected, 
    onToggle, 
    placeholder, 
    icon: Icon,
    getLabel,
    getValue 
  }: {
    items: any[];
    selected: string[];
    onToggle: (id: string) => void;
    placeholder: string;
    icon: any;
    getLabel: (item: any) => string;
    getValue: (item: any) => string;
  }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-white/90">
        <Icon className="w-4 h-4" />
        {placeholder}
      </label>
      <div className="max-h-32 overflow-y-auto border border-white/10 rounded-lg bg-white/5">
        {items.length === 0 ? (
          <div className="p-3 text-white/50 text-sm text-center">
            Aucun élément disponible
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selected.includes(getValue(item));
            return (
              <label
                key={getValue(item)}
                className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(getValue(item))}
                  className="w-4 h-4 text-iris-600 border-white/20 rounded focus:ring-iris-500/40"
                />
                <span className="text-white text-sm">{getLabel(item)}</span>
              </label>
            );
          })
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((id) => {
            const item = items.find(i => getValue(i) === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-iris-500/20 text-iris-400 text-xs rounded-lg"
              >
                {getLabel(item)}
                <button
                  onClick={() => onToggle(id)}
                  className="hover:text-iris-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-iris-400" />
        <span className="ml-2 text-white/70">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        {/* Apprenants */}
        <MultiSelect
          items={learners}
          selected={selectedLearners}
          onToggle={(id) => setSelectedLearners(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
          )}
          placeholder="Apprenants"
          icon={Users}
          getLabel={(learner) => learner.name || learner.email}
          getValue={(learner) => learner.id}
        />

        {/* Groupes */}
        <MultiSelect
          items={groups}
          selected={selectedGroups}
          onToggle={(id) => setSelectedGroups(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
          )}
          placeholder="Groupes"
          icon={UserCheck}
          getLabel={(group) => group.name}
          getValue={(group) => group.id}
        />

        {/* Parcours */}
        <MultiSelect
          items={pathways}
          selected={selectedPathways}
          onToggle={(id) => setSelectedPathways(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
          )}
          placeholder="Parcours"
          icon={GraduationCap}
          getLabel={(pathway) => pathway.title}
          getValue={(pathway) => pathway.id}
        />
      </div>

      {/* Résumé */}
      {(selectedLearners.length > 0 || selectedGroups.length > 0 || selectedPathways.length > 0) && (
        <div className="p-4 bg-iris-500/10 border border-iris-500/20 rounded-lg">
          <h3 className="font-medium text-iris-400 mb-2">Assignations sélectionnées :</h3>
          <div className="space-y-1 text-sm text-iris-300">
            {selectedLearners.length > 0 && (
              <p>• {selectedLearners.length} apprenant(s)</p>
            )}
            {selectedGroups.length > 0 && (
              <p>• {selectedGroups.length} groupe(s)</p>
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
          onClick={onClose}
          className="flex-1 px-4 py-3 border border-white/20 text-white/70 rounded-lg hover:bg-white/5 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-iris-500 to-blush-500 hover:from-iris-600 hover:to-blush-600 text-white rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Enregistrer assignations
            </>
          )}
        </button>
      </div>
    </div>
  );
}
