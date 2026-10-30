import { describe, expect, it } from "vitest";
import { extractPageText, faqVisibility, headingStatus, parsePageHeadings, questionAppearsInText } from "../parse-html";

const html = `
  <html><body>
    <h1>Vos compétences. Votre prochaine étape.</h1>
    <h2>Une école, une plateforme</h2>
    <h2>Bachelor Business Sport</h2>
    <h3>Rythme</h3>
    <h3>Quelles formations en alternance propose Byound à Caen ?</h3>
    <p>Des bachelors en business.</p>
  </body></html>
`;

describe("parsePageHeadings", () => {
  it("reads h1 h2 h3 and strips tags", () => {
    const headings = parsePageHeadings(html);
    expect(headings.h1).toEqual(["Vos compétences. Votre prochaine étape."]);
    expect(headings.h2).toHaveLength(2);
    expect(headings.h3[0]).toBe("Rythme");
  });
});

describe("headingStatus", () => {
  it("flags missing extra H2 and multiple H1", () => {
    expect(headingStatus({ h1: ["A"], h2: ["B", "C"] }).h1).toBe("OK");
    expect(headingStatus({ h1: ["A"], h2: ["B"] }).h2).toMatch(/Un seul H2/);
    expect(headingStatus({ h1: ["A", "B"], h2: [] }).h1).toMatch(/Plusieurs H1/);
  });
});

describe("faq visibility", () => {
  it("finds a question in the page text", () => {
    const text = extractPageText(html);
    expect(questionAppearsInText("Quelles formations en alternance propose Byound à Caen ?", text)).toBe(true);
    expect(questionAppearsInText("Question absente du HTML", text)).toBe(false);
    expect(faqVisibility(["Quelles formations en alternance propose Byound à Caen ?"], text).allVisible).toBe(true);
  });
});
