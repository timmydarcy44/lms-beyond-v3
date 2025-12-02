import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { headers } from "next/headers";
import ConfidenceTestPage from "@/app/jessica-contentin/test-confiance-en-soi/page";

export default async function ConfidenceTestRoute() {
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');

  // Servir la page pour jessicacontentin.fr ou en localhost
  if (tenant?.id === 'jessica-contentin' || isLocalhost) {
    return <ConfidenceTestPage />;
  }

  // Pour les autres cas, servir quand même la page (fallback)
  return <ConfidenceTestPage />;
}

