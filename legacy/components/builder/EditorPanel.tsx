"use client";
import { useState, useEffect } from "react";
import { Save, FileText } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useBuilder } from "@/contexts/BuilderContext";

export default function EditorPanel() {
  const { selectedSubChapter } = useBuilder();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (selectedSubChapter) {
      setContent(selectedSubChapter.content || "");
      setSaved(false);
    }
  }, [selectedSubChapter]);

  useEffect(() => {
    if (!selectedSubChapter || !content) return;
    
    const timer = setTimeout(async () => {
      setSaving(true);
      await supabase
        .from("subchapters")
        .update({ content })
        .eq("id", selectedSubChapter.id);
      setSaving(false);
      setSaved(true);
      
      setTimeout(() => setSaved(false), 2000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, selectedSubChapter]);

  async function handleManualSave() {
    if (!selectedSubChapter) return;
    setSaving(true);
    await supabase
      .from("subchapters")
      .update({ content })
      .eq("id", selectedSubChapter.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!selectedSubChapter) {
    return (
      <div className="flex-1 bg-[#f8f8f8] overflow-y-auto">
        <div className="h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>Sélectionnez un élément pour le modifier</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8f8f8] overflow-y-auto">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                {selectedSubChapter.title}
              </h2>
              <p className="text-sm text-gray-500">Éditez le contenu de ce sous-chapitre</p>
            </div>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  ✓ Enregistré
                </span>
              )}
              <button
                onClick={handleManualSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Rédigez le contenu de ce sous-chapitre..."
            className="w-full min-h-[500px] rounded-lg border border-gray-300 p-4 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}




