import { resolveOrgFromSlugOrThrow } from '@/lib/org-server';
import { redirect } from 'next/navigation';

export default async function AdminOrgDashboard({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  
  try {
    // Valider l'organisation et le membership
    await resolveOrgFromSlugOrThrow(org);
    
    // Rediriger vers les formations par défaut
    redirect(`/admin/${org}/formations`);
  } catch (error) {
    // Si erreur (UNAUTH, ORG_NOT_FOUND, FORBIDDEN), rediriger vers /admin
    redirect('/admin');
  }
}