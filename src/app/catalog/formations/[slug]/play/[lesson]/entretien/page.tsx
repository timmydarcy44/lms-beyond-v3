import { FormationInterviewPlayPage } from "@/components/apprenant/formation-interview-play-page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug, lesson } = await params;
  return (
    <FormationInterviewPlayPage category="formations" slug={slug} lessonId={lesson} />
  );
}
