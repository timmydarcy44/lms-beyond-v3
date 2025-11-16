"use client";

import { useState, useEffect } from "react";
import { X, Settings, Type, Contrast, Underline, Highlighter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useDyslexiaMode } from "@/components/apprenant/dyslexia-mode-provider";

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

type DyslexiaSettingsPaletteProps = {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesChange: (prefs: AccessibilityPreferences) => void;
};

export function DyslexiaSettingsPalette({
  isOpen,
  onClose,
  onPreferencesChange,
}: DyslexiaSettingsPaletteProps) {
  const { preferences: contextPrefs, updatePreferences: updateContextPrefs } = useDyslexiaMode();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    dyslexia_mode_enabled: false,
    letter_spacing: 0.15,
    line_height: 2.0,
    word_spacing: 0.3,
    font_family: "OpenDyslexic",
    contrast_level: "normal",
    highlight_confusing_letters: true,
    underline_complex_sounds: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadPreferences = async () => {
      try {
        setLoading(true);

        if (contextPrefs) {
          setPreferences(contextPrefs);
          onPreferencesChange(contextPrefs);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/accessibility/preferences");
        if (!response.ok) throw new Error("Erreur lors du chargement");

        const data = await response.json();
        setPreferences(data);
        onPreferencesChange(data);
      } catch (error) {
        console.error("[dyslexia-settings] Error loading preferences:", error);
        toast.error("Erreur lors du chargement des préférences");
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [isOpen, onPreferencesChange, contextPrefs]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const prefsToSave = { ...preferences, dyslexia_mode_enabled: true };

      const response = await fetch("/api/accessibility/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefsToSave),
      });

      if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

      const saved = await response.json();
      setPreferences(saved);
      updateContextPrefs(saved);
      onPreferencesChange(saved);
      toast.success("Préférences sauvegardées");
    } catch (error) {
      console.error("[dyslexia-settings] Error saving preferences:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof AccessibilityPreferences, value: any) => {
    try {
      const newPrefs = { ...preferences, [key]: value, dyslexia_mode_enabled: true };
      setPreferences(newPrefs);

      if (key === "font_family") {
        document.body.classList.remove("dyslexia-highlight-letters", "dyslexia-underline-sounds");
        setTimeout(() => {
          if (newPrefs.highlight_confusing_letters) {
            document.body.classList.add("dyslexia-highlight-letters");
          }
          if (newPrefs.underline_complex_sounds) {
            document.body.classList.add("dyslexia-underline-sounds");
          }
        }, 1500);
      }

      if (updateContextPrefs) {
        updateContextPrefs(newPrefs);
      }
      onPreferencesChange(newPrefs);
    } catch (error) {
      console.error("[dyslexia-settings] Error updating preference:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Palette technique - Mode dyslexie</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white/60">Chargement...</div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-white">
                <Type className="h-4 w-4" />
                Typographie
              </Label>
              <Select
                value={preferences.font_family}
                onValueChange={(value) => updatePreference("font_family", value)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OpenDyslexic">OpenDyslexic</SelectItem>
                  <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Tahoma">Tahoma</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-white">
                Espacement des lettres: {preferences.letter_spacing}em
              </Label>
              <Slider
                value={[preferences.letter_spacing]}
                onValueChange={([value]) => updatePreference("letter_spacing", value)}
                min={0}
                max={0.5}
                step={0.05}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-white">
                Interlignes: {preferences.line_height}
              </Label>
              <Slider
                value={[preferences.line_height]}
                onValueChange={([value]) => updatePreference("line_height", value)}
                min={1.0}
                max={3.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-white">
                Espacement des mots: {preferences.word_spacing}em
              </Label>
              <Slider
                value={[preferences.word_spacing]}
                onValueChange={([value]) => updatePreference("word_spacing", value)}
                min={0}
                max={1.0}
                step={0.05}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-white">
                <Contrast className="h-4 w-4" />
                Contraste
              </Label>
              <Select
                value={preferences.contrast_level}
                onValueChange={(value) => updatePreference("contrast_level", value)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="very-high">Très élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-white">
                <Highlighter className="h-4 w-4" />
                Mettre en évidence les lettres confusantes
              </Label>
              <Switch
                checked={preferences.highlight_confusing_letters}
                onCheckedChange={(checked) => updatePreference("highlight_confusing_letters", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-white">
                <Underline className="h-4 w-4" />
                Souligner les sons complexes
              </Label>
              <Switch
                checked={preferences.underline_complex_sounds}
                onCheckedChange={(checked) => updatePreference("underline_complex_sounds", checked)}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

