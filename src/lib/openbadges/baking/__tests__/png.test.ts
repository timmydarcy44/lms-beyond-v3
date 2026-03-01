import { describe, it, expect } from "vitest";
import { bakePng, unbakePng } from "../png";

const samplePng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
  "base64",
);

describe("PNG baking", () => {
  it("bakes and unbakes openbadges iTXt", () => {
    const baked = bakePng(samplePng, "https://example.com/assertions/1");
    const extracted = unbakePng(baked);
    expect(extracted).toBe("https://example.com/assertions/1");
  });
});
