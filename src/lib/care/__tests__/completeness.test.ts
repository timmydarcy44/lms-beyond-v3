import { describe, expect, it } from "vitest";
import { careCompleteness, slugifyCareName } from "../completeness";
import type { CareService } from "../types";

const service: CareService = {
  id: "1",
  expert_id: "e",
  position: 0,
  name: "Bilan",
  domain: "famille",
  description: "",
  duration_min: 60,
  formats: ["visio"],
  price_cents: 8000,
  active: true,
};

describe("careCompleteness", () => {
  it("blocks publish until photo, title, tagline, domain and service are set", () => {
    const empty = careCompleteness({
      avatar_url: null,
      title: "",
      tagline: "",
      domains: [],
      services: [],
    });
    expect(empty.canPublish).toBe(false);
    expect(empty.percent).toBe(0);
    const ready = careCompleteness({
      avatar_url: "https://cdn.example/a.jpg",
      title: "Psychologue",
      tagline: "Comprendre comment vous fonctionnez.",
      domains: ["famille"],
      services: [service],
    });
    expect(ready.canPublish).toBe(true);
    expect(ready.percent).toBe(100);
  });

  it("slugifies display names", () => {
    expect(slugifyCareName("Léa Martin")).toBe("lea-martin");
  });
});
