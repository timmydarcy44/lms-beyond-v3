import { redirect } from "next/navigation";

console.log("=> TENTATIVE D'ACCÈS ROUTE DYNAMIQUE");

export default async function OrganizationRootPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Cette page est le pivot qui empêche la 404
  redirect(`/super/organisations/${id}/manage`);
}

