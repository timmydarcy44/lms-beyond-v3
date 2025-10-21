import { redirect } from 'next/navigation';

export default async function AdminUtilisateursPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  
  // Rediriger vers la page utilisateurs existante pour l'instant
  redirect('/admin/utilisateurs');
}
