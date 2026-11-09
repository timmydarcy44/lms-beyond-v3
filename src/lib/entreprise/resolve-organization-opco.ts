import type { SupabaseClient } from "@supabase/supabase-js";
import { lookupOpcoForSiret, type OpcoSource } from "@/lib/cfa/lookup-opco";

export type OrganizationOpco = {
  opco_name: string | null;
  opco_source: OpcoSource | null;
};

/** Résout l’OPCO via SIRET (CFADock → IDCC → NAF) et le mémorise sur l’organisation. */
export async function resolveAndStoreOrganizationOpco(
  service: SupabaseClient,
  organizationId: string,
  siretRaw: string | null | undefined,
  opts?: { force?: boolean; existingName?: string | null; existingSource?: string | null },
): Promise<OrganizationOpco> {
  const siret = String(siretRaw ?? "").replace(/\D/g, "");
  const existingName = String(opts?.existingName ?? "").trim() || null;
  const existingSource = (String(opts?.existingSource ?? "").trim() || null) as OpcoSource | null;

  // Saisie manuelle : on ne réécrit pas sauf force (changement de SIRET)
  if (!opts?.force && existingName && existingSource === "manual") {
    return { opco_name: existingName, opco_source: "manual" };
  }

  // Cache fiable (CFADock / IDCC) — évite un appel réseau à chaque demande
  if (!opts?.force && existingName && (existingSource === "cfadock" || existingSource === "idcc")) {
    return { opco_name: existingName, opco_source: existingSource };
  }

  if (siret.length !== 14) {
    return { opco_name: existingName, opco_source: existingSource };
  }

  try {
    const found = await lookupOpcoForSiret(siret);
    const opcoName = String(found.opco ?? found.opcoName ?? "").trim() || null;
    const opcoSource = (found.source as OpcoSource | null) ?? null;
    if (!opcoName) {
      return { opco_name: existingName, opco_source: existingSource };
    }

    const { error } = await service
      .from("organizations")
      .update({
        opco_name: opcoName,
        opco_source: opcoSource,
      })
      .eq("id", organizationId);

    if (error && /opco_/i.test(error.message)) {
      console.warn("[resolve-organization-opco] columns missing:", error.message);
    } else if (error) {
      console.warn("[resolve-organization-opco] update:", error.message);
    }

    return { opco_name: opcoName, opco_source: opcoSource };
  } catch (err) {
    console.warn(
      "[resolve-organization-opco]",
      err instanceof Error ? err.message : err,
    );
    return { opco_name: existingName, opco_source: existingSource };
  }
}
