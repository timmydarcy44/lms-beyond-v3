import { describe, expect, it } from "vitest";
import {
  buildLinkedInAddCertificationUrl,
  buildOpenBadgeLinkedInFeedShareUrl,
  buildOpenBadgeLinkedInShareMessage,
  buildOpenBadgeLinkedInShareUrl,
} from "@/lib/openbadges/linkedin-share";

describe("buildOpenBadgeLinkedInShareMessage", () => {
  it("includes badge name and level", () => {
    const message = buildOpenBadgeLinkedInShareMessage({
      badgeName: "AI Prompting - Level 1",
      level: 1,
    });
    expect(message).toBe("J'ai obtenu l'Open Badge « AI Prompting - Level 1 » délivré par Byound.");
    expect(message).not.toContain("fièr");
  });

  it("builds share URL with summary param", () => {
    const url = buildOpenBadgeLinkedInShareUrl({
      shareUrl: "https://www.byound.fr/badgeclasses/abc/criteria",
      badgeName: "AI Prompting - Level 1",
      level: 1,
    });
    expect(url).toContain("linkedin.com/sharing/share-offsite");
    expect(url).toContain("summary=");
    expect(decodeURIComponent(url)).toContain("Open Badge « AI Prompting - Level 1 »");
  });

  it("builds feed share URL with prefilled text", () => {
    const url = buildOpenBadgeLinkedInFeedShareUrl({
      shareUrl: "https://www.byound.fr/badgeclasses/abc/criteria",
      badgeName: "AI Prompting - Level 1",
      level: 1,
    });
    expect(url).toContain("linkedin.com/feed/");
    expect(url).toContain("shareActive=true");
    expect(decodeURIComponent(url)).toContain("www.byound.fr/badgeclasses/abc/criteria");
  });

  it("builds the LinkedIn add-to-profile URL", () => {
    const url = buildLinkedInAddCertificationUrl({
      badgeName: "Profil comportemental",
      issuedAt: "2026-10-30T12:00:00.000Z",
      certUrl: "https://www.byound.fr/badges/abc",
      certId: "abc",
    });
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://www.linkedin.com/profile/add");
    expect(parsed.searchParams.get("startTask")).toBe("CERTIFICATION_NAME");
    expect(parsed.searchParams.get("name")).toBe("Profil comportemental");
    expect(parsed.searchParams.get("organizationName")).toBe("Byound");
    expect(parsed.searchParams.get("issueYear")).toBe("2026");
    expect(parsed.searchParams.get("issueMonth")).toBe("10");
    expect(parsed.searchParams.get("certUrl")).toBe("https://www.byound.fr/badges/abc");
    expect(parsed.searchParams.get("certId")).toBe("abc");
  });
});
