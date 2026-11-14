import { redirect } from "next/navigation";
import { HandicapCaseDossier } from "@/components/handicap/handicap-case-dossier";
import { writeDisabilityAccessLog } from "@/lib/handicap/access-log";
import { loadDisabilityCaseDetail } from "@/lib/handicap/case-data";
import { resolveDisabilityCaseId } from "@/lib/handicap/resolve-case";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HandicapPersonnePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) redirect(gate.status === 401 ? "/login" : "/unauthorized");

  const service = getServiceRoleClient();
  if (!service) {
    return <p className="text-sm" style={{ color: T.muted }}>Service indisponible.</p>;
  }

  const { id: rawId } = await params;
  const caseId = await resolveDisabilityCaseId(service, rawId);
  if (!caseId) {
    return (
      <div className="space-y-3 rounded-[24px] border p-6" style={{ background: T.card, borderColor: T.border }}>
        <h1 className="text-[20px] font-extrabold">Dossier introuvable</h1>
        <p className="text-sm" style={{ color: T.muted }}>
          Aucun dossier disability_cases ne correspond à cet identifiant.
        </p>
        <a href="/handicap" className="inline-flex text-sm font-bold" style={{ color: T.accent }}>
          ← Retour à l&apos;accueil Handicap
        </a>
      </div>
    );
  }

  if (caseId !== rawId) {
    redirect(`/handicap/personnes/${caseId}`);
  }

  await writeDisabilityAccessLog(service, {
    caseId,
    actorId: gate.userId,
    action: "view_case",
  });

  const detail = await loadDisabilityCaseDetail(service, caseId);
  if (!detail) {
    return (
      <div className="space-y-3 rounded-[24px] border p-6" style={{ background: T.card, borderColor: T.border }}>
        <h1 className="text-[20px] font-extrabold">Chargement impossible</h1>
        <p className="text-sm" style={{ color: T.muted }}>
          Le dossier existe mais n&apos;a pas pu être chargé. Réessayez.
        </p>
        <a href="/handicap" className="inline-flex text-sm font-bold" style={{ color: T.accent }}>
          ← Retour à l&apos;accueil Handicap
        </a>
      </div>
    );
  }

  return (
    <HandicapCaseDossier
      initial={{ case: detail, isSuperAdmin: await isSuperAdmin() }}
    />
  );
}
