import { describe, expect, it } from "vitest";
import {
  assertWriteAllowed,
  buildActivityRow,
  canStartImpersonation,
  classifyOrganization,
  effectiveMode,
  isSensitivePath,
  isSessionActive,
  summarizeRevenue,
} from "./policy";

const now = "2026-11-02T12:00:00.000Z";

describe("classifyOrganization", () => {
  it("classe les slugs validés", () => {
    expect(classifyOrganization("byound-5gfu")).toEqual({
      kind: "internal",
      status: "active",
      clientSinceFromCreated: true,
    });
    expect(classifyOrganization("test03-xapi").kind).toBe("demo");
    expect(classifyOrganization("byound-care-sekx").kind).toBe("internal");
    expect(classifyOrganization("nutriset-dp9n")).toEqual({
      kind: "client",
      status: "onboarding",
      clientSinceFromCreated: false,
    });
  });
});

describe("impersonation", () => {
  it("refuse un non-staff et Jade", () => {
    expect(canStartImpersonation({ isStaff: false, isJade: false })).toBe(false);
    expect(canStartImpersonation({ isStaff: true, isJade: true })).toBe(false);
    expect(canStartImpersonation({ isStaff: true, isJade: false })).toBe(true);
  });

  it("refuse une écriture en lecture", () => {
    expect(assertWriteAllowed("read")).toEqual({ ok: false, status: 403, error: "Lecture seule" });
    expect(assertWriteAllowed("write")).toEqual({ ok: true });
  });

  it("masque Care, résultats de tests, messages et paiements", () => {
    expect(isSensitivePath("/api/beyond-care/admin/stats")).toBe(true);
    expect(isSensitivePath("/api/mental-health/questionnaires")).toBe(true);
    expect(isSensitivePath("/api/tests/analyze-results")).toBe(true);
    expect(isSensitivePath("/api/idmc/result")).toBe(true);
    expect(isSensitivePath("/api/messages/123")).toBe(true);
    expect(isSensitivePath("/api/stripe/payment-method")).toBe(true);
    expect(isSensitivePath("/api/dashboard/entreprise/employees")).toBe(false);
  });

  it("refuse une session expirée et repasse l'écriture en lecture", () => {
    expect(isSessionActive({ expiresAt: "2026-11-02T11:00:00.000Z", endedAt: null }, now)).toBe(false);
    expect(
      effectiveMode(
        { mode: "write", expiresAt: "2026-11-02T20:00:00.000Z", writeExpiresAt: "2026-11-02T11:30:00.000Z", endedAt: null },
        now,
      ),
    ).toBe("read");
    expect(
      effectiveMode(
        { mode: "write", expiresAt: "2026-11-02T11:00:00.000Z", writeExpiresAt: "2026-11-02T11:30:00.000Z", endedAt: null },
        now,
      ),
    ).toBe("expired");
  });

  it("écrit le journal avec la session", () => {
    const row = buildActivityRow({
      orgId: "org-1",
      actorUserId: "staff-1",
      actorType: "byound_on_behalf",
      action: "invite_collaborator",
      impersonationSessionId: "session-1",
      createdAt: now,
    });
    expect(row.impersonation_session_id).toBe("session-1");
    expect(row.actor_type).toBe("byound_on_behalf");
    expect(row.org_id).toBe("org-1");
  });
});

describe("summarizeRevenue", () => {
  const orgs = [
    { id: "client", kind: "client" as const, status: "active" as const },
    { id: "demo", kind: "demo" as const, status: "demo" as const },
  ];

  it("exclut la démo et ne compte pas les devis", () => {
    const summary = summarizeRevenue(
      [
        {
          orgId: "client",
          docType: "invoice",
          status: "issued",
          issuedAt: "2026-06-01T00:00:00.000Z",
          amountHtCents: 10000,
          saleType: "formation",
          opcoHtCents: 4000,
        },
        {
          orgId: "client",
          docType: "quote",
          status: "issued",
          issuedAt: "2026-06-02T00:00:00.000Z",
          amountHtCents: 99999,
        },
        {
          orgId: "client",
          docType: "credit_note",
          status: "issued",
          issuedAt: "2026-06-03T00:00:00.000Z",
          amountHtCents: 1000,
          saleType: "formation",
        },
        {
          orgId: "demo",
          docType: "invoice",
          status: "paid",
          issuedAt: "2026-06-01T00:00:00.000Z",
          paidAt: "2026-06-02T00:00:00.000Z",
          amountHtCents: 500000,
          saleType: "plateforme",
        },
      ],
      orgs,
      "2026-01-01T00:00:00.000Z",
      "2026-12-01T00:00:00.000Z",
      null,
      now,
    );
    expect(summary.periodHtCents).toBe(9000);
    expect(summary.quotesHtCents).toBe(99999);
    expect(summary.opcoHtCents).toBe(4000);
    expect(summary.bySaleType.formation).toBe(9000);
    expect(summary.bySaleType.plateforme).toBe(0);
  });

  it("renvoie zéro pour une organisation de démo", () => {
    const summary = summarizeRevenue(
      [
        {
          orgId: "demo",
          docType: "invoice",
          status: "paid",
          issuedAt: "2026-06-01T00:00:00.000Z",
          paidAt: "2026-06-02T00:00:00.000Z",
          amountHtCents: 500000,
        },
      ],
      orgs,
      "2026-01-01T00:00:00.000Z",
      "2026-12-01T00:00:00.000Z",
      "demo",
      now,
    );
    expect(summary.excludedDemo).toBe(true);
    expect(summary.periodHtCents).toBe(0);
    expect(summary.quotesHtCents).toBe(0);
  });
});
