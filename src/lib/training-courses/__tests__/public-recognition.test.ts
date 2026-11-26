import { describe, expect, it } from "vitest";
import { buildPublicRecognition } from "@/lib/training-courses/public-recognition";
import { resolvePublicFinancingCopy, QUALIOPI_FINANCING_DEFAULT } from "@/lib/qualiopi/public-copy";

describe("buildPublicRecognition", () => {
  it("évite le doublon Attestation — Attestation…", () => {
    const r = buildPublicRecognition({
      recognition_type: "attestation_fin",
      recognition_detail:
        "Attestation de fin de formation délivrée après validation du quiz final.",
      badge_name: null,
      badge_class_id: null,
    });
    expect(r.text).toBe(
      "Attestation de fin de formation délivrée après validation du quiz final.",
    );
    expect(r.hasOpenBadge).toBe(false);
    expect(r.badgeLabel).toBeNull();
  });

  it("ajoute Open Badge quand la fiche en délivre un", () => {
    const r = buildPublicRecognition({
      recognition_type: "attestation_fin",
      recognition_detail:
        "Attestation de fin de formation délivrée après validation du quiz final.",
      badge_name: "Open Badge Byound",
      badge_class_id: "abc",
    });
    expect(r.text).toContain("Open Badge Byound");
    expect(r.text.toLowerCase().split("attestation de fin de formation").length - 1).toBe(1);
    expect(r.hasOpenBadge).toBe(true);
    expect(r.badgeLabel).toBe("Open Badge Byound");
  });

  it("reconnaît le type open_badge sans champ badge", () => {
    const r = buildPublicRecognition({
      recognition_type: "open_badge",
      recognition_detail:
        "Open Badge Byound « Négociation », délivré après validation. Attestation de fin de formation remise à chaque participant.",
      badge_name: null,
      badge_class_id: null,
    });
    expect(r.hasOpenBadge).toBe(true);
    expect(r.badgeLabel).toBe("Open Badge Byound");
    expect(r.text.toLowerCase().startsWith("open badge")).toBe(true);
  });
});

describe("resolvePublicFinancingCopy", () => {
  it("masque OPCO/Qualiopi par défaut", () => {
    expect(
      resolvePublicFinancingCopy(
        "Financement par l'entreprise cliente. Prise en charge OPCO possible après obtention de la certification Qualiopi (en cours).",
      ),
    ).toBe(QUALIOPI_FINANCING_DEFAULT);
  });
});
