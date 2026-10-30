import { CareHomePage } from "@/components/care/care-home-page";
import { loadCareDirectoryPreview } from "@/lib/care/load-directory";
import { careHomeJsonLd, carePageMetadata, CARE_SEO } from "@/lib/care/seo";

export const metadata = carePageMetadata({
  title: CARE_SEO.homeTitle,
  description: CARE_SEO.homeDescription,
  internalPath: "/care",
});

export default async function CareHome() {
  const practitioners = await loadCareDirectoryPreview(2);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(careHomeJsonLd()) }} />
      <CareHomePage practitioners={practitioners} />
    </>
  );
}
