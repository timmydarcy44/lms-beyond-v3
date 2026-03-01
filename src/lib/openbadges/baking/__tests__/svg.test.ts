import { describe, it, expect } from "vitest";
import { bakeSvg, unbakeSvg } from "../svg";

describe("SVG baking", () => {
  it("injects and reads openbadges assertion", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>`;
    const baked = bakeSvg(svg, "https://example.com/assertions/1");
    const extracted = unbakeSvg(baked);
    expect(extracted).toBe("https://example.com/assertions/1");
  });
});
