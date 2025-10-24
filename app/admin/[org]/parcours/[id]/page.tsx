import PathwayEdit from '@/components/pathways/PathwayEdit';

type PathwayEditPageProps = { params: Promise<{ org: string; id: string }> };

export default async function PathwayEditPage({ params }: PathwayEditPageProps) {
  const { org, id } = await params;
  return <PathwayEdit org={org} id={id} />;
}

export type { PathwayEditPageProps };