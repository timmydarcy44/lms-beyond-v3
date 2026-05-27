import { describe, expect, it } from "vitest";
import { heuristicPlaygroundPromptQuality } from "@/lib/openbadges/badge-playground-prompt-quality";

describe("heuristicPlaygroundPromptQuality", () => {
  it("rejects placeholder single words", () => {
    expect(heuristicPlaygroundPromptQuality("prompt")).toBe("insufficient");
    expect(heuristicPlaygroundPromptQuality("test")).toBe("insufficient");
    expect(heuristicPlaygroundPromptQuality("ok")).toBe("insufficient");
  });

  it("accepts substantive prompts", () => {
    expect(
      heuristicPlaygroundPromptQuality(
        "Tu es un expert en prompting. Rédige un plan en 5 étapes pour apprendre le prompting efficace à des débutants en marketing.",
      ),
    ).toBe("valid");
  });
});
