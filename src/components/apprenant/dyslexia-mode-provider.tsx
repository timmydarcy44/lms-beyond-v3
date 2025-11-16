"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AccessibilityPreferences = {
  dyslexia_mode_enabled: boolean;
  letter_spacing: number;
  line_height: number;
  word_spacing: number;
  font_family: string;
  contrast_level: string;
  highlight_confusing_letters: boolean;
  underline_complex_sounds: boolean;
};

type DyslexiaModeContextType = {
  isDyslexiaMode: boolean;
  toggleDyslexiaMode: () => void;
  preferences: AccessibilityPreferences | null;
  updatePreferences: (prefs: AccessibilityPreferences) => void;
};

const DyslexiaModeContext = createContext<DyslexiaModeContextType | undefined>(undefined);

export function DyslexiaModeProvider({ children }: { children: ReactNode }) {
  const [isDyslexiaMode, setIsDyslexiaMode] = useState(false);
  const [preferences, setPreferences] = useState<AccessibilityPreferences | null>(null);

  // Charger les préférences depuis l'API
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/accessibility/preferences");
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
          setIsDyslexiaMode(data.dyslexia_mode_enabled || false);
        }
      } catch (error) {
        console.error("[dyslexia-provider] Error loading preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  // Appliquer les styles CSS basés sur les préférences - Approche CSS pure sans manipulation DOM
  useEffect(() => {
    if (typeof window === "undefined" || !preferences) return;

    try {
      const root = document.documentElement;

      if (isDyslexiaMode) {
        document.body.classList.add("dyslexia-mode");

        // Appliquer les préférences personnalisées
        root.style.setProperty("--dyslexia-letter-spacing", `${preferences.letter_spacing}em`);
        root.style.setProperty("--dyslexia-line-height", preferences.line_height.toString());
        root.style.setProperty("--dyslexia-word-spacing", `${preferences.word_spacing}em`);
        root.style.setProperty("--dyslexia-font-family", preferences.font_family);

        // Contraste
        if (preferences.contrast_level === "high") {
          root.style.setProperty("--dyslexia-contrast", "1.5");
        } else if (preferences.contrast_level === "very-high") {
          root.style.setProperty("--dyslexia-contrast", "2");
        } else {
          root.style.setProperty("--dyslexia-contrast", "1");
        }

        // Appliquer les classes CSS pour les effets visuels (approche pure CSS)
        if (preferences.highlight_confusing_letters) {
          document.body.classList.add("dyslexia-highlight-letters");
        } else {
          document.body.classList.remove("dyslexia-highlight-letters");
        }

        if (preferences.underline_complex_sounds) {
          document.body.classList.add("dyslexia-underline-sounds");
        } else {
          document.body.classList.remove("dyslexia-underline-sounds");
        }
      } else {
        document.body.classList.remove("dyslexia-mode", "dyslexia-highlight-letters", "dyslexia-underline-sounds");
      }
    } catch (error) {
      console.error("[dyslexia-provider] Error applying styles:", error);
    }
  }, [isDyslexiaMode, preferences]);

  const toggleDyslexiaMode = () => {
    setIsDyslexiaMode((prev) => !prev);
  };

  const updatePreferences = (prefs: AccessibilityPreferences) => {
    setPreferences(prefs);
    // Toujours activer le mode dyslexie quand on met à jour les préférences (c'est pour le preview)
    setIsDyslexiaMode(true);
  };

  return (
    <DyslexiaModeContext.Provider value={{ isDyslexiaMode, toggleDyslexiaMode, preferences, updatePreferences }}>
      {children}
    </DyslexiaModeContext.Provider>
  );
}

export function useDyslexiaMode() {
  const context = useContext(DyslexiaModeContext);
  const [localState, setLocalState] = useState(false);

  // Si le provider n'est pas présent, utiliser un état local avec localStorage
  useEffect(() => {
    if (context !== undefined) return;

    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("dyslexiaMode");
    if (saved === "true") {
      setLocalState(true);
      document.body.classList.add("dyslexia-mode");
    }
  }, [context]);

  useEffect(() => {
    if (context !== undefined) return;

    if (typeof window === "undefined") return;

    if (localState) {
      document.body.classList.add("dyslexia-mode");
    } else {
      document.body.classList.remove("dyslexia-mode");
    }
    localStorage.setItem("dyslexiaMode", localState.toString());
  }, [localState, context]);

  if (context === undefined) {
    return {
      isDyslexiaMode: localState,
      toggleDyslexiaMode: () => {
        setLocalState((prev) => !prev);
      },
      preferences: null,
      updatePreferences: () => {},
    };
  }

  return context;
}
