import { describe, expect, it } from "vitest";
import {
  assertBpfReadyForMiseEnPlace,
  evaluateFormationDossierTransition,
} from "@/lib/formation-dossier/transition";

const baseDossier = {
  bpf_funder_type: "entreprises_salaries" as const,
  subcontracting: "aucune" as const,
  partner_of_name: null as string | null,
  participantCount: 0,
  participantBpfStatuses: [] as string[],
};

describe("evaluateFormationDossierTransition", () => {
  it("autorise l'avancement d'une étape", () => {
    const result = evaluateFormationDossierTransition({
      currentStatus: "qualification",
      toStatus: "devis",
      dossier: baseDossier,
    });
    expect(result).toEqual({
      ok: true,
      from: "qualification",
      to: "devis",
      direction: "forward",
    });
  });

  it("refuse les sauts d'étape", () => {
    const result = evaluateFormationDossierTransition({
      currentStatus: "qualification",
      toStatus: "convention",
      dossier: baseDossier,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("skip_forbidden");
  });

  it("exige un motif pour un retour arrière", () => {
    const without = evaluateFormationDossierTransition({
      currentStatus: "devis",
      toStatus: "qualification",
      dossier: baseDossier,
    });
    expect(without.ok).toBe(false);
    if (!without.ok) expect(without.code).toBe("motif_required");

    const withMotif = evaluateFormationDossierTransition({
      currentStatus: "devis",
      toStatus: "qualification",
      motif: "Montant à revoir",
      dossier: baseDossier,
    });
    expect(withMotif).toMatchObject({ ok: true, direction: "backward" });
  });

  it("noop si même statut", () => {
    const result = evaluateFormationDossierTransition({
      currentStatus: "devis",
      toStatus: "devis",
      dossier: baseDossier,
    });
    expect(result).toMatchObject({ ok: true, direction: "noop" });
  });

  it("bloque Convention → Mise en place si BPF incomplets", () => {
    const result = evaluateFormationDossierTransition({
      currentStatus: "convention",
      toStatus: "mise_en_place",
      dossier: { ...baseDossier, bpf_funder_type: null },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("bpf_incomplete");
  });

  it("autorise Convention → Mise en place si BPF OK + convention signée", () => {
    const result = evaluateFormationDossierTransition({
      currentStatus: "convention",
      toStatus: "mise_en_place",
      dossier: { ...baseDossier, conventionSigned: true },
    });
    expect(result).toMatchObject({ ok: true, direction: "forward" });
  });

  it("bloque Convention → Mise en place sans signature", () => {
    const result = evaluateFormationDossierTransition({
      currentStatus: "convention",
      toStatus: "mise_en_place",
      dossier: { ...baseDossier, conventionSigned: false },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("convention_required");
  });

  it("exige un formateur avant Session", () => {
    const result = evaluateFormationDossierTransition({
      currentStatus: "mise_en_place",
      toStatus: "session",
      dossier: { ...baseDossier, conventionSigned: true, trainerAssigned: false },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("trainer_required");
  });

  it("bloque Fin → Clôturé sans facture", () => {
    const result = evaluateFormationDossierTransition({
      currentStatus: "fin",
      toStatus: "cloture",
      dossier: {
        ...baseDossier,
        invoiceValidated: false,
        qualiopiCoreReady: true,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("invoice_required");
  });

  it("force autres_of + OF donneur pour sous-traitance reçue", () => {
    expect(
      assertBpfReadyForMiseEnPlace({
        bpf_funder_type: "opco",
        subcontracting: "recue",
        partner_of_name: "OF Partenaire",
      })?.code,
    ).toBe("bpf_incomplete");

    expect(
      assertBpfReadyForMiseEnPlace({
        bpf_funder_type: "autres_of",
        subcontracting: "recue",
        partner_of_name: null,
      })?.code,
    ).toBe("subcontracting_incomplete");

    expect(
      assertBpfReadyForMiseEnPlace({
        bpf_funder_type: "autres_of",
        subcontracting: "recue",
        partner_of_name: "OF Alpha",
      }),
    ).toBeNull();
  });

  it("exige le statut BPF de chaque participant", () => {
    const result = evaluateFormationDossierTransition({
      currentStatus: "convention",
      toStatus: "mise_en_place",
      dossier: {
        ...baseDossier,
        participantCount: 2,
        participantBpfStatuses: ["salarie_prive", null],
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("bpf_incomplete");
  });
});
