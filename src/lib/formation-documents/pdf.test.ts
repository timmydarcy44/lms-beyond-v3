import { describe, expect, it } from "vitest";
import { buildFormationDocumentPdf } from "@/lib/formation-documents/pdf";
import type { DossierDocContext } from "@/lib/formation-documents/context";

const ctx: DossierDocContext = {
  dossier: {
    id: "11111111-1111-4111-8111-111111111111",
    organization_id: "22222222-2222-4222-8222-222222222222",
    training_course_id: null,
    course_title: "Management bienveillant",
    amount_ht_cents: 120000,
    amount_tva_cents: 24000,
    amount_ttc_cents: 144000,
    contact_name: "Alice Martin",
    contact_email: "alice@example.com",
    contact_phone: null,
    modality_intra_inter: "intra",
    modality_presence: "presentiel",
    funding_type: "opco",
    session_id: null,
    status: "devis",
  },
  organization: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Acme SAS",
    siret: "12345678900012",
    siren: "123456789",
    client_code: "BY-100001",
    address_line: "12 rue des Lilas",
    address_zip: "75011",
    address_city: "Paris",
    address_country: "FR",
  },
  of: {
    legal_name: "Byound",
    nda: "1175xxxxxx75",
    siret: "90000000000012",
    siren: "900000000",
    vat_intra: "FRXX900000000",
    address_line: "1 rue Test",
    address_city: "Paris",
    address_zip: "75001",
    address_country: "FR",
  },
  course: {
    id: "c1",
    title: "Management bienveillant",
    short_description: "Développer une posture managériale bienveillante.",
    duration: "2 jours",
    level: "Intermédiaire",
    objectives: ["Adapter son style", "Conduire un entretien difficile"],
    skills: ["Écoute active", "Feedback"],
    prerequisites: "Manager d'équipe",
    audience: ["Managers"],
    program_structure: [],
  },
  slots: [{ slot_date: "2026-12-01", day_part: "matin", starts_at: null, ends_at: null, location_label: "Paris" }],
  participants: [
    {
      id: "p1",
      profile_id: "33333333-3333-4333-8333-333333333333",
      name: "Bob",
      email: "bob@example.com",
      job_title: "RH",
    },
  ],
  session: null,
};

describe("formation document pdf", () => {
  it("builds non-empty PDFs for Lot 4 kinds", () => {
    for (const kind of [
      "devis",
      "convention",
      "cgv",
      "reglement",
      "programme",
      "convocation",
      "livret",
      "certificat",
      "attestation",
    ] as const) {
      const buf = buildFormationDocumentPdf({
        ctx,
        kind,
        participantName: ["convocation", "certificat", "attestation"].includes(kind)
          ? "Bob"
          : null,
        attendedHalfDays: 1,
        plannedHalfDays: 1,
      });
      expect(buf.byteLength).toBeGreaterThan(500);
      expect(buf.subarray(0, 4).toString()).toBe("%PDF");
    }
  });
});
