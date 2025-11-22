import { getTenantFromHeaders } from "@/lib/tenant/detection-server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { default as SpecialiteSlugPage } from "@/app/jessica-contentin/specialites/[slug]/page";

export default async function SpecialiteSlugRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const tenant = await getTenantFromHeaders();
  const headersList = await headers();
  const hostname = headersList.get('host') || '';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
  const { slug } = await params;

  // Si on est sur jessicacontentin.fr, servir la page
  if (tenant?.id === 'jessica-contentin' && !isLocalhost) {
    return <SpecialiteSlugPage params={Promise.resolve({ slug })} />;
  }

  // Sinon, rediriger vers la route complète pour le développement
  if (isLocalhost) {
    redirect(`/jessica-contentin/specialites/${slug}`);
  }

  // Pour les autres cas, 404
  redirect('/');
}

