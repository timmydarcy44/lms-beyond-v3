import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ConfidenceTestPage from "@/app/jessica-contentin/test-confiance-en-soi/page";

export default async function ConfidenceTestRoute() {
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');

  // Servir la page pour jessicacontentin.fr ou en localhost
  if (tenant?.id === 'jessica-contentin' || isLocalhost) {
    // La vérification d'accès se fera dans ConfidenceTestPage
    return <ConfidenceTestPage />;
  }

  // Pour les autres cas, rediriger vers la page d'accueil
  redirect('/');
}

