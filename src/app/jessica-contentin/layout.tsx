import type { Metadata } from "next";
import { JessicaContentinHeader } from "@/components/jessica-contentin/header";
import { JessicaContentinFooter } from "@/components/jessica-contentin/footer";
import { FloatingCartBadge } from "@/components/jessica-contentin/floating-cart-badge";
import { generateSEOMetadata, STRUCTURED_DATA } from "@/lib/seo/jessica-contentin-seo";

// Métadonnées par défaut (seront surchargées par chaque page)
export const metadata: Metadata = {
  ...generateSEOMetadata("home"),
  metadataBase: new URL("https://jessicacontentin.fr"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export function JessicaContentinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <JessicaContentinHeader />
      <main className="pt-0">{children}</main>
      <JessicaContentinFooter />
      <FloatingCartBadge />
    </div>
  );
}

export default JessicaContentinLayout;

