"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { BuilderProvider, useBuilder } from "@/contexts/BuilderContext";
import BuilderPanel from "@/components/builder/BuilderPanel";
import EditorPanel from "@/components/builder/EditorPanel";

type Section = { id: string; title: string; position: number };
type Chapter = { id: string; section_id: string; title: string; position: number };
type SubChapter = { id: string; chapter_id: string; title: string; content: string; position: number };
type Course = { id: string; title: string; description: string };

function BuilderContent() {
  const { id } = useParams<{ id: string }>();
  const { setRefreshBuilder } = useBuilder();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [subchapters, setSubchapters] = useState<SubChapter[]>([]);

  async function loadAll() {
    setLoading(true);
    try {
      // Charger le cours
      const { data: courseData } = await supabase
        .from("courses")
        .select("id, title, description")
        .eq("id", id)
        .single();
      
      setCourse(courseData);

      // Charger sections
      const { data: sectionsData } = await supabase
        .from("sections")
        .select("*")
        .eq("course_id", id)
        .order("position");

      // Charger chapitres
      const sectionIds = sectionsData?.map(s => s.id) || [];
      const { data: chaptersData } = await supabase
        .from("chapters")
        .select("*")
        .in("section_id", sectionIds)
        .order("position");

      // Charger sous-chapitres
      const chapterIds = chaptersData?.map(c => c.id) || [];
      const { data: subchaptersData } = await supabase
        .from("subchapters")
        .select("*")
        .in("chapter_id", chapterIds)
        .order("position");

      setSections(sectionsData || []);
      setChapters(chaptersData || []);
      setSubchapters(subchaptersData || []);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    setRefreshBuilder(() => loadAll);
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen bg-[#252525] text-white flex items-center justify-center">
        <div className="text-xl">Chargement…</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-screen bg-[#252525] text-white flex items-center justify-center">
        <div className="text-xl">Formation non trouvée</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#252525] text-white flex">
      <BuilderPanel courseId={id} sections={sections} chapters={chapters} subchapters={subchapters} />
      <EditorPanel />
    </div>
  );
}

export default function BuilderPage() {
  return (
    <BuilderProvider>
      <BuilderContent />
    </BuilderProvider>
  );
}
