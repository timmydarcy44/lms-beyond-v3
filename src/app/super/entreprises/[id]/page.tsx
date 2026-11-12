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

  /** Toujours la fiche CFA éditable — jamais la vue résumé « lecture seule ». */
  if (company.cfaCompanyId && partie !== "business") {
    redirect(`/super/cfa/entreprises/${company.cfaCompanyId}`);
  }
  if (company.roleCfa && !company.roleBusiness && company.cfaCompanyId) {
    redirect(`/super/cfa/entreprises/${company.cfaCompanyId}`);
  }

  const detail = company.organizationId ? await loadAccountDetail(company.organizationId) : null;
  return <CompanyFile company={company} detail={detail} initialPart={partie} initialTab={tab} />;
}
