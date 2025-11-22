import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { default as AProposPage } from "@/app/jessica-contentin/a-propos/page";

export default async function AProposRoute() {
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');

  // Si on est sur jessicacontentin.fr, servir la page
  if (tenant?.id === 'jessica-contentin' && !isLocalhost) {
    return <AProposPage />;
  }

  // Sinon, rediriger vers la route complète pour le développement
  if (isLocalhost) {
    redirect('/jessica-contentin/a-propos');
  }

  // Pour les autres cas, 404
  redirect('/');
}

