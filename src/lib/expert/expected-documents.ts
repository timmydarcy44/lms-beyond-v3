/** Attendus dossier formateur / expert — matching folder + libellé. */

export type ExpectedDocSlot = {
  id: "cv" | "contrat" | "diplome" | "attestation" | "admin";
  label: string;
  folders: string[];
  nameTest: RegExp;
};

export const EXPECTED_EXPERT_DOCS: ExpectedDocSlot[] = [
  { id: "cv", label: "CV", folders: ["cv"], nameTest: /\bcv\b|curriculum/i },
  {
    id: "contrat",
    label: "Contrat de prestation",
    folders: ["contrat"],
    nameTest: /contrat|prestation|sous[- ]?trait/i,
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
  },
];

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

export function summarizeExpectedDocs(
  documents: Array<{ label?: unknown; name?: unknown; folder?: unknown; _type?: unknown }>,
): { received: number; total: number; missingLabels: string[] } {
  const missingLabels: string[] = [];
  let received = 0;
  for (const slot of EXPECTED_EXPERT_DOCS) {
    const found = documents.some((doc) => docMatchesExpectedSlot(doc, slot));
    if (found) received += 1;
    else missingLabels.push(slot.label);
  }
  return { received, total: EXPECTED_EXPERT_DOCS.length, missingLabels };
}
