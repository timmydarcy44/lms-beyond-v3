import { describe, expect, it } from "vitest";
import {
  applySeoTemplate,
  DEFAULT_SEO_TEMPLATE_ROWS,
  fillGeneratedFields,
  jobTemplateHasCompanyVar,
  sanitizeJobSeoText,
  validateSeoTemplate,
} from "../templates";

describe("applySeoTemplate", () => {
  it("fills allowed job variables", () => {
    const title = applySeoTemplate("{intitulé} en {contrat} à {ville} | Byound", {
      intitulé: "Assistant commercial",
      contrat: "alternance",
      ville: "Caen",
    });
    expect(title).toBe("Assistant commercial en alternance à Caen | Byound");
  });
});

describe("job anonymity", () => {
  it("rejects company variables in the template", () => {
    expect(jobTemplateHasCompanyVar("{intitulé} chez {entreprise}")).toBe(true);
    expect(validateSeoTemplate("job_offer", "{intitulé} | {company}", "ok")).toMatch(/entreprise/i);
  });
  it("strips a company name from generated title and description", () => {
    const cleaned = sanitizeJobSeoText(
      "Assistant commercial Acme Industrie à Caen",
      "Rejoignez Acme Industrie en alternance.",
      ["Acme Industrie"],
    );
    expect(cleaned.title.toLowerCase()).not.toContain("acme");
    expect(cleaned.description.toLowerCase()).not.toContain("acme");
    expect(cleaned.blocked).toBe(true);
  });
});

describe("fillGeneratedFields", () => {
  it("builds a job title without a company variable", () => {
    const job = DEFAULT_SEO_TEMPLATE_ROWS.find((item) => item.type === "job_offer")!;
    const filled = fillGeneratedFields(
      job,
      { intitulé: "Assistant commercial", contrat: "alternance", ville: "Caen", cursus: "BTS NDRC" },
      "Rejoignez une équipe commerciale à Caen. Missions terrain et CRM.",
    );
    expect(filled.title).toContain("Assistant commercial");
    expect(filled.title.toLowerCase()).not.toContain("entreprise");
    expect(filled.description.length).toBeLessThanOrEqual(156);
  });
});
