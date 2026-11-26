import { describe, expect, it } from "vitest";
import type { QualiopiIndicatorStatus } from "@/lib/qualiopi/status-types";
import { QUALIOPI_INDICATORS } from "@/lib/qualiopi/indicators";
import { QUALIOPI_INDICATOR_PLANS } from "@/lib/qualiopi/indicator-plans";

describe("indicateur preuve PDF — données", () => {
  it("chaque indicateur a un intitulé et un plan process", () => {
    for (const def of QUALIOPI_INDICATORS) {
      expect(def.shortTitle.length).toBeGreaterThan(3);
      expect(QUALIOPI_INDICATOR_PLANS[def.id]).toBeTruthy();
    }
  });

  it("forme un statut exportable", () => {
    const sample: QualiopiIndicatorStatus = {
      indicatorId: 19,
      criterionId: 4,
      shortTitle: "Ressources + suivi distanciel",
      status: "proven",
      proofs: [
        {
          label: "Suivi LMS distanciel",
          href: "/super/lms/suivi",
          updatedAt: "2026-11-25T00:00:00.000Z",
          counter: "12 séances",
        },
      ],
      nextAction: { label: "Voir la preuve", href: "/super/lms/suivi" },
      naJustification: null,
      helpWhere: "LMS + dossier",
      helpHow: "Ouvrir un relevé",
    };
    expect(sample.proofs[0]?.counter).toContain("séances");
  });
});
