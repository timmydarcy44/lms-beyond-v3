import { EdgeLabShell } from "@/components/edge-site/edge-lab-shell";
import { organizationJsonLd } from "@/lib/seo/byound-seo";

export default function EdgeLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <EdgeLabShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      {children}
    </EdgeLabShell>
  );
}
