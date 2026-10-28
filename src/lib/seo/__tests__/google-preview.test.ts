import { describe, expect, it } from "vitest";
import { charMeter, googleDescriptionPreview, googleTitlePreview, wordMeter } from "../google-preview";

describe("googleTitlePreview", () => {
  it("keeps short titles intact", () => {
    expect(googleTitlePreview("Byound à Caen").clipped).toBe(false);
  });
  it("clips around 60 characters with an ellipsis", () => {
    const title = "Byound — Développons les compétences qui feront la différence demain chez les entreprises";
    const preview = googleTitlePreview(title);
    expect(preview.clipped).toBe(true);
    expect(preview.text.endsWith("…")).toBe(true);
    expect(preview.text.replace("…", "").length).toBeLessThanOrEqual(60);
  });
});

describe("googleDescriptionPreview", () => {
  it("clips near 158 characters", () => {
    const desc = "A".repeat(200);
    const preview = googleDescriptionPreview(desc);
    expect(preview.clipped).toBe(true);
    expect(preview.text.length).toBeLessThanOrEqual(159);
  });
});

describe("charMeter", () => {
  it("is green inside the ideal range, orange below, red above", () => {
    expect(charMeter(55, 50, 60, 80).tone).toBe("green");
    expect(charMeter(40, 50, 60, 80).tone).toBe("orange");
    expect(charMeter(68, 50, 60, 80).tone).toBe("red");
    expect(charMeter(68, 50, 60, 80).label).toContain("68");
  });
});

describe("wordMeter", () => {
  it("counts words for the llms.txt summary", () => {
    expect(wordMeter(Array.from({ length: 80 }, () => "mot").join(" ")).tone).toBe("green");
    expect(wordMeter("trop court").tone).toBe("orange");
    expect(wordMeter(Array.from({ length: 301 }, () => "mot").join(" ")).tone).toBe("red");
  });
});
