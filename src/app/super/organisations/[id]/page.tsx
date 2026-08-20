import { redirect } from "next/navigation";

export default async function OrganizationRootPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/super/organisations/${id}/manage`);
}
