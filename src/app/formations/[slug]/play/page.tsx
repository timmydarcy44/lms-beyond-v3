import { notFound, redirect } from "next/navigation";

import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import { firstPlayableLessonId, lessonIdsFromBuilderSnapshot } from "@/lib/jessica-contentin/formation-access";
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

      firstLessonId = lessonIdsFromBuilderSnapshot(course?.builder_snapshot)[0] ?? null;
    }
  }

  if (!firstLessonId) {
    redirect(`/formations/${slug}`);
  }

  redirect(`/formations/${slug}/play/${firstLessonId}`);
}