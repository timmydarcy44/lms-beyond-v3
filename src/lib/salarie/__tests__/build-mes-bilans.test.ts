import { describe, expect, it } from "vitest";
import {
  buildMesBilansViewModel,
  resolveBilansPrioritySkill,
  resolveDiscBalance,
  toSalarieTutoiement,
} from "@/lib/salarie/build-mes-bilans";
import { listMissingInterpretationTexts } from "@/lib/salarie/interpretation-texts";
import type { AxisKey } from "@/lib/idmc/idmc-display";

describe("resolveDiscBalance", () => {
  it("marque equilibré si écart < 15", () => {
    const result = resolveDiscBalance({ D: 53, I: 55, S: 45, C: 47 });
    expect(result.nuance).toBe("equilibre");
    expect(result.nuanceLabel).toContain("équilibré");
  });

  it("marque dominante nette si écart >= 15", () => {
    const result = resolveDiscBalance({ D: 70, I: 40, S: 45, C: 45 });
    expect(result.nuance).toBe("nette");
  });
});

describe("toSalarieTutoiement", () => {
  it("passe du vouvoiement au tutoiement sans changer le sens", () => {
    expect(toSalarieTutoiement("Votre profil comportemental est principalement Influent.")).toBe(
      "Ton profil comportemental est principalement Influent.",
    );
  });
});

describe("buildMesBilansViewModel", () => {
  const axes = {
    A1: 60,
    A2: 55,
    A3: 78,
    A4: 41,
    A5: 63,
    A6: 61,
    A7: 50,
    A8: 52,
  } as Record<AxisKey, number>;

  it("construit les 3 sections et une légende milieu d'échelle (pas moyenne)", () => {
    const view = buildMesBilansViewModel({
      discScores: { D: 53, I: 55, S: 45, C: 47 },
      discTakenAt: "2026-10-23T10:00:00.000Z",
      idmcAxes: axes,
      idmcTakenAt: "2026-10-23T10:00:00.000Z",
      softEntries: [
        { skill: "Créativité", score: 12 },
        { skill: "Écoute active", score: 11 },
        { skill: "Gestion du stress", score: 11 },
        { skill: "Sens de l'organisation", score: 7 },
        { skill: "Gestion du temps", score: 7 },
        { skill: "Prise de décision", score: 8 },
      ],
      softTakenAt: "2026-10-23T10:00:00.000Z",
      softFlat: false,
    });

    expect(view.disc?.nuance).toBe("equilibre");
    expect(view.disc?.scaleLegend).toContain("milieu de l'échelle");
    expect(view.disc?.scaleLegend).not.toMatch(/moyenne/i);
    expect(view.disc?.bars[0]?.letter).toBe("I");
    expect(view.idmc?.strong).toBe("Adaptation au contexte");
    expect(view.idmc?.weak).toBe("Organisation et anticipation");
    expect(view.soft?.top[0]?.skill).toBe("Créativité");
    expect(view.soft?.top[0]?.percent).toBe(80);
    expect(view.privacyBanner).toMatch(/accepté le partage/i);
  });

  it("affiche les cartes vides quand aucun test", () => {
    const view = buildMesBilansViewModel({
      discScores: null,
      discTakenAt: null,
      idmcAxes: null,
      idmcTakenAt: null,
      softEntries: [],
      softTakenAt: null,
      softFlat: false,
    });
    expect(view.disc).toBeNull();
    expect(view.idmc).toBeNull();
    expect(view.soft).toBeNull();
    expect(view.nextStep.formation).toBeNull();
  });
});

describe("resolveBilansPrioritySkill", () => {
  it("priorise une compétence répétée soft + idmc", () => {
    const skill = resolveBilansPrioritySkill({
      softDevelop: ["Sens de l'organisation", "Gestion du temps", "Prise de décision"],
      idmcWeak: "Organisation et anticipation",
    });
    expect(skill).toMatch(/organis/i);
  });
});

describe("interpretation texts", () => {
  it("liste les placeholders À RÉDIGER", () => {
    const missing = listMissingInterpretationTexts();
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.every((row) => row.text === "À RÉDIGER")).toBe(true);
  });
});
