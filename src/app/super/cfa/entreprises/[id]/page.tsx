import { redirect } from "next/navigation";
import { findCompanyBySource } from "@/lib/control/companies";
import { FicheEntreprise } from "./fiche-entreprise";

export const dynamic = "force-dynamic";

export default async function CfaEntreprisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const companyId = await findCompanyBySource("cfa_company", id);
  if (companyId) redirect(`/super/entreprises/${companyId}?partie=cfa`);
  return <FicheEntreprise id={id} />;
}
