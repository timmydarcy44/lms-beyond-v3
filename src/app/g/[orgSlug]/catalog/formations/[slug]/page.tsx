import { renderFormationDetailPage } from "@/app/catalog/formations/[slug]/page";

export default async function GalaxyFormationDetailPage(props: { params: Promise<{ orgSlug: string; slug: string }> }) {
  const { orgSlug, slug } = await props.params;
  return await renderFormationDetailPage({ slug, orgSlug });
}

