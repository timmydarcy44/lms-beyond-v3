import { describe, expect, it } from "vitest";
import {
  originFromRequest,
  relatedOrigins,
  resolveWebAuthnConfig,
} from "@/lib/formation-attendance/webauthn";

describe("resolveWebAuthnConfig", () => {
  it("dérive le RP ID depuis le domaine de la page (pas SITE_URL)", () => {
    const cfg = resolveWebAuthnConfig("https://www.byound.fr/e");
    expect(cfg.rpID).toBe("byound.fr");
    expect(cfg.origin).toBe("https://www.byound.fr");
    expect(cfg.origins).toEqual(
      expect.arrayContaining(["https://www.byound.fr", "https://byound.fr"]),
    );
  });

  it("reste localhost en local", () => {
    const cfg = resolveWebAuthnConfig("http://localhost:3001/e");
    expect(cfg.rpID).toBe("localhost");
  });
});

describe("originFromRequest", () => {
  it("préfère le Referer de la page /e", () => {
    const origin = originFromRequest({
      url: "https://lms-beyond-v3.vercel.app/api/attendance/passkey/register",
      headers: {
        get(name: string) {
          if (name === "referer") return "https://www.byound.fr/e";
          if (name === "host") return "lms-beyond-v3.vercel.app";
          return null;
        },
      },
    });
    expect(origin).toBe("https://www.byound.fr");
  });
});

describe("relatedOrigins", () => {
  it("ajoute www et apex", () => {
    expect(relatedOrigins("https://byound.fr")).toEqual(
      expect.arrayContaining(["https://byound.fr", "https://www.byound.fr"]),
    );
  });
});
