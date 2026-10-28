import type { NextConfig } from "next";
import { PROGRAMME_SLUG_REDIRECTS } from "./src/lib/jessica-contentin/programmes-catalog";

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
  env: {
    SKILLS_TRAINING_ENABLED: process.env.SKILLS_TRAINING_ENABLED ?? "false",
  },
  transpilePackages: ["@svg-maps/france.departments"],
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
        hostname: "zmcefidiiqqppowymoqb.supabase.co",
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
    const programmeRedirects = Object.entries(PROGRAMME_SLUG_REDIRECTS).flatMap(([oldSlug, newSlug]) => [
      {
        source: `/programmes/${oldSlug}`,
        destination: `/programmes/${newSlug}`,
        permanent: true,
      },
      {
        source: `/jessica-contentin/programmes/${oldSlug}`,
        destination: `/programmes/${newSlug}`,
        permanent: true,
      },
    ]);

    const trainingRedirects =
      process.env.SKILLS_TRAINING_ENABLED === "true"
        ? []
        : [
            {
              source: "/dashboard/apprenant/skills/entrainement",
              destination: "/dashboard/apprenant/skills",
              statusCode: 301,
            },
          ];

    return [
      ...trainingRedirects,
      ...programmeRedirects,
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
    const jessicaHosts = ["jessicacontentin.fr", "www.jessicacontentin.fr", "jessica-contentin.fr"] as const;
    const jessicaSeoRewrites = jessicaHosts.flatMap((host) => [
      {
        source: "/sitemap.xml",
        destination: "/jessica-contentin/sitemap.xml",
        has: [{ type: "host" as const, value: host }],
      },
      {
        source: "/robots.txt",
        destination: "/jessica-contentin/robots.txt",
        has: [{ type: "host" as const, value: host }],
      },
    ]);
    const careHosts = ["byoundcare.fr", "www.byoundcare.fr"] as const;
    const careSeoRewrites = careHosts.flatMap((host) => [
      {
        source: "/sitemap.xml",
        destination: "/care/sitemap.xml",
        has: [{ type: "host" as const, value: host }],
      },
      {
        source: "/robots.txt",
        destination: "/care/robots.txt",
        has: [{ type: "host" as const, value: host }],
      },
    ]);

    return [
      ...jessicaSeoRewrites,
      ...careSeoRewrites,
      {
        source: "/",
        destination: "/app-landing",
      },
      {
        source:
          "/:path((?!api|super|auth|onboarding|formations|catalog|catalogue|note-app|_next|app-landing|login|dashboard|g|favicon.ico|robots.txt|sitemap.xml|llms.txt|programmes|specialites|jessica-contentin|consultations|a-propos|orientation|postuler|edge-lab|edgeonline|parcours-guide|parcours|entreprises|tarifs|edge-online|online|ressources|blog|inscription|mon-compte|panier|confirmer|forgot-password|reset-password|register|prix|pricing|tarif|for-education|unauthorized|soft-skills|disc|idmc|q|care-test|byound-tests|p|pj|badgeclasses|wallet|mos|offres|ecole|tuteur|care|praticiens|reserver|reservation).*)",
        destination: "/app-landing/:path",
      },
    ];
  },
};

export default withPWA(nextConfig);
