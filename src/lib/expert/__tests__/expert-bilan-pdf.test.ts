import { describe, expect, it } from "vitest";
import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
import { buildExpertBilanHtml } from "@/lib/expert/expert-bilan-pdf";

const expert: AdminExpertRow = {
  id: "exp-1",
  email: "jerome@example.com",
  first_name: "Jérôme",
  last_name: "Martin",
  headline: "Formateur soft skills",
  bio: null,
  bio_long: null,
  linkedin_url: null,
  photo_url: null,
  avatar_url: null,
  review_status: "approved",
  is_active: true,
  specialties: ["Communication"],
  formats_supported: ["Présentiel"],
  regions: null,
  references: null,
  wants_certification: null,
  certification_status: null,
  is_certified_beyond: true,
  is_care_expert: false,
  open_badges: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("buildExpertBilanHtml", () => {
  it("embarque DISC, IDMC (8), soft skills et échappe le HTML", () => {
    const html = buildExpertBilanHtml({
      expert: { ...expert, first_name: 'Jérôme <script>x</script>' },
      results: {
        disc: { D: 72, I: 41, S: 28, C: 55 },
        idmc_score: 68,
        idmc_axes: {
          A1: 70,
          A2: 62,
          A3: 55,
          A4: 80,
          A5: 48,
          A6: 71,
          A7: 60,
          A8: 66,
        },
        soft_skills: [
          { skill: "Écoute", score: 12 },
          { skill: "Leadership", score: 9 },
        ],
        updated_at: "2026-11-20T10:00:00.000Z",
        disc_at: "2026-11-18T10:00:00.000Z",
        idmc_at: "2026-11-19T10:00:00.000Z",
        soft_skills_at: "2026-11-20T10:00:00.000Z",
      },
      generatedAtIso: "2026-11-26T08:00:00.000Z",
    });
    expect(html).toContain("Byound Control");
    expect(html).toContain("DISC");
    expect(html).toContain("IDMC");
    expect(html).toContain("Soft skills");
    expect(html).toContain("Connaissance de soi");
    expect(html).toContain("Écoute");
    expect(html).toContain("3/3");
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
