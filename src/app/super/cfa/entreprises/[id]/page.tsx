import { FicheEntreprise } from "./fiche-entreprise";

export const dynamic = "force-dynamic";

export default async function CfaEntreprisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FicheEntreprise id={id} />;
}
