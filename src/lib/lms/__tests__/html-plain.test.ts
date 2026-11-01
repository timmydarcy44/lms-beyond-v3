import { describe, expect, it } from "vitest";
import { htmlToPlain } from "@/lib/lms/html-plain";

describe("htmlToPlain", () => {
  it("sépare deux blocs au lieu de coller les mots", () => {
    const plain = htmlToPlain("<h2>Comprendre comment le cerveau apprend</h2><p>Le processus continue.</p>");
    expect(plain).toBe("Comprendre comment le cerveau apprend\nLe processus continue.");
    expect(plain.includes("apprendLe")).toBe(false);
  });

  it("sépare les éléments de liste", () => {
    expect(htmlToPlain("<ul><li>Neurones</li><li>Réseaux</li></ul>")).toBe("Neurones\nRéseaux");
  });
});
