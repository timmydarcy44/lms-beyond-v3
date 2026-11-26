import { describe, expect, it } from "vitest";
import { escPdf, qualiopiStatusColor, QUALIOPI_STATUS_LABEL } from "@/lib/qualiopi/pdf-theme";

describe("qualiopi pdf-theme", () => {
  it("échappe le HTML", () => {
    expect(escPdf(`A <b>"x"</b> & y`)).toBe("A &lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; y");
  });

  it("colore les statuts", () => {
    expect(qualiopiStatusColor("validated")).toMatch(/^#/);
    expect(QUALIOPI_STATUS_LABEL.missing).toBe("Manquant");
  });
});
