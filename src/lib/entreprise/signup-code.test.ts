import { describe, expect, it } from "vitest";
import { formatEntrepriseOtp, getEntrepriseOtpEmail } from "@/lib/emails/templates/entreprise-otp";
import { secondsUntilResend, sendsInLastHour } from "@/lib/entreprise/signup-code";

describe("formatEntrepriseOtp", () => {
  it("groupe un code a 6 chiffres", () => {
    expect(formatEntrepriseOtp("482913")).toBe("482 913");
  });

  it("groupe un code a 8 chiffres", () => {
    expect(formatEntrepriseOtp("48291347")).toBe("4829 1347");
  });

  it("affiche le code en grand, sans lien", () => {
    const { html } = getEntrepriseOtpEmail("48291347");
    expect(html).toContain("4829 1347");
    expect(html).not.toContain("filter:invert");
    expect(html).not.toContain("href=\"http");
  });
});

describe("limites d'envoi", () => {
  it("impose 60 secondes entre deux envois", () => {
    const now = Date.parse("2026-10-23T12:00:30.000Z");
    expect(secondsUntilResend("2026-10-23T12:00:00.000Z", now)).toBe(30);
    expect(secondsUntilResend("2026-10-23T11:59:00.000Z", now)).toBe(0);
  });

  it("compte les envois de la dernière heure", () => {
    const now = Date.parse("2026-10-23T12:00:00.000Z");
    expect(
      sendsInLastHour(["2026-10-23T11:30:00.000Z", "2026-10-23T10:00:00.000Z"], now),
    ).toBe(1);
  });
});
