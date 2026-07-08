import { notFound, redirect } from "next/navigation";

import { getLearnerContentDetail } from "@/lib/queries/apprenant";
import { firstPlayableLessonId } from "@/lib/jessica-contentin/formation-access";

export default async function GalaxyFormationPlayIndexPage({
  params,
}: {
  params: Promise<{ orgSlug: string; slug: string }>;
}) {
  const { orgSlug, slug } = await params;
  const data = await getLearnerContentDetail("formations", slug);
  if (!data) notFound();

  const firstLessonId = firstPlayableLessonId(data.detail.modules);
  if (!firstLessonId) {
    redirect(`/g/${orgSlug}/catalog/formations/${slug}`);
  }

  redirect(`/g/${orgSlug}/catalog/formations/${slug}/play/${firstLessonId}`);
}
