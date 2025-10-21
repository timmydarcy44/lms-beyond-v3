// app/(dashboard)/admin/[org]/formations/[id]/preview/page.tsx
import { redirect } from 'next/navigation';
import { resolveOrgFromSlugOrThrow } from '@/lib/org-server';

export default async function FormationPreviewPage({
  params,
}: {
  params: Promise<{ org: string; id: string }>;
}) {
  const { org: orgSlug, id } = await params;
  
  try {
    // Valider l'organisation et le membership
    await resolveOrgFromSlugOrThrow(orgSlug);
    
    // Rediriger vers la prévisualisation générale avec contexte d'organisation
    redirect(`/admin/formations/${id}/preview?org=${orgSlug}`);
  } catch (error) {
    // Si erreur (UNAUTH, ORG_NOT_FOUND, FORBIDDEN), rediriger vers /admin
    redirect('/admin');
  }
}
