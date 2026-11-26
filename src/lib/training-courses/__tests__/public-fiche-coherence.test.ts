import { describe, expect, it } from "vitest";
import {
  resolvePublicAccessDelaysCopy,
  resolveSuccessRateMethod,
  sanitizePublicBrandCopy,
  QUALIOPI_FINANCING_FAQ_ANSWER,
  QUALIOPI_ACCESS_DELAYS_ELEARNING,
  QUALIOPI_ACCESS_DELAYS_INTRA,
} from "@/lib/qualiopi/public-copy";
import { formatPublicTariffFaqAnswer } from "@/lib/training-courses/qualiopi-fiche";
import { resolvePublicFaqItems, buildQualityIndicators } from "@/lib/training-courses/qualiopi-content";
import { buildPublicRecognition } from "@/lib/training-courses/public-recognition";

describe("cohérence fiches publiques", () => {
  it("délais d'accès : une seule ligne selon le format", () => {
    expect(resolvePublicAccessDelaysCopy("elearning_asynchrone")).toBe(
      QUALIOPI_ACCESS_DELAYS_ELEARNING,
    );
    expect(resolvePublicAccessDelaysCopy("presentiel")).toBe(QUALIOPI_ACCESS_DELAYS_INTRA);
    expect(resolvePublicAccessDelaysCopy("mixte")).toBe(QUALIOPI_ACCESS_DELAYS_INTRA);
    expect(resolvePublicAccessDelaysCopy("distanciel_synchrone")).toBe(
      QUALIOPI_ACCESS_DELAYS_INTRA,
    );
  });

  it("FAQ tarif sur devis / avec prix", () => {
    expect(
      formatPublicTariffFaqAnswer({
        price_on_quote: true,
        intra_price: null,
        max_intra_participants: 12,
      }),
    ).toContain("Tarif sur devis");
    expect(
      formatPublicTariffFaqAnswer({
        price_on_quote: false,
        intra_price: 3000,
        max_intra_participants: 12,
      }),
    ).toBe("3 000 € HT par groupe (intra, jusqu'à 12 participants).");
  });

  it("FAQ publique réécrit tarif / prise en charge et Beyond", () => {
    const faq = resolvePublicFaqItems(
      {
        price_on_quote: true,
        intra_price: null,
        max_intra_participants: 12,
      } as never,
      [
        {
          q: "Quel est le tarif ?",
          a: "L'accès est facturé par collaborateur, en complément de l'abonnement Beyond.",
        },
        {
          q: "La formation peut-elle être prise en charge ?",
          a: "Oui via OPCO.",
        },
        {
          q: "Comment le module est-il déployé ?",
          a: "Depuis l'espace Beyond.",
        },
      ],
    );
    expect(faq[0].a).toContain("Tarif sur devis");
    expect(faq[0].a).not.toMatch(/collaborateur|Beyond/i);
    expect(faq[1].a).toBe(QUALIOPI_FINANCING_FAQ_ANSWER);
    expect(faq[2].a).toContain("Byound");
    expect(faq[2].a).not.toMatch(/\bBeyond\b/);
  });

  it("taux de réussite : Open Badge seulement si la fiche en délivre un", () => {
    expect(resolveSuccessRateMethod(false)).not.toMatch(/Open Badge/i);
    expect(resolveSuccessRateMethod(true)).toMatch(/Open Badge/i);
    const without = buildQualityIndicators({ hasOpenBadge: false });
    const withBadge = buildQualityIndicators({ hasOpenBadge: true });
    expect(without.indicators.find((i) => i.key === "success")!.method).not.toMatch(
      /Open Badge/i,
    );
    expect(withBadge.indicators.find((i) => i.key === "success")!.method).toMatch(
      /Open Badge/i,
    );
  });

  it("reconnaissance sans Open Badge si attestation seule", () => {
    const r = buildPublicRecognition({
      recognition_type: "attestation_fin",
      recognition_detail:
        "Attestation de fin de formation délivrée après validation du quiz final.",
      badge_name: null,
      badge_class_id: null,
    });
    expect(r.hasOpenBadge).toBe(false);
    expect(r.badgeLabel).toBeNull();
    expect(r.text).not.toMatch(/Open Badge/i);
  });

  it("sanitize marque", () => {
    expect(sanitizePublicBrandCopy("espace Beyond")).toBe("espace Byound");
  });
});
