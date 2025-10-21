import { redirect } from 'next/navigation';
import { resolveOrgFromSlugOrThrow } from '@/lib/org-server';

export default async function AdminOrgPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  
  try {
    // Valider l'organisation et le membership
    await resolveOrgFromSlugOrThrow(orgSlug);
    
    // Rediriger vers les formations par défaut
    redirect(`/admin/${orgSlug}/formations`);
  } catch (error) {
    // Si erreur (UNAUTH, ORG_NOT_FOUND, FORBIDDEN), rediriger vers /admin
    redirect('/admin');
  }
}
