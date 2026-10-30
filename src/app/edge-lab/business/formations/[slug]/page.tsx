import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EdgeTrainingDetailPage } from "@/components/edge-site/business/edge-training-detail-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { fetchTrainingCourseBySlug } from "@/lib/training-courses/queries";
import { TRAINING_FORMATION_BASE_PATH } from "@/lib/training-courses/types";
import { resolveGeneratedMetadata } from "@/lib/seo/resolve-generated";
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
  if (!course) return { title: "Formation | Byound Business" };
  const rythme = (course.formats ?? []).filter(Boolean).join(", ") || course.duration || "";
  const meta = await resolveGeneratedMetadata({
    type: "training",
    path: `${TRAINING_FORMATION_BASE_PATH}/${slug}`,
    vars: { formation: course.title, niveau: course.level ?? "", rythme },
    sourceDescription: course.meta_description ?? course.short_description ?? "",
  });
  return { ...meta, keywords: course.seo_tags ?? meta.keywords };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const supabase = await getServerClient();
  const course = await fetchTrainingCourseBySlug(supabase, slug);
  if (!course) notFound();

  const badgeMeta = await loadBadgeMeta(course.badge_class_id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.short_description ?? course.meta_description ?? undefined,
    provider: { "@type": "Organization", name: "Byound" },
  };
  return (
    <EdgePremiumShell overlayNav={false}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <EdgeTrainingDetailPage course={course} badgeMeta={badgeMeta} />
    </EdgePremiumShell>
  );
}
