import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Manrope } from "next/font/google";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { OfferDetail } from "@/components/offres/public-offer";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";
import { alternancePay, type PublicOffer } from "@/lib/offres/public-offers";
import { getServiceRoleClient } from "@/lib/supabase/server";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aperçu d'une offre — Byound",
  robots: { index: false, follow: false },
};

const GROUPS: Array<[number, number, string]> = [
  [1, 3, "Agriculture"],
  [10, 33, "Industrie"],
  [41, 43, "Bâtiment"],
  [45, 45, "Commerce et réparation automobile"],
  [46, 46, "Commerce de gros"],
  [47, 47, "Commerce de détail"],
  [49, 53, "Transport et logistique"],
  [55, 56, "Hôtellerie et restauration"],
  [58, 63, "Numérique et information"],
  [64, 66, "Banque et assurance"],
  [68, 68, "Immobilier"],
  [69, 75, "Conseil et services aux entreprises"],
  [85, 85, "Enseignement"],
  [86, 88, "Santé et action sociale"],
  [90, 93, "Culture, sport et loisirs"],
];

function sectorFromNaf(naf: string) {
  const division = Number(naf.match(/\d{2}/)?.[0] ?? "");
  if (!division) return "Secteur non précisé";
  return GROUPS.find(([from, to]) => division >= from && division <= to)?.[2] ?? "Autre activité";
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

export default async function OfferPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) notFound();
  const db = getServiceRoleClient();
  if (!db) notFound();
  const row = await db
    .from("job_offers")
    .select("school_id, title, description, city, contract_type, contract_duration, start_label, work_mode, hours_per_week, salary_range, benefits, diploma_prepared, recruitment_steps")
    .eq("id", id)
    .maybeSingle();
  const data = row.data as Record<string, unknown> | null;
  if (row.error || !data) notFound();
  const schoolId = text(data.school_id);
  const admin = "superAdminPreview" in access || (await isSuperAdmin());
  if (!admin && (!("organizationId" in access) || access.organizationId !== schoolId)) notFound();

  const [company, org] = await Promise.all([
    db.from("cfa_companies").select("naf_code, headcount_range").eq("organization_id", schoolId).limit(1),
    db.from("organizations").select("company_size_band").eq("id", schoolId).maybeSingle(),
  ]);
  const fiche = (company.data?.[0] ?? {}) as { naf_code?: string | null; headcount_range?: string | null };
  const size = text(fiche.headcount_range) || text((org.data as { company_size_band?: string | null } | null)?.company_size_band);
  const contract = text(data.contract_type);
  const hours = Number(data.hours_per_week);
  const offer: PublicOffer = {
    slug: "apercu",
    title: text(data.title) || "Offre",
    sector: sectorFromNaf(text(fiche.naf_code)),
    sizeLabel: size || "Taille non précisée",
    city: /rue|avenue|boulevard|impasse|allée|allee|chemin/i.test(text(data.city)) ? "" : text(data.city),
    contractType: contract,
    duration: text(data.contract_duration),
    startLabel: text(data.start_label),
    workMode: text(data.work_mode),
    hours: Number.isFinite(hours) && hours > 0 ? `${hours} h / semaine` : "",
    payLabel: alternancePay(contract, text(data.salary_range)),
    benefits: Array.isArray(data.benefits) ? data.benefits.map((item) => text((item as { label?: unknown }).label)).filter(Boolean) : [],
    description: text(data.description),
    missions: [],
    skills: [],
    softSkills: [],
    steps: Array.isArray(data.recruitment_steps)
      ? data.recruitment_steps.map((item) => {
          const step = item as { title?: unknown; detail?: unknown };
          return { title: text(step.title), detail: text(step.detail) };
        }).filter((step) => step.title)
      : [],
    cursus: text(data.diploma_prepared),
    publishedAt: "",
  };

  return (
    <EdgePremiumShell overlayNav={false} navChrome="dark" showTopBar={false}>
      <div className={manrope.className}>
        <p className="bg-[#EEEBFF] px-5 py-3 text-center text-sm font-semibold text-[#4B3BD1]">Aperçu candidat. Le nom de l&apos;entreprise n&apos;apparaît pas.</p>
        <OfferDetail offer={offer} />
      </div>
    </EdgePremiumShell>
  );
}
