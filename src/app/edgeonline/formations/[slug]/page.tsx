import { renderFormationDetailPage } from "@/app/catalog/formations/[slug]/page";
import { getEdgeOnlineHrefPrefixServer } from "@/lib/edge-online-public-path.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EdgeOnlineFormationDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const edgeOnlineHrefPrefix = await getEdgeOnlineHrefPrefixServer();
  return await renderFormationDetailPage({
    slug,
    orgSlug: "edgelab",
    edgeOnlineHrefPrefix,
  });
}

