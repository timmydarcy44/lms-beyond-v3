import { redirect } from 'next/navigation';

export default async function AdminFormationsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  
  // Rediriger vers la page formations existante pour l'instant
  redirect('/admin/formations');
}
