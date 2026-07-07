import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, "../src/app/edge-lab");

const registry = [
  ["apprenants", "apprenants"],
  ["formations", "formations"],
  ["formations/bts", "formationsBts"],
  ["formations/bachelor", "formationsBachelor"],
  ["formations/mastere", "formationsMastere"],
  ["alternance", "alternance"],
  ["admissions", "admissions"],
  ["financement", "financement"],
  ["vie-etudiante", "vieEtudiante"],
  ["certifications", "certifications"],
  ["business", "business"],
  ["business/solutions", "businessSolutions"],
  ["business/formations-entreprises", "businessFormations"],
  ["business/academie-interne", "businessAcademie"],
  ["business/gestion-competences", "businessCompetences"],
  ["business/recrutement", "businessRecrutement"],
  ["business/cas-clients", "businessCasClients"],
  ["business/demo", "businessDemo"],
  ["online", "online"],
  ["online/formations", "onlineFormations"],
  ["online/bootcamps", "onlineBootcamps"],
  ["online/certifications", "onlineCertifications"],
  ["formateurs-experts", "formateursExperts"],
  ["a-propos", "aPropos"],
  ["notre-mission", "notreMission"],
  ["ressources", "ressources"],
  ["blog", "blog"],
  ["guides", "guides"],
  ["webinaires", "webinaires"],
  ["contact", "contact"],
];

function template(key) {
  return `import { EdgeMarketingRoutePage, createMarketingPageMeta } from "@/components/edge-site/marketing/edge-marketing-route-page";

export const metadata = createMarketingPageMeta("${key}");

export default function Page() {
  return <EdgeMarketingRoutePage contentKey="${key}" />;
}
`;
}

for (const [route, key] of registry) {
  const dir = path.join(base, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "page.tsx"), template(key));
}

console.log(`Created ${registry.length} marketing pages`);
