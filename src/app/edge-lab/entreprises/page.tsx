import { EntreprisesPageContent } from "@/components/edge-site/entreprises-page-content";

export async function generateMetadata() {
  const { loadSeoPage, toNextMetadata } = await import("@/lib/seo/byound-seo");
  return toNextMetadata(await loadSeoPage("/entreprises"));
}

export default function EntreprisesPage() {
  return <EntreprisesPageContent />;
}
