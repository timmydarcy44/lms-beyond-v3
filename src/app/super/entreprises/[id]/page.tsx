import { notFound, redirect } from "next/navigation";
import { loadAccountDetail } from "@/lib/control/load";
import { loadCompanyDirectory } from "@/lib/control/companies";
import { CompanyFile } from "./company-file";

export const dynamic = "force-dynamic";

export default async function EntreprisePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ partie?: string; tab?: string }>;
}) {
  const { id } = await params;
  const { partie, tab } = await searchParams;
  const directory = await loadCompanyDirectory();
  const company = directory.items.find((item) => item.id === id);
  if (!company) notFound();

  /** La fiche CFA éditable vit sous /super/cfa/entreprises — pas la vue résumé lecture seule. */
  const wantCfa =
    partie === "cfa" || (company.roleCfa && !company.roleBusiness && partie !== "business");
  if (wantCfa && company.cfaCompanyId) {
    redirect(`/super/cfa/entreprises/${company.cfaCompanyId}`);
  }

  const detail = company.organizationId ? await loadAccountDetail(company.organizationId) : null;
  return <CompanyFile company={company} detail={detail} initialPart={partie} initialTab={tab} />;
}
