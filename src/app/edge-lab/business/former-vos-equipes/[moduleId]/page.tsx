import { redirect } from "next/navigation";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";

type Props = { params: Promise<{ moduleId: string }> };

/** Redirection legacy → /business/formations/[slug] */
export default async function Page({ params }: Props) {
  const { moduleId } = await params;
  redirect(edgeMarketingHref(`/business/formations/${moduleId}`));
}
