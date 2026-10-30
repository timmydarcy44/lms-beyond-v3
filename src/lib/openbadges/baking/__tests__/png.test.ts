import { describe, it, expect } from "vitest";
import { bakePng, unbakePng } from "../png";

const samplePng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=",
  "base64",
);

describe("PNG baking", () => {
  it("bakes and unbakes the openbadgecredential iTXt chunk", () => {
    const baked = bakePng(samplePng, "header.payload.signature");
    expect(baked.includes(Buffer.from("openbadgecredential"))).toBe(true);
    expect(unbakePng(baked)).toBe("header.payload.signature");
  });
});
