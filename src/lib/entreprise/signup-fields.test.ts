import { describe, expect, it } from "vitest";
import {
  capitalizeFirstName,
  entrepriseSignupSchema,
  isConsumerEmail,
  suggestProfessionalEmail,
} from "@/lib/entreprise/signup-fields";

describe("suggestProfessionalEmail", () => {
  it("corrige un tld .col vers .com", () => {
    expect(suggestProfessionalEmail("jade@limola.col")).toBe("jade@limola.com");
  });

  it("corrige gmial, hotmial et outlok", () => {
    expect(suggestProfessionalEmail("jade@gmial.com")).toBe("jade@gmail.com");
    expect(suggestProfessionalEmail("jade@hotmial.fr")).toBe("jade@hotmail.fr");
    expect(suggestProfessionalEmail("jade@outlok.com")).toBe("jade@outlook.com");
  });

  it("retire le point final après .fr", () => {
    expect(suggestProfessionalEmail("jade@limola.fr.")).toBe("jade@limola.fr");
  });

  it("ne suggère rien pour une adresse déjà correcte", () => {
    expect(suggestProfessionalEmail("jade@limola.com")).toBeNull();
  });
});

describe("entrepriseSignupSchema", () => {
  it("refuse jade@limola.col", () => {
    const parsed = entrepriseSignupSchema.safeParse({
      company_name: "Limola",
      first_name: "jade",
      last_name: "Martin",
      email: "jade@limola.col",
    });
    expect(parsed.success).toBe(false);
  });

  it("capitalise le prénom et accepte un email professionnel", () => {
    const parsed = entrepriseSignupSchema.safeParse({
      company_name: "  Limola ",
      first_name: "jade",
      last_name: " Martin ",
      email: "jade@limola.com",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.first_name).toBe("Jade");
      expect(parsed.data.last_name).toBe("Martin");
      expect(parsed.data.company_name).toBe("Limola");
    }
  });

  it("signale un email grand public sans le bloquer", () => {
    expect(isConsumerEmail("jade@gmail.com")).toBe(true);
    const parsed = entrepriseSignupSchema.safeParse({
      company_name: "Limola",
      first_name: "Jade",
      last_name: "Martin",
      email: "jade@gmail.com",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("capitalizeFirstName", () => {
  it("garde le tiret d'un prénom composé", () => {
    expect(capitalizeFirstName("jean-pierre")).toBe("Jean-Pierre");
  });
});
