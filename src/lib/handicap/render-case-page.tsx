import { HandicapCaseDossier } from "@/components/handicap/handicap-case-dossier";
import { writeDisabilityAccessLog } from "@/lib/handicap/access-log";
import { loadDisabilityCaseDetail } from "@/lib/handicap/case-data";
import { resolveDisabilityCaseId } from "@/lib/handicap/resolve-case";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function renderDisabilityCasePage(input: {
  service: SupabaseClient;
  rawId: string;
  actorId: string;
}) {
  const caseId = await resolveDisabilityCaseId(input.service, input.rawId);
  if (!caseId) {
    return (
      <div
        className="space-y-3 rounded-[24px] border p-6"
        style={{ background: T.card, borderColor: T.border }}
      >
        <h1 className="text-[20px] font-extrabold">Dossier introuvable</h1>
        <p className="text-sm" style={{ color: T.muted }}>
          Aucun dossier ne correspond à cet identifiant.
        </p>
        <a href="/handicap" className="inline-flex text-sm font-bold" style={{ color: T.accent }}>
          ← Retour à l&apos;accueil Handicap
        </a>
      </div>
    );
  }

  await writeDisabilityAccessLog(input.service, {
    caseId,
    actorId: input.actorId,
    action: "view_case",
  });

  const detail = await loadDisabilityCaseDetail(input.service, caseId);
  if (!detail) {
    return (
      <div
        className="space-y-3 rounded-[24px] border p-6"
        style={{ background: T.card, borderColor: T.border }}
      >
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
