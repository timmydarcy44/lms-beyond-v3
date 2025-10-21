'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, BookOpen, FileText, ClipboardList, Route, X } from 'lucide-react';
import { inviteLearnerWithAssignments } from './invite-learner-with-assignments';
import { toast } from 'sonner';

interface Formation {
  id: string;
  title: string;
  published: boolean;
}

interface Resource {
  id: string;
  title: string;
  published: boolean;
}

interface Test {
  id: string;
  title: string;
  published: boolean;
}

interface Pathway {
  id: string;
  title: string;
  published: boolean;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function InviteLearnerForm() {
  const [email, setEmail] = useState('timdarcypro@gmail.com');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingContents, setLoadingContents] = useState(true);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  
  // Données de sélection chargées depuis l'API
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);

  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedPathways, setSelectedPathways] = useState<string[]>([]);

  // Charger les organisations du formateur
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        // Pour l'instant, on utilise une organisation par défaut
        // Cette fonction sera implémentée plus tard si nécessaire
        setOrganizations([]);
        setSelectedOrgId('');
      } catch (error: any) {
        console.error('Error loading organizations:', error);
        toast.error('Erreur lors du chargement des organisations');
      } finally {
        setLoadingOrgs(false);
      }
    };

    loadOrganizations();
  }, []);

  // Charger les contenus disponibles
  useEffect(() => {
    if (!selectedOrgId) return; // Attendre qu'une organisation soit sélectionnée
    
    const loadContents = async () => {
      try {
        const response = await fetch(`/api/admin/contents?orgId=${selectedOrgId}`);
        if (!response.ok) throw new Error('Erreur lors du chargement des contenus');
        
        const data = await response.json();
        setFormations(data.formations || []);
        setResources(data.resources || []);
        setTests(data.tests || []);
        setPathways(data.pathways || []);
      } catch (error: any) {
        console.error('Error loading contents:', error);
        toast.error('Erreur lors du chargement des contenus');
      } finally {
        setLoadingContents(false);
      }
    };

    setLoadingContents(true);
    loadContents();
  }, [selectedOrgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMsg('Email obligatoire');
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const result = await inviteLearnerWithAssignments({
        email: email,
        formationIds: selectedFormations,
        testIds: selectedTests,
        resourceIds: selectedResources,
        pathwayIds: selectedPathways,
      });

      toast.success(`Apprenant invité avec succès ! ${selectedFormations.length} formations, ${selectedTests.length} tests, ${selectedResources.length} ressources, ${selectedPathways.length} parcours assignés.`);
      
      // Reset form
      setEmail('');
      setSelectedFormations([]);
      setSelectedResources([]);
      setSelectedTests([]);
      setSelectedPathways([]);
      
    } catch (error: any) {
      console.error('Error inviting learner:', error);
      setMsg(error.message || 'Erreur lors de l\'invitation');
      toast.error(error.message || 'Erreur lors de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string, selectedItems: string[], setSelectedItems: (items: string[]) => void) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const ContentSelector = ({ title, items, selectedItems, onToggle, icon: Icon }: {
    title: string;
    items: any[];
    selectedItems: string[];
    onToggle: (id: string) => void;
    icon: any;
  }) => (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={20} className="text-iris-400" />
        <h3 className="text-white font-medium">{title}</h3>
        <span className="text-white/50 text-sm">({selectedItems.length})</span>
      </div>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded p-2">
            <input
              type="checkbox"
              checked={selectedItems.includes(item.id)}
              onChange={() => onToggle(item.id)}
              className="rounded border-white/20 bg-transparent text-iris-400 focus:ring-iris-400"
            />
            <span className="text-white/80 text-sm flex-1">{item.title}</span>
            {!item.published && (
              <span className="text-orange-400 text-xs">Brouillon</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-r from-iris-500 to-purple-500 rounded-xl">
          <Users size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Inviter un apprenant</h2>
          <p className="text-white/60">Créez un compte et assignez du contenu en une seule étape</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email input */}
        <div>
          <label htmlFor="email" className="block text-white font-medium mb-2">
            Email de l'apprenant
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-iris-400"
            placeholder="apprenant@exemple.com"
            required
          />
        </div>

        {/* Organisation dropdown */}
        <div>
          <label htmlFor="organization" className="block text-white font-medium mb-2">
            Organisation
          </label>
          {loadingOrgs ? (
            <div className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white/50">
              Chargement des organisations...
            </div>
          ) : (
            <select
              id="organization"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-iris-400"
              required
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id} className="bg-gray-800 text-white">
                  {org.name} ({org.role})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sélection des contenus */}
        {loadingContents ? (
          <div className="glass rounded-xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-iris-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white/70">Chargement des contenus disponibles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <ContentSelector
              title="Formations"
              items={formations}
              selectedItems={selectedFormations}
              onToggle={(id) => toggleSelection(id, selectedFormations, setSelectedFormations)}
              icon={BookOpen}
            />
            
            <ContentSelector
              title="Ressources"
              items={resources}
              selectedItems={selectedResources}
              onToggle={(id) => toggleSelection(id, selectedResources, setSelectedResources)}
              icon={FileText}
            />
            
            <ContentSelector
              title="Tests"
              items={tests}
              selectedItems={selectedTests}
              onToggle={(id) => toggleSelection(id, selectedTests, setSelectedTests)}
              icon={ClipboardList}
            />
            
            <ContentSelector
              title="Parcours"
              items={pathways}
              selectedItems={selectedPathways}
              onToggle={(id) => toggleSelection(id, selectedPathways, setSelectedPathways)}
              icon={Route}
            />
          </div>
        )}

        {/* Résumé des sélections */}
        {(selectedFormations.length > 0 || selectedResources.length > 0 || 
          selectedTests.length > 0 || selectedPathways.length > 0) && (
          <div className="glass rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/20">
            <h4 className="text-emerald-400 font-medium mb-2">Environnement d'apprentissage préparé :</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-white/80">
              {selectedFormations.length > 0 && (
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-emerald-400" />
                  <span>{selectedFormations.length} formation{selectedFormations.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {selectedResources.length > 0 && (
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-emerald-400" />
                  <span>{selectedResources.length} ressource{selectedResources.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {selectedTests.length > 0 && (
                <div className="flex items-center gap-2">
                  <ClipboardList size={14} className="text-emerald-400" />
                  <span>{selectedTests.length} test{selectedTests.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {selectedPathways.length > 0 && (
                <div className="flex items-center gap-2">
                  <Route size={14} className="text-emerald-400" />
                  <span>{selectedPathways.length} parcours</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages d'erreur */}
        {msg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {msg}
          </div>
        )}

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={loading || loadingContents}
          className="w-full btn-cta flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-iris-500 to-purple-500 hover:from-iris-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Invitation en cours...
            </>
          ) : (
            <>
              <Plus size={20} />
              Inviter et assigner
            </>
          )}
        </button>
      </form>
    </div>
  );
}