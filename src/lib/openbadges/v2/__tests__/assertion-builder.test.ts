import { describe, expect, it } from "vitest";
import { buildAssertion } from "../builders";

describe("buildAssertion OB2 structure", () => {
  it("serializes recipient hash + verification + badge URLs", () => {
    const assertion = buildAssertion({
      id: "https://example.com/api/public/assertions/a1",
      badgeClassId: "https://example.com/api/public/badgeclasses/b1",
      issuerId: "https://example.com/api/public/issuers/i1",
      recipientEmail: "earner@example.com",
      recipientSalt: "salt123",
      issuedOn: "2024-01-01T00:00:00.000Z",
      verification: { type: "hosted", url: "https://example.com/api/public/assertions/a1" },
    });

    expect(assertion["@context"]).toBe("https://w3id.org/openbadges/v2");
    expect(assertion.type).toBe("Assertion");
    expect(assertion.id).toBe("https://example.com/api/public/assertions/a1");
    expect(assertion.badge).toBe("https://example.com/api/public/badgeclasses/b1");
    if (assertion.verification && "url" in assertion.verification) {
      expect(assertion.verification.url).toBe(assertion.id);
    } else {
      throw new Error("Expected hosted verification with url");
    }
    expect(assertion.recipient?.hashed).toBe(true);
    expect(assertion.recipient?.salt).toBe("salt123");
    expect(assertion.recipient?.identity).toMatch(/^sha256\$/);
  });
});
