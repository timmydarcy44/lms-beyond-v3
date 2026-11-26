/** Attendus dossier formateur / expert — matching folder + libellé. */

export type ExpectedDocSlot = {
  id: "cv" | "contrat" | "diplome" | "attestation" | "admin";
  label: string;
  folders: string[];
  nameTest: RegExp;
  /** Non exigé pour intervenant interne (salarié / dirigeant). */
  skipForInternal?: boolean;
};

export const EXPECTED_EXPERT_DOCS: ExpectedDocSlot[] = [
  { id: "cv", label: "CV", folders: ["cv"], nameTest: /\bcv\b|curriculum/i },
  {
    id: "contrat",
    label: "Contrat de prestation",
    folders: ["contrat"],
    nameTest: /contrat|prestation|sous[- ]?trait/i,
    skipForInternal: true,
  },
  { id: "diplome", label: "Diplômes", folders: ["diplome"], nameTest: /dipl/i },
  {
    id: "attestation",
    label: "Attestations",
    folders: ["attestation"],
    nameTest: /attest/i,
  },
  {
    id: "admin",
    label: "Pièces administratives",
    folders: ["admin"],
    nameTest: /admin|siret|kbis|assurance|rc\b|pi[eè]ce/i,
    skipForInternal: true,
  },
];

export const INTERNAL_DOC_NA_LABEL = "Non applicable — intervenant interne";

export function isInternalIntervenant(employmentStatus: string | null | undefined): boolean {
  const s = String(employmentStatus ?? "").trim().toLowerCase();
  return s === "salarie" || s === "salarié" || s === "interne" || s === "dirigeant";
}

export function docMatchesExpectedSlot(
  doc: { label?: unknown; name?: unknown; folder?: unknown; _type?: unknown },
  slot: ExpectedDocSlot,
): boolean {
  const folder = String(doc.folder ?? "").toLowerCase().trim();
  if (folder && slot.folders.includes(folder)) return true;
  if (slot.id === "cv" && String(doc._type ?? "") === "edge_cv") return true;
  const name = String(doc.label ?? doc.name ?? "");
  return slot.nameTest.test(name);
}

export type ExpectedDocStatus = "ok" | "missing" | "na";

export function expectedDocStatus(
  documents: Array<{ label?: unknown; name?: unknown; folder?: unknown; _type?: unknown }>,
  slot: ExpectedDocSlot,
  opts?: { employmentStatus?: string | null },
): ExpectedDocStatus {
  if (opts && isInternalIntervenant(opts.employmentStatus) && slot.skipForInternal) {
    return "na";
  }
  return documents.some((doc) => docMatchesExpectedSlot(doc, slot)) ? "ok" : "missing";
}

export function summarizeExpectedDocs(
  documents: Array<{ label?: unknown; name?: unknown; folder?: unknown; _type?: unknown }>,
  opts?: { employmentStatus?: string | null },
): { received: number; total: number; missingLabels: string[] } {
  const missingLabels: string[] = [];
  let received = 0;
  let total = 0;
  for (const slot of EXPECTED_EXPERT_DOCS) {
    const status = expectedDocStatus(documents, slot, opts);
    if (status === "na") continue;
    total += 1;
    if (status === "ok") received += 1;
    else missingLabels.push(slot.label);
  }
  return { received, total, missingLabels };
}
