import { SalarieCoursePlayer } from "@/components/salarie/salarie-course-player";

export const dynamic = "force-dynamic";

export default async function SalarieFormationLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lesson: string }>;
}) {
  const { slug, lesson } = await params;
  return <SalarieCoursePlayer slug={slug} lessonId={lesson} />;
}
