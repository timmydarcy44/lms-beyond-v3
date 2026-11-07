import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lot4DocumentKind } from "@/lib/formation-documents/constants";

/**
 * Modèles PDF du coffre Qualiopi utilisables tels quels (statiques).
 * La convention est générée dynamiquement (parties, formation, objectifs, dates, prix).
 */
export const VAULT_TEMPLATE_KINDS = ["reglement", "livret"] as const;
export type VaultTemplateKind = (typeof VAULT_TEMPLATE_KINDS)[number];

export function isVaultTemplateKind(kind: string): kind is VaultTemplateKind {
  return (VAULT_TEMPLATE_KINDS as readonly string[]).includes(kind);
}

/**
 * Télécharge le PDF modèle du coffre Qualiopi (session_id IS NULL).
 * Convention / CGV → null (génération jsPDF).
 */
export async function fetchVaultTemplatePdf(
  service: SupabaseClient,
  kind: VaultTemplateKind,
): Promise<{ buffer: Buffer; fileName: string | null; sourceUrl: string } | null> {
  const { data: row } = await service
    .from("crm_qualiopi_documents")
    .select("file_url, file_name")
    .eq("kind", kind)
    .is("session_id", null)
    .not("file_url", "is", null)
    .maybeSingle();

  const fileUrl = row?.file_url ? String(row.file_url).trim() : "";
  if (!fileUrl) return null;

  const res = await fetch(fileUrl);
  if (!res.ok) {
    console.warn(`[formation-docs/vault] fetch ${kind} failed: ${res.status}`);
    return null;
  }
  const ab = await res.arrayBuffer();
  if (!ab.byteLength) return null;

  return {
    buffer: Buffer.from(ab),
    fileName: row?.file_name ? String(row.file_name) : null,
    sourceUrl: fileUrl,
  };
}

export async function resolveFormationPdfBuffer(
  service: SupabaseClient,
  params: {
    kind: Lot4DocumentKind;
    buildFallback: () => Buffer;
  },
): Promise<{ buffer: Buffer; source: "vault" | "generated" }> {
  if (isVaultTemplateKind(params.kind)) {
    const vault = await fetchVaultTemplatePdf(service, params.kind);
    if (vault) return { buffer: vault.buffer, source: "vault" };
  }
  return { buffer: params.buildFallback(), source: "generated" };
}
