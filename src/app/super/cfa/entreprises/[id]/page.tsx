import { FicheEntreprise } from "./fiche-entreprise";

export const dynamic = "force-dynamic";

/** Toujours la fiche CFA éditable — ne pas rediriger vers /super/entreprises (vue lecture). */
export default async function CfaEntreprisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FicheEntreprise id={id} />;
}
