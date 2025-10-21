// app/(dashboard)/admin/[org]/formations/new/page.tsx
import { redirect } from 'next/navigation';
import { resolveOrgFromSlugOrThrow } from '@/lib/org-server';

export default async function NewFormationPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  
  try {
    // Valider l'organisation et le membership
    await resolveOrgFromSlugOrThrow(orgSlug);
    
    // Rediriger vers la page de création générale avec contexte d'organisation
    redirect(`/admin/formations/new?org=${orgSlug}`);
  } catch (error) {
    // Si erreur (UNAUTH, ORG_NOT_FOUND, FORBIDDEN), rediriger vers /admin
    redirect('/admin');
  }
}
