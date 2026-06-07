import type { NextConfig } from "next";

// next-pwa (CommonJS) — en dev, service worker désactivé pour éviter le cache agressif
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "canvas"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.in",
      },
      {
        protocol: "https",
        hostname: "media.istockphoto.com",
      },
      {
        protocol: "https",
        hostname: "www.istockphoto.com",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    qualities: [75, 80, 85],
  },
  async redirects() {
    return [
      {
        source: "/app-landing/:path*",
        destination: "/:path*",
        permanent: false,
      },
      {
        source: "/badges/:badgeClassId/criteria",
        destination: "/badgeclasses/:badgeClassId/criteria",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/app-landing",
      },
      {
        source:
          "/:path((?!api|super|auth|onboarding|formations|catalog|catalogue|note-app|_next|app-landing|login|dashboard|g|favicon.ico|robots.txt|sitemap.xml|programmes|specialites|jessica-contentin|consultations|a-propos|orientation|postuler|edge-lab|parcours-guide|parcours|entreprises|edge-online|online|ressources|blog|inscription|mon-compte|panier|confirmer|forgot-password|reset-password|register|prix|pricing|tarif|for-education|unauthorized|soft-skills|p|pj|badgeclasses|wallet).*)",
        destination: "/app-landing/:path",
      },
    ];
  },
};

export default withPWA(nextConfig);
