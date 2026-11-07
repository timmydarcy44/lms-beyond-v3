import { describe, expect, it } from "vitest";
import { isBpfIncomplete, isDossierOverdue, ownerInitials } from "@/lib/formation-dossier/board";

describe("formation board helpers", () => {
  it("n'affiche pas BPF incomplet en Qualification", () => {
    expect(
      isBpfIncomplete({
        status: "qualification",
        bpf_funder_type: null,
        subcontracting: "aucune",
      }),
    ).toBe(false);
  });

  it("signale BPF incomplet dès Convention", () => {
    expect(
      isBpfIncomplete({
        status: "convention",
        bpf_funder_type: null,
        subcontracting: "aucune",
      }),
    ).toBe(true);
  });

  it("détecte un retard sur devis ancien", () => {
    expect(
      isDossierOverdue({
        status: "devis",
        updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        pending_confirm_fields: [],
      }),
    ).toBe(true);
  });

  it("calcule les initiales", () => {
    expect(ownerInitials("Jérôme Picot")).toBe("JP");
  });
});
