import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { default as RessourcesPage } from "@/app/jessica-contentin/ressources/page";

export default async function RessourcesRoute() {
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');

  // Si on est sur jessicacontentin.fr ou app.jessicacontentin.fr, servir la page ressources
  if ((tenant?.id === 'jessica-contentin' || tenant?.id === 'jessica-contentin-app') && !isLocalhost) {
    return <RessourcesPage />;
  }

  // Pour le développement local, servir la page
  if (isLocalhost) {
    return <RessourcesPage />;
  }

  // Pour les autres cas, 404
  redirect('/');
}

