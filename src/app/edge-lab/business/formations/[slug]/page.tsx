import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EdgeTrainingDetailPage } from "@/components/edge-site/business/edge-training-detail-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { fetchTrainingCourseBySlug } from "@/lib/training-courses/queries";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

async function loadBadgeMeta(badgeClassId: string | null | undefined) {
  if (!badgeClassId) return null;
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) return null;
  const { data } = await supabase
    .from("open_badges")
    .select("name,title,image_url")
    .eq("id", badgeClassId)
    .maybeSingle();
  if (!data) return null;
  return {
    name: (data.name as string | null) ?? (data.title as string | null),
    imageUrl: data.image_url as string | null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getServerClient();
  const course = await fetchTrainingCourseBySlug(supabase, slug);
  if (!course) return { title: "Formation | EDGE Business" };
  return {
    title: `${course.title} | EDGE Business`,
    description: course.meta_description ?? course.short_description ?? undefined,
    keywords: course.seo_tags ?? undefined,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const supabase = await getServerClient();
  const course = await fetchTrainingCourseBySlug(supabase, slug);
  if (!course) notFound();

  const badgeMeta = await loadBadgeMeta(course.badge_class_id);

  return (
    <EdgePremiumShell overlayNav={false}>
      <EdgeTrainingDetailPage course={course} badgeMeta={badgeMeta} />
    </EdgePremiumShell>
  );
}
