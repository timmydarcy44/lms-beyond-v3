import { describe, expect, it } from "vitest";
import { roleLabel } from "./roles";

describe("roleLabel", () => {
  it("affiche les rôles en français", () => {
    expect(roleLabel("admin")).toBe("Administrateur");
    expect(roleLabel("learner")).toBe("Collaborateur");
    expect(roleLabel("student", "cfa")).toBe("Apprenant");
    expect(roleLabel("trainer")).toBe("Formateur");
    expect(roleLabel("tutor")).toBe("Tuteur");
    expect(roleLabel("handicap_referent")).toBe("Référent handicap");
  });
});
