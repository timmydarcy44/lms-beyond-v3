'use client';
import { useState, useEffect, useTransition } from 'react';
import { Users, Plus, X, BookOpen, GraduationCap, UserCheck } from 'lucide-react';
import { assignFormationContent } from './actions';
import { toast } from 'sonner';

interface AssignmentsPanelProps {
  formationId: string;
  orgId: string;
}

type Learner = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
};

type Group = {
  id: string;
  name: string;
  description?: string;
};

type Pathway = {
  id: string;
  title: string;
  description?: string;
};

export default function AssignmentsPanel({ formationId, orgId }: AssignmentsPanelProps) {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [assignedLearners, setAssignedLearners] = useState<string[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<string[]>([]);
  const [assignedPathways, setAssignedPathways] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les apprenants
        const learnersRes = await fetch(`/api/admin/contents?type=learners&orgId=${orgId}`);
        const learnersData = await learnersRes.json();
        setLearners(learnersData.contents || []);

        // Charger les groupes
        const groupsRes = await fetch(`/api/admin/contents?type=groups&orgId=${orgId}`);
        const groupsData = await groupsRes.json();
        setGroups(groupsData.contents || []);

        // Charger les parcours
        const pathwaysRes = await fetch(`/api/admin/contents?type=pathways&orgId=${orgId}`);
        const pathwaysData = await pathwaysRes.json();
        setPathways(pathwaysData.contents || []);

        // Charger les assignations existantes
        const assignmentsRes = await fetch(`/api/formations/${formationId}/assignments`);
        const assignmentsData = await assignmentsRes.json();
        
        if (assignmentsData.assignments) {
          setAssignedLearners(assignmentsData.assignments.learners || []);
          setAssignedGroups(assignmentsData.assignments.groups || []);
          setAssignedPathways(assignmentsData.assignments.pathways || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [formationId, orgId]);

  const handleAssign = (type: 'learner' | 'group' | 'pathway', id: string) => {
    startTransition(async () => {
      try {
        await assignFormationContent(formationId, type, id, orgId);
        
        // Mettre à jour l'état local
        if (type === 'learner') {
          setAssignedLearners(prev => [...prev, id]);
        } else if (type === 'group') {
          setAssignedGroups(prev => [...prev, id]);
        } else if (type === 'pathway') {
          setAssignedPathways(prev => [...prev, id]);
        }
        
        toast.success('Assignation réussie');
      } catch (error) {
        console.error('Erreur lors de l\'assignation:', error);
        toast.error('Erreur lors de l\'assignation');
      }
    });
  };

  const handleUnassign = (type: 'learner' | 'group' | 'pathway', id: string) => {
    startTransition(async () => {
      try {
        await assignFormationContent(formationId, type, id, orgId, true); // true = unassign
        
        // Mettre à jour l'état local
        if (type === 'learner') {
          setAssignedLearners(prev => prev.filter(l => l !== id));
        } else if (type === 'group') {
          setAssignedGroups(prev => prev.filter(g => g !== id));
        } else if (type === 'pathway') {
          setAssignedPathways(prev => prev.filter(p => p !== id));
        }
        
        toast.success('Désassignation réussie');
      } catch (error) {
        console.error('Erreur lors de la désassignation:', error);
        toast.error('Erreur lors de la désassignation');
      }
    });
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-iris-400" />
          <h3 className="text-lg font-semibold text-iris-grad">Assignations</h3>
        </div>
        <div className="text-center text-white/50">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-iris-400" />
        <h3 className="text-lg font-semibold text-iris-grad">Assignations</h3>
      </div>

      <div className="space-y-6">
        {/* Apprenants */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Apprenants ({assignedLearners.length})
          </h4>
          
          {learners.length === 0 ? (
            <div className="text-white/50 text-sm">Aucun apprenant disponible</div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {learners.map(learner => {
                const isAssigned = assignedLearners.includes(learner.id);
                return (
                  <div key={learner.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {learner.first_name && learner.last_name 
                          ? `${learner.first_name} ${learner.last_name}`
                          : learner.email
                        }
                      </div>
                      <div className="text-white/50 text-xs">{learner.email}</div>
                    </div>
                    <button
                      onClick={() => isAssigned 
                        ? handleUnassign('learner', learner.id)
                        : handleAssign('learner', learner.id)
                      }
                      disabled={pending}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isAssigned
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                          : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                      }`}
                      title={isAssigned ? 'Retirer' : 'Assigner'}
                    >
                      {isAssigned ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Groupes */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Groupes ({assignedGroups.length})
          </h4>
          
          {groups.length === 0 ? (
            <div className="text-white/50 text-sm">Aucun groupe disponible</div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {groups.map(group => {
                const isAssigned = assignedGroups.includes(group.id);
                return (
                  <div key={group.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{group.name}</div>
                      {group.description && (
                        <div className="text-white/50 text-xs">{group.description}</div>
                      )}
                    </div>
                    <button
                      onClick={() => isAssigned 
                        ? handleUnassign('group', group.id)
                        : handleAssign('group', group.id)
                      }
                      disabled={pending}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isAssigned
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                          : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                      }`}
                      title={isAssigned ? 'Retirer' : 'Assigner'}
                    >
                      {isAssigned ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Parcours */}
        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Parcours ({assignedPathways.length})
          </h4>
          
          {pathways.length === 0 ? (
            <div className="text-white/50 text-sm">Aucun parcours disponible</div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {pathways.map(pathway => {
                const isAssigned = assignedPathways.includes(pathway.id);
                return (
                  <div key={pathway.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{pathway.title}</div>
                      {pathway.description && (
                        <div className="text-white/50 text-xs">{pathway.description}</div>
                      )}
                    </div>
                    <button
                      onClick={() => isAssigned 
                        ? handleUnassign('pathway', pathway.id)
                        : handleAssign('pathway', pathway.id)
                      }
                      disabled={pending}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isAssigned
                          ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                          : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                      }`}
                      title={isAssigned ? 'Retirer' : 'Assigner'}
                    >
                      {isAssigned ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pending && (
          <div className="text-xs text-white/50 text-center">Mise à jour en cours…</div>
        )}
      </div>
    </div>
  );
}