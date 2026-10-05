/**
 * Remplace les libellés utilisateur « EDGE » → « Byound » (sans toucher aux identifiants code).
 * Usage: node scripts/rebrand-edge-ui-copy.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "src");

const SKIP_LINE =
  /EDGE_ONLINE|EDGE_COLORS|EDGE_GRADIENTS|EDGE_MARKETING_PATHS|EDGE_ICON|EDGE_APPLE|edgebs\.fr|EDGE%20|EDGE_EMAIL_LOGO|EDGE_APPS|EdgeAppId|EdgeAppDefinition|EDGE_CHIP_CLASSES|EDGE_STATUS_CLASSES|from "@\/lib\/edge|from '@\/lib\/edge|use-edge-|edge-brand\.ts|perf-marks|EXPERT_NEXT|EDGE_COCKPIT|EDGE_MARKETING|galaxy-branding/;

const PHRASES = [
  ["EDGE Certified", "Byound Certified"],
  ["EDGE Online", "Byound Online"],
  ["EDGE Business", "Byound Business"],
  ["EDGE Skills", "Byound Skills"],
  ["EDGE Profil", "Byound Profil"],
  ["EDGE Recrutement", "Byound Recrutement"],
  ["EDGE GPS", "Byound GPS"],
  ["Formateur EDGE", "Expert Byound"],
  ["réseau EDGE", "réseau Byound"],
  ["Réseau EDGE", "Réseau Byound"],
  ["L'équipe EDGE", "L'équipe Byound"],
  ["équipe EDGE", "équipe Byound"],
  ["support EDGE", "support Byound"],
  ["Badges EDGE", "Badges Byound"],
  ["méthode EDGE", "méthode Byound"],
  [" · EDGE", " · Byound"],
  ["— EDGE", "— Byound"],
  ["EDGE développe", "Byound développe"],
  ['applicationName: "EDGE"', 'applicationName: "Byound"'],
  ['default: "EDGE"', 'default: "Byound"'],
  ['title: "EDGE"', 'title: "Byound"'],
  ['template: "%s · EDGE"', 'template: "%s · Byound"'],
  ['alt="EDGE"', 'alt="Byound"'],
  ['"apple-mobile-web-app-title": "EDGE"', '"apple-mobile-web-app-title": "Byound"'],
];

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?|json)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function processFile(file) {
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split("\n");
  let changed = false;
  const out = lines.map((line) => {
    if (SKIP_LINE.test(line)) return line;
    let l = line;
    for (const [from, to] of PHRASES) {
      if (l.includes(from)) l = l.split(from).join(to);
    }
    if (/\bEDGE\b/.test(l) && !/\bEDGE_/.test(l)) {
      const next = l.replace(/\bEDGE\b/g, "Byound");
      if (next !== l) l = next;
    }
    if (l !== line) changed = true;
    return l;
  });
  if (changed) fs.writeFileSync(file, out.join("\n"), "utf8");
}

const files = walk(ROOT);
for (const f of files) processFile(f);
console.log(`Processed ${files.length} files under src/`);
