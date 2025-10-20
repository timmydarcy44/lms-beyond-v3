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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-300">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              {/* Titre de la formation - plus gros et centré */}
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{formation.title}</h1>
              
              {/* Titre du chapitre/sous-chapitre en cours d'édition */}
              {getCurrentTitle() && (
                <div className="text-xl text-gray-600 font-medium">
                  {selection?.type === 'chapter' ? 'Chapitre : ' : 'Sous-chapitre : '}
                  <span className="text-gray-900 font-semibold">{getCurrentTitle()}</span>
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
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Propriétés"
              >
                <Settings size={20} className="text-gray-600" />
              </button>
              <PublicationControls formationId={formation.id} published={formation.published} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - 2 colonnes */}
      <div className="grid grid-cols-2 gap-6 p-6 h-[calc(100vh-120px)] bg-gray-50">
        {/* Colonne gauche - Builder */}
        <aside className="overflow-auto bg-white rounded-lg border border-gray-200 p-4">
          <Tree
            formationId={formation.id}
            sections={sections}
            chapters={chapters}
            subchapters={subchapters}
            onSelect={setSelection}
          />
        </aside>

        {/* Colonne droite - Éditeur */}
        <main className="overflow-auto bg-white rounded-lg border border-gray-200 p-4">
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
