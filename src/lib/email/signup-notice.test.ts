import { describe, expect, it } from "vitest";
import { buildSignupNoticeEmail, isRecentAccount, isSignupKind } from "@/lib/email/signup-notice";

describe("signup notice", () => {
  it("reconnaît un compte créé à l’instant et ignore un ancien compte", () => {
    const now = Date.parse("2026-11-03T12:00:00.000Z");
    expect(isRecentAccount("2026-11-03T11:50:00.000Z", now)).toBe(true);
    expect(isRecentAccount("2026-11-03T10:00:00.000Z", now)).toBe(false);
    expect(isRecentAccount(null, now)).toBe(false);
  });

  it("limite les types d’inscription", () => {
    expect(isSignupKind("expert")).toBe(true);
    expect(isSignupKind("etudiant")).toBe(true);
    expect(isSignupKind("admin")).toBe(false);
  });

  it("prépare un mail d’avertissement sans pourcentage ni script", () => {
    const mail = buildSignupNoticeEmail({
      kind: "expert",
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "<Lovelace>",
      detail: "Pédagogie",
      registeredAt: "3 nov. 2026",
    });
    expect(mail.subject).toBe("Nouvelle inscription · Expert");
    expect(mail.html).toContain("ada@example.com");
    expect(mail.html).toContain("&lt;Lovelace&gt;");
    expect(mail.html).not.toContain("<Lovelace>");
    expect(mail.to).toContain("@");
  });
});
