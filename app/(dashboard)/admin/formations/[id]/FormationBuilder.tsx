'use client';
import { useState } from 'react';
import Tree from './Tree';
import Editor from './Editor';
import PropertiesModal from './PropertiesModal';
import PublicationControls from './PublicationControls';
import { Settings } from 'lucide-react';

type Section = { id: string; title: string; position: number; };
type Chapter = { id: string; section_id: string; title: string; position: number; };
type Subchapter = { id: string; chapter_id: string; title: string; position: number; };
type Formation = { 
  id: string; 
  org_id: string; 
  title: string; 
  reading_mode: 'free' | 'linear'; 
  visibility_mode: 'private' | 'catalog_only' | 'public'; 
  published: boolean 
};

export default function FormationBuilder({ 
  formation, 
  sections, 
  chapters, 
  subchapters 
}: {
  formation: Formation; 
  sections: Section[]; 
  chapters: Chapter[]; 
  subchapters: Subchapter[];
}) {
  const [selection, setSelection] = useState<{ type: 'chapter' | 'subchapter'; id: string; title: string; parentTitle?: string; } | null>(null);
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);

  // Fonction pour obtenir le titre du chapitre/sous-chapitre sélectionné
  const getCurrentTitle = () => {
    if (!selection) return null;
    
    if (selection.type === 'chapter') {
      const chapter = chapters.find(c => c.id === selection.id);
      return chapter?.title;
    } else {
      const subchapter = subchapters.find(sc => sc.id === selection.id);
      return subchapter?.title;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header avec gradient */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              {/* Titre de la formation avec gradient */}
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {formation.title}
              </h1>
              
              {/* Titre du chapitre/sous-chapitre avec gradient */}
              {getCurrentTitle() && (
                <div className="text-xl font-medium">
                  <span className="text-gray-600">
                    {selection?.type === 'chapter' ? 'Chapitre : ' : 'Sous-chapitre : '}
                  </span>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
                    {getCurrentTitle()}
                  </span>
                </div>
              )}
              
              {/* Message par défaut si rien n'est sélectionné */}
              {!selection && (
                <p className="text-lg text-gray-500">Sélectionnez un chapitre ou sous-chapitre pour commencer l'édition</p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPropertiesModal(true)}
                className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Propriétés"
              >
                <Settings size={20} />
              </button>
              <PublicationControls formationId={formation.id} published={formation.published} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 2 colonnes avec glassmorphism */}
      <div className="grid grid-cols-2 gap-6 p-6 h-[calc(100vh-120px)]">
        {/* Colonne gauche - Builder */}
        <aside className="overflow-auto bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 p-4 shadow-lg">
          <Tree
            formationId={formation.id}
            sections={sections}
            chapters={chapters}
            subchapters={subchapters}
            onSelect={setSelection}
          />
        </aside>

        {/* Colonne droite - Éditeur */}
        <main className="overflow-auto bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 p-4 shadow-lg">
          <Editor formation={formation} selection={selection} />
        </main>
      </div>

      {/* Modal des propriétés */}
      {showPropertiesModal && (
        <PropertiesModal
          formation={formation}
          formationId={formation.id}
          orgId={formation.org_id}
          onClose={() => setShowPropertiesModal(false)}
        />
      )}
    </div>
  );
}
