import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lot4DocumentKind } from "@/lib/formation-documents/constants";
import type { DossierDocContext } from "@/lib/formation-documents/context";

/**
 * Modèles PDF du coffre Qualiopi.
 * - reglement / livret : utilisés tels quels
 * - convention : modèle rempli dynamiquement (fill-convention-vault)
 */
export const VAULT_TEMPLATE_KINDS = ["convention", "reglement", "livret"] as const;
export type VaultTemplateKind = (typeof VAULT_TEMPLATE_KINDS)[number];

/** Modèles servi sans modification */
export const VAULT_STATIC_KINDS = ["reglement", "livret"] as const;

export function isVaultTemplateKind(kind: string): kind is VaultTemplateKind {
  return (VAULT_TEMPLATE_KINDS as readonly string[]).includes(kind);
}

export function isVaultStaticKind(kind: string): boolean {
  return (VAULT_STATIC_KINDS as readonly string[]).includes(kind);
}

/**
 * Télécharge le PDF modèle du coffre Qualiopi (session_id IS NULL).
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
    /** Requis pour remplir la convention coffre */
    ctx?: DossierDocContext | null;
  },
): Promise<{ buffer: Buffer; source: "vault" | "vault_filled" | "generated" }> {
  if (params.kind === "convention" && params.ctx) {
    const { fillVaultConventionPdf } = await import(
      "@/lib/formation-documents/fill-convention-vault"
    );
    const filled = await fillVaultConventionPdf(service, params.ctx);
    if (filled) return { buffer: filled, source: "vault_filled" };
  }

  if (isVaultStaticKind(params.kind)) {
    const vault = await fetchVaultTemplatePdf(service, params.kind as "reglement" | "livret");
    if (vault) return { buffer: vault.buffer, source: "vault" };
  }

  return { buffer: params.buildFallback(), source: "generated" };
}
