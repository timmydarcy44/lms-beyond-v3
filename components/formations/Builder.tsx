'use client';

import { useState } from 'react';
import { Settings, Users, Shield, Cog } from 'lucide-react';
import Sheet from '@/components/ui/Sheet';
import AssignmentsPanel from './AssignmentsPanel';

interface BuilderProps {
  formationId: string;
  formation: {
    id: string;
    title: string;
    description?: string;
    published: boolean;
  };
}

export default function Builder({ formationId, formation }: BuilderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'assignments' | 'access' | 'advanced'>('general');

  const tabs = [
    { id: 'general', label: 'Général', icon: Cog },
    { id: 'assignments', label: 'Assignations', icon: Users },
    { id: 'access', label: 'Accès', icon: Shield },
    { id: 'advanced', label: 'Avancé', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'assignments':
        return <AssignmentsPanel formationId={formationId} onClose={() => setShowSettings(false)} />;
      
      case 'general':
        return (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Titre de la formation
              </label>
              <input
                type="text"
                defaultValue={formation.title}
                className="w-full px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/50 focus:border-iris-500/50 focus:ring-2 focus:ring-iris-500/40 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Description
              </label>
              <textarea
                defaultValue={formation.description || ''}
                rows={4}
                className="w-full px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-white placeholder-white/50 focus:border-iris-500/50 focus:ring-2 focus:ring-iris-500/40 focus:outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked={formation.published}
                className="w-4 h-4 text-iris-600 border-white/20 rounded focus:ring-iris-500/40"
              />
              <label className="text-white/90 text-sm">
                Formation publiée
              </label>
            </div>
          </div>
        );

      case 'access':
        return (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Mode de visibilité
              </label>
              <select className="w-full px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-white focus:border-iris-500/50 focus:ring-2 focus:ring-iris-500/40 focus:outline-none">
                <option value="private">Privé</option>
                <option value="catalog_only">Catalogue uniquement</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Mode de lecture
              </label>
              <select className="w-full px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-white focus:border-iris-500/50 focus:ring-2 focus:ring-iris-500/40 focus:outline-none">
                <option value="free">Libre</option>
                <option value="linear">Linéaire</option>
              </select>
            </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                ID de la formation
              </label>
              <input
                type="text"
                value={formationId}
                readOnly
                className="w-full px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-white/50 cursor-not-allowed"
              />
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 className="font-medium text-red-400 mb-2">Zone de danger</h3>
              <p className="text-red-300 text-sm mb-3">
                Ces actions sont irréversibles. Procédez avec prudence.
              </p>
              <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm">
                Supprimer la formation
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Bouton Paramètres */}
      <button
        onClick={() => setShowSettings(true)}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-iris-500/40"
        title="Paramètres"
      >
        <Settings className="w-5 h-5 text-white/70" />
      </button>

      {/* Sheet Paramètres */}
      <Sheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Paramètres de la formation"
      >
        {/* Onglets */}
        <div className="border-b border-white/10">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-iris-400 border-b-2 border-iris-400'
                      : 'text-white/70 hover:text-white/90'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu des onglets */}
        {renderTabContent()}
      </Sheet>
    </>
  );
}