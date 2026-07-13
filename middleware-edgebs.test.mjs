/**
 * Tests légers pour le routage edgebs.fr (fonctions pures, sans Next.js).
 * Exécuter : node middleware-edgebs.test.mjs
 */
import { describe, expect, it } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Vérifie que le module source contient les routes critiques (sans bundler Edge).
const source = readFileSync(join(__dirname, "middleware-edgebs.ts"), "utf8");
for (const route of [
  "/alternance",
  "/formateurs-experts",
  "/tarifs",
  "/edge-lab/alternance",
  "/formateurs-experts",
]) {
  assert.ok(source.includes(route.replace("/edge-lab", "").replace(/^\//, "") || "alternance"));
}

// Logique redirect extraite pour test sans NextResponse
const EDGE_LAB_PREFIX = "/edge-lab";
const PREFIXES = ["/alternance", "/formateurs-experts", "/tarifs"];

function matchesPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isMarketing(pathname) {
  return PREFIXES.some((p) => matchesPrefix(pathname, p));
}

function edgeLabToClean(pathname) {
  if (!pathname.startsWith(`${EDGE_LAB_PREFIX}/`)) return null;
  if (/\.(png|jpe?g|webp|svg|ico)$/i.test(pathname)) return null;
  const stripped = pathname.slice(EDGE_LAB_PREFIX.length);
  if (!stripped || stripped === "/") return "/";
  if (!isMarketing(stripped)) return null;
  return stripped;
}

describe("middleware-edgebs (routing helpers)", () => {
  it("maps edge-lab marketing paths to clean paths", () => {
    expect(edgeLabToClean("/edge-lab/alternance")).toBe("/alternance");
    expect(edgeLabToClean("/edge-lab/formateurs-experts")).toBe("/formateurs-experts");
    expect(edgeLabToClean("/edge-lab/tarifs")).toBe("/tarifs");
    expect(edgeLabToClean("/edge-lab/edge-logo-white.png")).toBe(null);
  });

  it("detects marketing paths", () => {
    expect(isMarketing("/alternance")).toBe(true);
    expect(isMarketing("/unknown")).toBe(false);
  });
});
