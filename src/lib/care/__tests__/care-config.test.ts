import { describe, expect, it } from "vitest";
import { formatCarePrice } from "../care.config";

describe("formatCarePrice", () => {
  it("keeps placeholders when cents are not set", () => {
    expect(formatCarePrice(0)).toBe("[prix]");
  });
  it("formats euro amounts from cents", () => {
    expect(formatCarePrice(7500)).toBe("75 €");
  });
});
