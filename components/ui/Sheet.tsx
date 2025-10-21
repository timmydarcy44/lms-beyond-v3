'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function Sheet({ isOpen, onClose, children, title }: SheetProps) {
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
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div 
        className="fixed right-0 top-0 z-50 h-full w-full max-w-[90vw] md:max-w-[520px] bg-[#252525] border-l border-white/10 shadow-2xl transform transition-all duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "sheet-title" : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          {title && (
            <h2 id="sheet-title" className="text-xl font-semibold text-white">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-iris-500/40"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
