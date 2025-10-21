'use client';

import { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';

interface FullscreenEditorProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function FullscreenEditor({ isOpen, onClose, children, title }: FullscreenEditorProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Gérer l'overflow du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Gérer ESC pour fermer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#252525] flex">
      {/* Colonne gauche - Nomenclature */}
      <div className={`bg-[#1a1a1a] border-r border-white/10 transition-all duration-300 ease-out ${
        isMinimized ? 'w-16' : 'w-80'
      }`}>
        {/* Header gauche */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          {!isMinimized && (
            <h2 className="text-lg font-semibold text-white truncate">
              {title || 'Structure'}
            </h2>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isMinimized ? 'Agrandir' : 'Réduire'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-white/70" />
            ) : (
              <Minimize2 className="w-4 h-4 text-white/70" />
            )}
          </button>
        </div>

        {/* Contenu nomenclature */}
        {!isMinimized && (
          <div className="p-4">
            <div className="space-y-2">
              {/* Mock structure - à remplacer par la vraie structure */}
              <div className="p-3 bg-white/5 rounded-lg">
                <h3 className="text-white font-medium text-sm">Section 1</h3>
                <div className="ml-4 mt-2 space-y-1">
                  <div className="text-white/70 text-xs">Chapitre 1.1</div>
                  <div className="text-white/70 text-xs">Chapitre 1.2</div>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <h3 className="text-white font-medium text-sm">Section 2</h3>
                <div className="ml-4 mt-2 space-y-1">
                  <div className="text-white/70 text-xs">Chapitre 2.1</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Icônes quand minimisé */}
        {isMinimized && (
          <div className="p-2 space-y-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white/70 text-xs">S1</span>
            </div>
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <span className="text-white/70 text-xs">S2</span>
            </div>
          </div>
        )}
      </div>

      {/* Zone d'édition principale */}
      <div className="flex-1 flex flex-col">
        {/* Header principal */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#252525]">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-white">
              {title || 'Éditeur'}
            </h1>
            <span className="px-2 py-1 bg-iris-500/20 text-iris-400 text-xs rounded-lg">
              Plein écran
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={isMinimized ? 'Agrandir nomenclature' : 'Réduire nomenclature'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-white/70" />
              ) : (
                <Minimize2 className="w-4 h-4 text-white/70" />
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Fermer le plein écran"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Zone d'édition */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full bg-white rounded-lg m-4 p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
