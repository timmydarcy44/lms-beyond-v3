import { describe, expect, it } from "vitest";
import { parseReadingBlocks, splitSectionTitle, stripCalloutLabel } from "./reading-transform";

describe("stripCalloutLabel", () => {
  it("retire le label en début de texte", () => {
    expect(stripCalloutLabel("<strong>Définition :</strong> Le cerveau apprend.")).toBe("Le cerveau apprend.");
    expect(stripCalloutLabel("<strong>Exemple concret:</strong> Une séance courte.")).toBe("Une séance courte.");
    expect(stripCalloutLabel("<p><strong>Exemple :</strong> Un cas réel.</p>")).toBe("Un cas réel.");
    expect(stripCalloutLabel("<strong>à retenir :</strong> Une phrase.")).toBe("Une phrase.");
  });
});

describe("parseReadingBlocks", () => {
  it("transforme les encadrés connus et retire le label", () => {
    const html =
      '<div class="bg-red-50 border-l-4 border-red-500 p-4"><strong>Définition :</strong> La neuroéducation.</div>';
    expect(parseReadingBlocks(html)).toEqual([
      { type: "callout", variant: "definition", html: "La neuroéducation." },
    ]);
  });

  it("laisse un encadré inconnu inchangé", () => {
    const html =
      '<div class="bg-sky-50 border-l-4 border-sky-600 p-4"><strong>Chiffre clé :</strong> 12 %</div>';
    expect(parseReadingBlocks(html)).toEqual([{ type: "html", html }]);
  });

  it("lit le balisage data-callout", () => {
    expect(parseReadingBlocks('<aside data-callout="example">Un terrain.</aside>')).toEqual([
      { type: "callout", variant: "example", html: "Un terrain." },
    ]);
  });
});

describe("splitSectionTitle", () => {
  it("sépare le numéro du titre", () => {
    expect(splitSectionTitle("1.1.2 Les liens entre neurosciences")).toEqual({
      number: "1.1.2",
      title: "Les liens entre neurosciences",
    });
  });

  it("garde un titre sans numéro", () => {
    expect(splitSectionTitle("Qu'est-ce que la neuroéducation ?")).toEqual({
      number: null,
      title: "Qu'est-ce que la neuroéducation ?",
    });
  });
});
