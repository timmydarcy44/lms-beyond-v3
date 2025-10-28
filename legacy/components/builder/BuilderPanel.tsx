"use client";
import { useState } from "react";
import { Plus, Trash2, File, FileText, Folder } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useBuilder } from "@/contexts/BuilderContext";

type Section = { id: string; title: string; position: number };
type Chapter = { id: string; section_id: string; title: string; position: number };
type SubChapter = { id: string; chapter_id: string; title: string; content: string; position: number };

export default function BuilderPanel({
  courseId,
  sections,
  chapters,
  subchapters,
}: {
  courseId: string;
  sections: Section[];
  chapters: Chapter[];
  subchapters: SubChapter[];
}) {
  const { setSelectedSubChapter, refreshBuilder } = useBuilder();
  const supabase = createClientComponentClient();

  async function addSection() {
    const title = prompt("Nom de la section:");
    if (!title) return;

    const maxPos = sections.length > 0 ? Math.max(...sections.map(s => s.position)) : -1;
    await supabase.from("sections").insert({
      title,
      course_id: courseId,
      position: maxPos + 1,
    });
    refreshBuilder();
  }

  async function deleteSection(sectionId: string) {
    if (!confirm("Supprimer cette section et tout son contenu ?")) return;
    await supabase.from("sections").delete().eq("id", sectionId);
    refreshBuilder();
  }

  async function addChapter(sectionId: string) {
    const title = prompt("Nom du chapitre:");
    if (!title) return;

    const sectionChapters = chapters.filter(c => c.section_id === sectionId);
    const maxPos = sectionChapters.length > 0 ? Math.max(...sectionChapters.map(c => c.position)) : -1;
    await supabase.from("chapters").insert({ section_id: sectionId, title, position: maxPos + 1 });
    refreshBuilder();
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm("Supprimer ce chapitre et tout son contenu ?")) return;
    await supabase.from("chapters").delete().eq("id", chapterId);
    refreshBuilder();
  }

  async function addSubChapter(chapterId: string) {
    const title = prompt("Nom du sous-chapitre:");
    if (!title) return;

    const chapterSubChapters = subchapters.filter(s => s.chapter_id === chapterId);
    const maxPos = chapterSubChapters.length > 0 ? Math.max(...chapterSubChapters.map(s => s.position)) : -1;
    const { data } = await supabase
      .from("subchapters")
      .insert({ chapter_id: chapterId, title, position: maxPos + 1, content: "" })
      .select()
      .single();

    if (data) {
      setSelectedSubChapter(data);
    }
    refreshBuilder();
  }

  async function deleteSubChapter(subchapterId: string) {
    if (!confirm("Supprimer ce sous-chapitre ?")) return;
    await supabase.from("subchapters").delete().eq("id", subchapterId);
    setSelectedSubChapter(null);
    refreshBuilder();
  }

  return (
    <div className="w-[400px] bg-[#1E1E1E] border-r border-white/10 overflow-y-auto">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Structure</h2>
          <button
            onClick={addSection}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-fuchsia-500 hover:opacity-90 transition text-sm flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Section
          </button>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm mb-4">Commencez à construire votre formation</p>
            <button
              onClick={addSection}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
            >
              Créer une section
            </button>
          </div>
        ) : (
          sections.map((section) => {
            const sectionChapters = chapters.filter(c => c.section_id === section.id);
            return (
              <div key={section.id} className="rounded-lg bg-black/30 p-3 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{section.title}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => addChapter(section.id)}
                      className="p-1 rounded hover:bg-white/10"
                      title="Ajouter un chapitre"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-1 rounded hover:bg-red-500/20"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="ml-4 space-y-1 mt-2">
                  {sectionChapters.map((chapter) => {
                    const chapterSubChapters = subchapters.filter(s => s.chapter_id === chapter.id);
                    return (
                      <div key={chapter.id} className="rounded bg-white/5 p-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-purple-400" />
                            <span className="text-sm">{chapter.title}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => addSubChapter(chapter.id)}
                              className="p-1 rounded hover:bg-white/10"
                              title="Ajouter un sous-chapitre"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteChapter(chapter.id)}
                              className="p-1 rounded hover:bg-red-500/20"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="ml-4 space-y-1 mt-1">
                          {chapterSubChapters.map((subchapter) => (
                            <button
                              key={subchapter.id}
                              onClick={() => setSelectedSubChapter(subchapter)}
                              className="w-full text-left rounded px-2 py-1.5 text-xs hover:bg-white/10 transition flex items-center gap-2"
                            >
                              <File className="h-3 w-3" />
                              {subchapter.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

