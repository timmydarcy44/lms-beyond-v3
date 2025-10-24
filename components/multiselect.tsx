'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface MultiSelectOption {
  id: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  const selectedOptions = useMemo(() => {
    return options.filter(option => selected.includes(option.id));
  }, [options, selected]);

  const handleToggle = (optionId: string) => {
    if (selected.includes(optionId)) {
      onChange(selected.filter(id => id !== optionId));
    } else {
      onChange([...selected, optionId]);
    }
  };

  const handleRemove = (optionId: string) => {
    onChange(selected.filter(id => id !== optionId));
  };

  return (
    <div className="relative">
      {/* Selected items */}
      {selectedOptions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedOptions.map(option => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-1 text-sm"
            >
              {option.label}
              <button
                onClick={() => handleRemove(option.id)}
                className="hover:text-red-400 transition-colors"
                disabled={disabled}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between">
          <span className={selectedOptions.length > 0 ? 'text-white' : 'text-neutral-400'}>
            {selectedOptions.length > 0 
              ? `${selectedOptions.length} sélectionné${selectedOptions.length > 1 ? 's' : ''}`
              : placeholder
            }
          </span>
          <ChevronDown size={16} className={isOpen ? 'rotate-180' : ''} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-white/10 bg-neutral-900 shadow-lg">
          {/* Search */}
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-md bg-white/5 px-8 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-neutral-400 text-center">
                Aucun résultat
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleToggle(option.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selected.includes(option.id) 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-white/20'
                  }`}>
                    {selected.includes(option.id) && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                  <span>{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
