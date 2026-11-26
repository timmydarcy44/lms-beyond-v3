import { buildStoreZip, type ZipEntry } from "@/lib/formation-documents/zip-store";
import type { QualiopiComplianceSnapshot } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { mergeComplianceIntoCriteria } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { buildQualiopiGrillePdf } from "@/lib/qualiopi/grille-pdf";
import { buildReclamationsRegistrePdf } from "@/lib/qualiopi/reclamations-pdf";
import { QUALIOPI_STATUS_LABEL } from "@/lib/qualiopi/pdf-theme";

export type EvidencePackInput = {
  snapshot: QualiopiComplianceSnapshot;
  reclamations: Record<string, unknown>[];
  /** PDFs additionnels déjà générés (procédures, risques…). */
  extra?: ZipEntry[];
};

/**
 * Pack auditeur Qualiopi : grille RNQ + registres + manifeste indicateurs.
 * ZIP sans compression (zip-store).
 */
export async function buildQualiopiEvidencePack(input: EvidencePackInput): Promise<Buffer> {
  const stamp = new Date().toISOString().slice(0, 10);
  const criteria = mergeComplianceIntoCriteria(input.snapshot);

  const [grillePdf, reclamationsPdf] = await Promise.all([
    buildQualiopiGrillePdf(input.snapshot),
    buildReclamationsRegistrePdf(input.reclamations),
  ]);

  const manifest = {
    generatedAt: new Date().toISOString(),
    organism: "Byound",
    readinessPercent: input.snapshot.summary.readinessPercent,
    summary: input.snapshot.summary,
    runtime: input.snapshot.runtime,
    files: [
      "00-grille-rnq-v10.pdf",
      "01-registre-reclamations.pdf",
      "MANIFEST.json",
      ...(input.extra ?? []).map((e) => e.name),
    ],
    indicators: criteria.flatMap((c) =>
      c.indicators.map((ind) => {
        const status = ind.compliance?.status ?? "missing";
        return {
          id: ind.id,
          criterionId: c.id,
          criterionTitle: c.title,
          summary: ind.summary,
          status,
          statusLabel: QUALIOPI_STATUS_LABEL[status] ?? status,
          reason: ind.compliance?.reason ?? null,
          nextStep: ind.compliance?.nextStep ?? null,
          proofFiles:
            ind.id === 31
              ? ["01-registre-reclamations.pdf"]
              : ["00-grille-rnq-v10.pdf"],
        };
      }),
    ),
  };

  const entries: ZipEntry[] = [
    { name: `preuve-qualiopi-${stamp}/00-grille-rnq-v10.pdf`, data: grillePdf },
    { name: `preuve-qualiopi-${stamp}/01-registre-reclamations.pdf`, data: reclamationsPdf },
    {
      name: `preuve-qualiopi-${stamp}/MANIFEST.json`,
      data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
    },
  ];

  for (const extra of input.extra ?? []) {
    entries.push({
      name: `preuve-qualiopi-${stamp}/${extra.name.replace(/^\/+/, "")}`,
      data: extra.data,
    });
  }

  return buildStoreZip(entries);
}
