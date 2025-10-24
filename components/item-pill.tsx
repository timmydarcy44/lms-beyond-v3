'use client';

import { X } from 'lucide-react';

interface ItemPillProps {
  id: string;
  type: 'formation' | 'test' | 'resource';
  title: string;
  onRemove: () => void;
  disabled?: boolean;
}

const typeLabels = {
  formation: 'Formation',
  test: 'Test',
  resource: 'Ressource',
};

const typeColors = {
  formation: 'bg-blue-500/20 text-blue-300',
  test: 'bg-green-500/20 text-green-300',
  resource: 'bg-purple-500/20 text-purple-300',
};

export default function ItemPill({ id, type, title, onRemove, disabled = false }: ItemPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <div className={`rounded-md px-2 py-1 text-xs font-medium ${typeColors[type]}`}>
        {typeLabels[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-neutral-400">ID: {id}</p>
      </div>
      <button
        onClick={onRemove}
        disabled={disabled}
        className="rounded-md p-1 hover:bg-red-500/20 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={`Supprimer ${title}`}
      >
        <X size={16} />
      </button>
    </div>
  );
}
