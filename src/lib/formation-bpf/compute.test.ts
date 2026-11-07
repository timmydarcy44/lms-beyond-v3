import { describe, expect, it } from "vitest";
import { BPF_FUNDER_LABELS, BPF_LEARNER_LABELS } from "@/lib/formation-bpf/labels";

describe("BPF labels", () => {
  it("couvre tous les financeurs et statuts apprenants", () => {
    expect(Object.keys(BPF_FUNDER_LABELS).length).toBe(7);
    expect(Object.keys(BPF_LEARNER_LABELS).length).toBe(5);
    expect(BPF_FUNDER_LABELS.autres_of).toMatch(/organismes/i);
  });
});
