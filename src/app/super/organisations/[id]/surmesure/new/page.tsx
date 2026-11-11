import { notFound } from "next/navigation";
import { SurMesureNewClient } from "@/components/control/account-surmesure-new-client";
import { SurMesureShell } from "@/components/control/account-surmesure-shell";
import { loadAccountDetail } from "@/lib/control/load";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { loadSurMesureOrgContext } from "@/lib/training-courses/surmesure-org-context";

export const dynamic = "force-dynamic";

export default async function SurMesureNewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await loadAccountDetail(id);
  if (!detail.account) notFound();

  const service = getServiceRoleClient();
  const company = service
    ? await loadSurMesureOrgContext(service, id)
    : {
        name: detail.account.name,
        siret: detail.account.siret,
        sector: null,
        naf: null,
        city: detail.account.addressCity,
      };

  return (
    <SurMesureShell orgId={id} orgName={detail.account.name} crumb="Nouvelle formation">
      <header className="mb-6">
        <h1 className="text-[32px] font-extrabold tracking-[-1px]">Nouvelle formation Sur-mesure</h1>
        <p className="mt-2 text-sm text-[#8A93AE]">
          Saisie manuelle avec le client, ou pré-remplissage AI contextualisé (SIRET / secteur).
        </p>
      </header>
      <SurMesureNewClient organizationId={id} company={company} />
    </SurMesureShell>
  );
}
