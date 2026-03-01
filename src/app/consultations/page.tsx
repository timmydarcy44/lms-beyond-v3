import type { Metadata } from "next";
import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { generateSEOMetadata } from "@/lib/seo/jessica-contentin-seo";
import { default as ConsultationsPage } from "@/app/jessica-contentin/consultations/page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const isLocalhost = hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");

  if ((tenant?.id === "jessica-contentin" && !isLocalhost) || isLocalhost) {
    return {
      ...generateSEOMetadata("consultations"),
      metadataBase: new URL("https://jessicacontentin.fr"),
    };
  }

  return {};
}

export default async function ConsultationsRoute() {
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');

  // Si on est sur jessicacontentin.fr, servir la page
  if (tenant?.id === 'jessica-contentin' && !isLocalhost) {
    return <ConsultationsPage />;
  }

  // Sinon, rediriger vers la route complète pour le développement
  if (isLocalhost) {
    redirect('/jessica-contentin/consultations');
  }

  // Pour les autres cas, 404
  redirect('/');
}

