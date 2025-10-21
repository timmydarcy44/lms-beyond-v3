import { redirect } from 'next/navigation';

export default async function AdminOrgPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  
  // Rediriger vers le dashboard de l'organisation
  redirect(`/admin/${orgSlug}/dashboard`);
}
