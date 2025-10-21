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
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 text-center sm:text-left">
              {/* Titre de la formation avec gradient */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {formation.title}
              </h1>
              
              {/* Titre du chapitre/sous-chapitre avec gradient */}
              {getCurrentTitle() && (
                <div className="text-lg sm:text-xl font-medium">
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
                <p className="text-sm sm:text-lg text-gray-500">Sélectionnez un chapitre ou sous-chapitre pour commencer l'édition</p>
              )}
            </div>
            
            <div className="flex items-center justify-center sm:justify-end gap-3 sm:gap-4">
              <button
                onClick={() => setShowPropertiesModal(true)}
                className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                title="Propriétés"
              >
                <Settings size={18} className="sm:w-5 sm:h-5" />
              </button>
              <PublicationControls formationId={formation.id} published={formation.published} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 min-h-[calc(100vh-120px)]">
        {/* Colonne gauche - Builder */}
        <aside className="order-2 lg:order-1 overflow-auto bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 p-3 sm:p-4 shadow-lg lg:h-[calc(100vh-120px)]">
          <Tree
            formationId={formation.id}
            sections={sections}
            chapters={chapters}
            subchapters={subchapters}
            onSelect={setSelection}
          />
        </aside>

        {/* Colonne droite - Éditeur */}
        <main className="order-1 lg:order-2 overflow-auto bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 p-3 sm:p-4 shadow-lg lg:h-[calc(100vh-120px)]">
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
