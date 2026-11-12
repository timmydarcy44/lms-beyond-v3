import { FicheEntreprise } from "./fiche-entreprise";

export const dynamic = "force-dynamic";

/** Toujours la fiche CFA éditable — ne pas rediriger vers /super/entreprises (vue lecture). */
export default async function CfaEntreprisePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const raw = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value) qs.set(key, value);
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0]);
  }
  return <FicheEntreprise id={id} listQuery={qs.toString()} />;
}
