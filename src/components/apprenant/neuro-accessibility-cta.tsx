"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import { DyslexiaSettingsPalette } from "@/components/apprenant/dyslexia-settings-palette";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";

export function NeuroAccessibilityCTA() {
  const [isOpen, setIsOpen] = useState(false);
  const { isDyslexiaMode, toggleDyslexiaMode } = useDyslexiaMode();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!isDyslexiaMode) {
            toggleDyslexiaMode();
          }
          setIsOpen(true);
        }}
        className="no-dyslexia fixed bottom-6 left-6 z-[10001] inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/20"
        data-neuro-cta
      >
        <Brain className="h-4 w-4" />
        Neuro adaptation
      </button>

      <DyslexiaSettingsPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onPreferencesChange={() => {}}
      />
    </>
  );
}
