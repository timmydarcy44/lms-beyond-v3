import { EdgePremiumHome } from "@/components/edge-site/premium/edge-premium-home";
import { loadSeoPage, toNextMetadata, webpageJsonLd } from "@/lib/seo/byound-seo";

export async function generateMetadata() {
  return toNextMetadata(await loadSeoPage("/"));
}

export default async function EdgeHomePage() {
  const seo = await loadSeoPage("/");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageJsonLd(seo)) }} />
      <EdgePremiumHome />
    </>
  );
}
