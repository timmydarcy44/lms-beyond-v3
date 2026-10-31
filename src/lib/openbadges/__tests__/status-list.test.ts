import { describe, expect, it } from "vitest";
import { bakePng, unbakePng } from "@/lib/openbadges/baking/png";
import { publicEvidenceItems } from "@/lib/openbadges/v3/public-badge";
import { openBadgeAwardEmail, BADGE_WALLET_URL } from "@/lib/openbadges/award-email";
import {
  companyDeliverablesFromSubmissions,
  deliverablesSharedWithCompanies,
  setDeliverablesSharedWithCompanies,
} from "@/lib/openbadges/v3/company-deliverables";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { revocationListDocument } from "@/lib/openbadges/v3/revocation";
import { setEvidenceVisibility, walletEvidenceChoices } from "@/lib/openbadges/v3/wallet-privacy";
import { encodeStatusList, isPublicBadgeVisible, statusBit } from "@/lib/openbadges/v3/status-list";
import { v2AssertionToV3Credential } from "@/lib/openbadges/v3/mappers";

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("bitstring status list", () => {
  it("sets only the revoked indexes", () => {
    const encoded = encodeStatusList([0, 3]);
    expect(statusBit(encoded, 0)).toBe(true);
    expect(statusBit(encoded, 1)).toBe(false);
    expect(statusBit(encoded, 3)).toBe(true);
  });

  it("publishes revoked credential ids for the 1EdTech list", () => {
    const document = revocationListDocument([
      { id: "https://www.byound.fr/badges/assertion-1", revoked: true, revocationReason: "Erreur d'attribution" },
    ]);
    expect(document.id).toBe("https://www.byound.fr/api/public/status/revocation");
    expect(document.issuer).toBe("https://www.byound.fr/issuers/byound");
    expect(document.revokedCredential).toEqual(document.revokedCredentials);
    expect(document.revokedCredential[0]?.id).toBe("https://www.byound.fr/badges/assertion-1");
  });

  it("hides a private badge and keeps a public revoked badge visible", () => {
    expect(isPublicBadgeVisible(null)).toBe(false);
    expect(isPublicBadgeVisible({ is_public: false, revoked_at: null })).toBe(false);
    expect(isPublicBadgeVisible({ is_public: true, revoked_at: "2026-10-30T00:00:00Z" })).toBe(true);
  });
});

describe("baked badge", () => {
  it("writes the JWT into the openbadgecredential chunk", () => {
    const jwt = "header.payload.signature";
    const baked = bakePng(TINY_PNG, jwt);
    expect(unbakePng(baked)).toBe(jwt);
  });
});

describe("v2AssertionToV3Credential", () => {
  it("returns an Open Badges 3.0 credential instead of an empty document", () => {
    const credential = v2AssertionToV3Credential({
      "@context": "https://w3id.org/openbadges/v2",
      id: "assertion-1",
      type: "Assertion",
      recipient: { identity: "sha256$abc", type: "email", hashed: true, salt: "salt" },
      issuedOn: "2026-10-04T15:30:34.157Z",
      badge: "class-1",
      issuer: "https://www.byound.fr/issuers/byound",
      verification: { type: "hosted", url: "https://www.byound.fr/badges/assertion-1" },
      narrative: "Profil comportemental",
    });
    expect(credential.type).toEqual(["VerifiableCredential", "OpenBadgeCredential"]);
    expect(credential.id).toBe("https://www.byound.fr/badges/assertion-1");
    expect(JSON.stringify(credential)).not.toContain("holder@");
    expect(credential["@context"]).toContain("https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json");
  });
});

describe("wallet privacy", () => {
  it("lists deliverables and flips only the chosen public flag", () => {
    const stored = [
      { name: "Mémoire", url: "https://www.byound.fr/memoire", public: false },
      { name: "Soutenance", public: true },
    ];
    expect(walletEvidenceChoices(stored)).toEqual([
      { index: 0, name: "Mémoire", public: false },
      { index: 1, name: "Soutenance", public: true },
    ]);
    const next = setEvidenceVisibility(stored, 0, true);
    expect(next?.[0]).toMatchObject({ name: "Mémoire", url: "https://www.byound.fr/memoire", public: true });
    expect(next?.[1]).toMatchObject({ public: true });
    expect(setEvidenceVisibility(stored, 4, true)).toBeNull();
  });

  it("sends the holder to the wallet when a badge is ready", () => {
    const message = openBadgeAwardEmail("Profil comportemental");
    expect(message.subject).toBe("Votre Open Badge « Profil comportemental » est prêt");
    expect(message.text).toContain(BADGE_WALLET_URL);
    expect(message.html).toContain(BADGE_WALLET_URL);
    expect(message.html).not.toContain("/badges/");
  });
});

describe("company deliverables", () => {
  const quiz: BadgeMethodConfig = {
    methodId: "qcm",
    evaluationPrompt: "",
    quiz: {
      questions: [
        {
          id: "q1",
          prompt: "Quel élément ouvre un prompt ?",
          questionType: "single",
          choices: [
            { id: "a", label: "Le contexte", isCorrect: true },
            { id: "b", label: "La signature", isCorrect: false },
          ],
        },
      ],
    },
  };

  it("shows the work product to a company and leaves the score out", () => {
    const items = companyDeliverablesFromSubmissions(
      [
        {
          methodResponses: [
            { methodId: "qcm", qcmAnswers: { q1: "a" }, responseText: "{\"score\":100}" },
            { methodId: "playground", responseText: JSON.stringify({ playgroundAttempt: { prompt: "Rédige un brief", aiResponse: "Texte", promptQuality: "valid" } }) },
            { methodId: "pdf_upload", responseText: "Le mémoire est ici https://www.byound.fr/memoire.pdf" },
            { methodId: "disc", responseText: "Dominant 80" },
          ],
        },
      ],
      [quiz],
    );
    expect(items.map((item) => item.methodLabel)).toEqual(["Questionnaire", "Playground IA", "Document"]);
    expect(items[0]?.text).toContain("Quel élément ouvre un prompt ?");
    expect(items[0]?.text).toContain("Le contexte");
    expect(JSON.stringify(items)).not.toMatch(/score|isCorrect|Dominant|promptQuality/i);
    expect(items[1]?.text).toBe("Rédige un brief");
    expect(items[2]?.url).toBe("https://www.byound.fr/memoire.pdf");
  });

  it("keeps company sharing off until the holder accepts", () => {
    const stored = setDeliverablesSharedWithCompanies([{ name: "Mémoire", public: true }], false);
    expect(deliverablesSharedWithCompanies(stored)).toBe(false);
    expect(deliverablesSharedWithCompanies(setDeliverablesSharedWithCompanies(stored, true))).toBe(true);
  });
});

describe("public evidence", () => {
  it("keeps only the deliverables the holder marked public", () => {
    const items = publicEvidenceItems([
      { name: "Privé", public: false },
      { name: "Public", description: "Visible", url: "https://www.byound.fr/livrable", public: true },
    ]);
    expect(items).toEqual([
      { name: "Public", description: "Visible", url: "https://www.byound.fr/livrable" },
    ]);
  });
});
