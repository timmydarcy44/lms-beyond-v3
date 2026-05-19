import { FormationInterviewPlayPage } from "@/components/apprenant/formation-interview-play-page";

export default async function Page({
  params,
}: {
  params: Promise<{ category: string; slug: string; lesson: string }>;
}) {
  const { category, slug, lesson } = await params;
  return <FormationInterviewPlayPage category={category} slug={slug} lessonId={lesson} />;
}
