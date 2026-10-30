import { describe, expect, it } from "vitest";
import { formatCarePrice } from "../care.config";

describe("formatCarePrice", () => {
  it("shows sur devis when cents are not set", () => {
    expect(formatCarePrice(0)).toBe("Sur devis");
  });
  it("formats euro amounts from cents", () => {
    expect(formatCarePrice(7500)).toBe("75 €");
  });
});
