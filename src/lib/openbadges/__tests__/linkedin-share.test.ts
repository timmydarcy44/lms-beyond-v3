import { describe, expect, it } from "vitest";
import {
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
});
