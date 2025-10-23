import AdminShell from '@/components/admin/Shell';

export default async function OrgLayout({
  params,
  children,
}: {
  params: Promise<{ org: string }>;
  children: React.ReactNode;
}) {
  const { org } = await params;
  return <AdminShell orgSlug={org}>{children}</AdminShell>;
}
