import { describe, expect, it } from "vitest";
import { presentDeliverableAccess, storageObjectFromUrl } from "@/lib/openbadges/v3/badge-deliverable-access";
import {
  criteriaShareOneDate,
  formatBadgeCardDate,
  formatPersonName,
  stripRemoteUrls,
  truncateBadgeId,
} from "@/lib/openbadges/v3/badge-page-display";

describe("badge page display", () => {
  it("formats a holder name only for display", () => {
    expect(formatPersonName("Jessica CONTENTIN")).toBe("Jessica Contentin");
  });

  it("prints the card date with dots", () => {
    expect(formatBadgeCardDate("2026-05-26T18:53:56.245Z")).toMatch(/26\.05\.2026|27\.05\.2026/);
  });

  it("keeps one validation date when every criterion shares it", () => {
    const day = "2026-05-26T18:53:56.245Z";
    expect(criteriaShareOneDate([day, day])).toBe(day);
    expect(criteriaShareOneDate([day, "2026-06-01T00:00:00.000Z"])).toBeNull();
  });

  it("truncates an assertion id in the middle", () => {
    expect(truncateBadgeId("c2f0e141-92eb-4b7a-988b-d9f5454445a2")).toBe("c2f0e141…45a2");
  });
});

describe("company deliverable access", () => {
  it("hides the work and the file address until a company is allowed to see them", () => {
    const hidden = presentDeliverableAccess({
      shared: false,
      submissions: [{ title: "Évaluation", text: "Le contexte https://files.byound.fr/secret.pdf", url: "https://files.byound.fr/secret.pdf" }],
      evidence: [],
    });
    expect(hidden.count).toBe(1);
    expect(hidden.cards).toEqual([]);
    expect(JSON.stringify(hidden.cards)).not.toContain("secret");
    expect(JSON.stringify(hidden.cards)).not.toContain("contexte");

    const shown = presentDeliverableAccess({
      shared: true,
      submissions: [{ title: "Évaluation", text: "Le contexte https://files.byound.fr/secret.pdf", url: "https://files.byound.fr/secret.pdf" }],
      evidence: [{ title: "Mémoire", description: "Version finale", url: "https://cdn.example/memoire.pdf", date: "2026-05-26T00:00:00.000Z", validatedBy: "Byound", isPublic: false }],
    });
    expect(shown.cards[0]?.description).toBe("Le contexte");
    expect(shown.cards[0]?.fileIndex).toBe(0);
    expect(stripRemoteUrls(shown.cards[0]?.description ?? "")).not.toContain("http");
    expect(shown.files[0]?.url).toContain("secret.pdf");
    expect(shown.cards.map((item) => item.title)).toEqual(["Évaluation", "Mémoire"]);
  });

  it("reads a storage path from a public object url", () => {
    expect(storageObjectFromUrl("https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/badge-images/classe.png")).toEqual({
      bucket: "badge-images",
      path: "classe.png",
    });
  });
});
