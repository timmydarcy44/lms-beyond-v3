import type { Metadata } from "next";
import type { ReactNode } from "react";

const EDGE_ICON = "/icons/edge/edge-icon-E.png?v=2";
const EDGE_APPLE_ICON = "/icons/edge/apple-touch-icon-180.png?v=2";

export const metadata: Metadata = {
  title: "Byound — Vous savez où vous voulez aller",
  description:
    "La plupart des gens apprennent au hasard. Byound construit le chemin le plus rapide pour atteindre votre objectif professionnel.",
  applicationName: "Byound",
  manifest: "/manifest-edge.json",
  icons: {
    icon: [{ url: EDGE_ICON, type: "image/png", sizes: "1024x1024" }],
    apple: [{ url: EDGE_APPLE_ICON, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Byound",
  },
  other: {
    "apple-mobile-web-app-title": "Byound",
  },
  openGraph: {
    title: "Vous savez où vous voulez aller.",
    description:
      "Byound construit le chemin le plus rapide pour atteindre votre objectif professionnel.",
    url: "https://edgebs.fr/particuliers",
    siteName: "Byound",
  },
};

export default function ParticuliersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black">
      <main>{children}</main>
    </div>
  );
}
