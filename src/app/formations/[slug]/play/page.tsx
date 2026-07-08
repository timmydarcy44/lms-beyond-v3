import { notFound, redirect } from "next/navigation";

import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import { firstPlayableLessonId } from "@/lib/jessica-contentin/formation-access";
import { getServerClient } from "@/lib/supabase/server";

export default async function FormationPlayIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getLearnerContentDetail("formations", slug);
  if (!data) notFound();

  let firstLessonId = firstPlayableLessonId(data.detail.modules);

  if (!firstLessonId) {
    const supabase = await getServerClient();
    if (supabase) {
      const { data: course } = await supabase
        .from("courses")
        .select("builder_snapshot")
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();

      const snapshot =
        typeof course?.builder_snapshot === "string"
          ? JSON.parse(course.builder_snapshot)
          : course?.builder_snapshot;

      for (const section of snapshot?.sections ?? []) {
        for (const chapter of section?.chapters ?? []) {
          if (chapter?.id) {
            firstLessonId = String(chapter.id);
            break;
          }
          for (const sub of chapter?.subchapters ?? []) {
            if (sub?.id) {
              firstLessonId = String(sub.id);
              break;
            }
          }
          if (firstLessonId) break;
        }
        if (firstLessonId) break;
      }
    }
  }

  if (!firstLessonId) {
    redirect(`/formations/${slug}`);
  }

  redirect(`/formations/${slug}/play/${firstLessonId}`);
}
