import PathwaysList from '@/components/pathways/PathwaysList';

type PathwaysListPageProps = { params: Promise<{ org: string }> };

export default async function PathwaysListPage({ params }: PathwaysListPageProps) {
  const { org } = await params;
  return <PathwaysList org={org} />;
}

export type { PathwaysListPageProps };