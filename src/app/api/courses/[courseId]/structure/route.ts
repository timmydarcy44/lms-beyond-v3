import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";

type RouteParams = {
  params: Promise<{ courseId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const supabase = await getServerClient();
    
    if (!supabase || !courseId) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const snapshot = await getCourseBuilderSnapshot(courseId);
    
    if (!snapshot) {
      return NextResponse.json({ sections: [] });
    }

    // Transformer le snapshot en structure sections/chapitres/sous-chapitres
    const sections = snapshot.sections.map((section: any) => ({
      id: section.id || `section-${section.title}`,
      title: section.title,
      chapters: section.chapters?.map((chapter: any) => ({
        id: chapter.id || `chapter-${chapter.title}`,
        title: chapter.title,
        subchapters: chapter.subchapters?.map((subchapter: any) => ({
          id: subchapter.id || `subchapter-${subchapter.title}`,
          title: subchapter.title,
        })) || [],
      })) || [],
    }));

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("[api/courses/structure] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}





