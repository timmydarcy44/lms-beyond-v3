import { notFound } from "next/navigation";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { AccordCta } from "./accord-cta";

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function PublicOfferPage({
  params,
  searchParams,
}: {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { offerId } = await params;
  const query = await searchParams;
  const kind = one(query.kind) === "need" ? "need" : "offer";
  const companyId = one(query.company);
  const token = one(query.accord);
  const db = getServiceRoleClient();
  if (!db) notFound();

  let title = "";
  let companyName = "";
  let city = "";
  let contract = "";
  let description = "";
  let start = "";

  if (kind === "need") {
    const need = await db.from("cfa_company_needs").select("title, location, start_date, company_id").eq("id", offerId).maybeSingle();
    const row = need.data as { title?: string; location?: string | null; start_date?: string | null; company_id?: string } | null;
    if (!row || (companyId && row.company_id !== companyId)) notFound();
    const company = await db.from("cfa_companies").select("company_name").eq("id", row.company_id ?? "").maybeSingle();
    title = row.title || "Offre";
    companyName = String((company.data as { company_name?: string } | null)?.company_name ?? "");
    city = row.location || "";
    start = row.start_date || "";
    contract = "Alternance";
  } else {
    const offer = await db.from("job_offers").select("title, description, city, contract_type, start_label, school_id").eq("id", offerId).maybeSingle();
    const row = offer.data as { title?: string | null; description?: string | null; city?: string | null; contract_type?: string | null; start_label?: string | null; school_id?: string | null } | null;
    if (!row) notFound();
    if (companyId) {
      const company = await db.from("cfa_companies").select("company_name, organization_id").eq("id", companyId).maybeSingle();
      const owner = company.data as { company_name?: string; organization_id?: string | null } | null;
      if (!owner || String(owner.organization_id ?? "") !== String(row.school_id ?? "")) notFound();
      companyName = owner.company_name || "";
    }
    title = row.title || "Offre";
    city = row.city || "";
    contract = row.contract_type || "";
    description = String(row.description ?? "").slice(0, 1200);
    start = row.start_label || "";
  }

  return (
    <main className="min-h-screen bg-[#F4F4F1] px-4 py-10 text-[#1C1C1E]">
      <article className="mx-auto max-w-xl rounded-[28px] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">Offre</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-black/60">{[companyName, city, contract, start].filter(Boolean).join(" · ")}</p>
        {description ? <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-black/75">{description}</p> : null}
        <p className="mt-5 text-sm leading-6">Byound School souhaite transmettre votre présentation à cette entreprise : prénom, nom, cursus, disponibilité et motivation. Aucune donnée administrative n'est incluse.</p>
        {token && companyId ? <AccordCta token={token} companyId={companyId} offerId={offerId} kind={kind} /> : <p className="mt-6 text-sm">Ce lien ne permet pas de donner votre accord.</p>}
      </article>
    </main>
  );
}
