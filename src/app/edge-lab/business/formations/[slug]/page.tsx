import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EdgeTrainingDetailPage } from "@/components/edge-site/business/edge-training-detail-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { fetchTrainingCourseBySlug } from "@/lib/training-courses/queries";
import { getServerClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getServerClient();
  const course = await fetchTrainingCourseBySlug(supabase, slug);
  if (!course) return { title: "Formation | EDGE Business" };
  return {
    title: `${course.title} | EDGE Business`,
    description: course.short_description ?? course.objectives?.join(" · "),
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const supabase = await getServerClient();
  const course = await fetchTrainingCourseBySlug(supabase, slug);
  if (!course) notFound();

  return (
    <EdgePremiumShell overlayNav={false}>
      <EdgeTrainingDetailPage course={course} />
    </EdgePremiumShell>
  );
}
