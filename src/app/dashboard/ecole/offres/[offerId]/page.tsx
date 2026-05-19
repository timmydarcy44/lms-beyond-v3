import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  fetchSchoolGateProfile,
  resolveSchoolIdForEcoleDashboard,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { loadSchoolOfferDetail } from "@/lib/dashboard/ecole-offer-detail-data";
import type { SchoolOverviewProfileRow } from "@/lib/dashboard/ecole-overview-data";
import { getSession } from "@/lib/auth/session";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function learnerDisplayName(p: SchoolOverviewProfileRow) {
  const n = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return n || p.email?.trim() || "Apprenant";
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function EcoleOfferDetailPage({ params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=/dashboard/ecole/offres/${offerId}`);
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect(`/login?next=/dashboard/ecole/offres/${offerId}`);
  }

  const isDemo = session.role === "demo";
  const gateProfile = await fetchSchoolGateProfile(session.id, session.email, supabase);
  const requestPath = await getMiddlewarePathname();
  const allowed = schoolDashboardAllowed({
    isDemoSession: isDemo,
    sessionFrontendRole: session.role,
    role: gateProfile?.role ?? "",
    roleType: gateProfile?.roleType ?? "",
    schoolIdPresent: Boolean(gateProfile?.school_id),
    profileRowPresent: Boolean(gateProfile),
    requestPath: requestPath || undefined,
  });

  if (!allowed) {
    redirect("/dashboard/apprenant");
  }

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) {
    notFound();
  }

  let listClient = supabase;
  try {
    listClient = await getServiceSupabase();
  } catch {
    /* RLS navigateur si pas de service role */
  }

  const detail = await loadSchoolOfferDetail(schoolId, offerId, listClient);
  if (!detail) {
    notFound();
  }

  const { offer, applications, suggestedLearners } = detail;

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/dashboard/ecole" className="text-indigo-600 hover:underline">
            Tableau de bord
          </Link>
          <span className="text-black/30">/</span>
          <Link href="/dashboard/ecole/offres" className="text-indigo-600 hover:underline">
            Offres
          </Link>
          <span className="text-black/30">/</span>
          <span className="truncate text-black/60">{offer.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
          <article className="space-y-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  {offer.status}
                </span>
                {offer.contract_type ? (
                  <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/70">
                    {offer.contract_type}
                  </span>
                ) : null}
              </div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{offer.title}</h1>
              {offer.company_name?.trim() ? (
                <p className="flex flex-wrap items-center gap-2 text-sm text-black/70">
                  <span className="font-medium text-black">{offer.company_name.trim()}</span>
                  {offer.company_hidden_from_learner ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                      Masqué aux apprenants
                    </span>
                  ) : null}
                </p>
              ) : null}
              <dl className="grid gap-2 text-sm text-black/65 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-black/40">Lieu</dt>
                  <dd>{offer.city?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-black/40">Rémunération</dt>
                  <dd>{offer.salary?.trim() || offer.salary_range?.trim() || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-black/40">Publiée le</dt>
                  <dd>{formatDate(offer.created_at)}</dd>
                </div>
              </dl>
            </header>

            {Array.isArray(offer.target_soft_skills) && offer.target_soft_skills.length ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-black/45">Soft skills visés</h2>
                <ul className="flex flex-wrap gap-2">
                  {offer.target_soft_skills.map((s, i) => (
                    <li
                      key={`${s}-${i}`}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-950"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-black/45">Présentation de l&apos;offre</h2>
              <div className="prose prose-sm max-w-none text-black/80">
                {offer.description?.trim() ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{offer.description}</p>
                ) : (
                  <p className="text-black/45">Aucune description détaillée n&apos;a été renseignée pour cette offre.</p>
                )}
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900/70">
                Souhaits et critères côté entreprise
              </h2>
              <ul className="list-inside list-disc space-y-1.5 text-sm text-indigo-950/85">
                {offer.contract_type ? <li>Type de contrat : {offer.contract_type}</li> : null}
                {offer.salary?.trim() ? <li>Rémunération indiquée : {offer.salary}</li> : null}
                {offer.salary_range?.trim() && offer.salary?.trim() !== offer.salary_range?.trim() ? (
                  <li>Fourchette : {offer.salary_range}</li>
                ) : null}
                {offer.city?.trim() ? <li>Localisation visée : {offer.city}</li> : null}
                {!offer.contract_type && !offer.salary?.trim() && !offer.salary_range?.trim() && !offer.city?.trim() ? (
                  <li className="list-none pl-0 text-black/50">
                    Les champs structurés (contrat, rémunération, lieu) complètent cette section lorsqu&apos;ils sont
                    renseignés en base.
                  </li>
                ) : null}
              </ul>
            </section>
          </article>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-black">Candidatures ({applications.length})</h2>
              <p className="mt-1 text-xs text-black/50">
                Apprenants ayant déjà postulé à cette offre (données alignées sur la table{" "}
                <code className="rounded bg-black/5 px-1">applications</code>).
              </p>
              <ul className="mt-4 max-h-[min(420px,50vh)] space-y-3 overflow-y-auto pr-1">
                {applications.length ? (
                  applications.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-xl border border-black/5 bg-[#F5F5F7]/80 px-3 py-2.5 text-sm"
                    >
                      <div className="font-medium text-black">{learnerDisplayName(a.talent)}</div>
                      {a.talent.email ? (
                        <div className="text-xs text-black/50">{a.talent.email}</div>
                      ) : null}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-black/45">
                        <span className="rounded bg-white px-2 py-0.5 font-medium text-black/70">{a.status || "—"}</span>
                        <span>{formatDate(a.created_at)}</span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-black/45">Aucune candidature enregistrée pour le moment.</li>
                )}
              </ul>
            </section>

            <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-black">Vivier école — à rapprocher</h2>
              <p className="mt-1 text-xs text-black/50">
                Apprenants rattachés à votre établissement qui ne sont pas encore candidats sur cette offre. Vous pouvez
                les rapprocher manuellement depuis votre process métier.
              </p>
              <ul className="mt-4 max-h-[min(360px,40vh)] space-y-2 overflow-y-auto pr-1 text-sm">
                {suggestedLearners.length ? (
                  suggestedLearners.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-black/5 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-black">{learnerDisplayName(p)}</div>
                        {p.class_name || p.class ? (
                          <div className="truncate text-xs text-black/45">{p.class_name || p.class}</div>
                        ) : null}
                      </div>
                      <Link
                        href={`/dashboard/ecole/apprenants/${p.id}`}
                        className="shrink-0 text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Fiche
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-black/45">Aucun autre apprenant dans le vivier pour cette offre.</li>
                )}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
