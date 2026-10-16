import { FicheApprenant } from "./fiche-apprenant";

export const dynamic = "force-dynamic";

export default async function CfaApprenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FicheApprenant id={id} />;
}
