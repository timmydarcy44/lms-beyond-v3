import { describe, expect, it } from "vitest";
import { careCompleteness, isCareDirectoryComplete, slugifyCareName } from "../completeness";
import { isCareListingPublic, isCareTestEmail } from "../publication";
import type { CareService } from "../types";

const service: CareService = {
  id: "1",
  expert_id: "e",
  position: 0,
  name: "Bilan familial",
  domain: "famille",
  description: "",
  duration_min: 60,
  formats: ["visio"],
  price_cents: 8000,
  active: true,
};

const ready = {
  avatar_url: "https://cdn.example/a.jpg",
  tagline: "Comprendre comment vous fonctionnez, sans vous presser.",
  bio: "Une présentation assez longue pour expliquer le cadre, les publics accompagnés et la façon de travailler ensemble au quotidien. Les séances restent concrètes, le suivi se fait entre les rendez-vous, et le praticien explique ce qui est travaillé sans inventer de diagnostic.",
  approach: "",
  domains: ["famille"],
  city: "Caen",
  offers_cabinet: true,
  offers_visio: true,
  services: [service],
};

describe("careCompleteness", () => {
  it("score le profil sans bloquer la publication", () => {
    const empty = careCompleteness({
      avatar_url: null,
      tagline: "",
      bio: "",
      domains: [],
      services: [],
    });
    expect(empty.canPublish).toBe(true);
    expect(empty.percent).toBe(0);
    expect(careCompleteness(ready).percent).toBe(100);
    expect(careCompleteness(ready).canPublish).toBe(true);
  });

  it("signale un texte d'exemple sans empêcher la publication", () => {
    const placeholder = careCompleteness({ ...ready, tagline: "[Tagline saisie par la praticienne]" });
    expect(placeholder.missing.some((item) => item.id === "tagline")).toBe(true);
    expect(placeholder.canPublish).toBe(true);
  });

  it("slugifies display names", () => {
    expect(slugifyCareName("Léa Martin")).toBe("lea-martin");
  });
});

describe("isCareListingPublic", () => {
  const gate = {
    ...ready,
    published: true,
    is_care: true,
    is_test: false,
    email: "jessica@example.com",
    review_status: "approved",
    care_active: true,
  };

  it("publie un profil incomplet et cache les comptes de test", () => {
    expect(isCareTestEmail("timmydarcy44@gmail.com")).toBe(false);
    expect(isCareListingPublic({ ...gate, email: "timmydarcy44@gmail.com" })).toBe(true);
    expect(isCareTestEmail("timmydarcy44+expertpro@gmail.com")).toBe(true);
    expect(isCareListingPublic({ ...gate, email: "timmydarcy44+expertpro@gmail.com" })).toBe(false);
    expect(isCareListingPublic({ ...gate, is_test: true })).toBe(false);
    expect(isCareListingPublic({ ...gate, published: false })).toBe(false);
    expect(isCareListingPublic({ ...gate, avatar_url: null, review_status: "pending_review", care_active: false })).toBe(true);
    expect(isCareListingPublic(gate)).toBe(true);
    expect(isCareDirectoryComplete(ready)).toBe(true);
  });
});
