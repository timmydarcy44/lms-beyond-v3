import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import {
  fetchSchoolGateProfile,
  resolveSchoolIdForEcoleDashboard,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import {
  formatDurationFr,
  loadSchoolPedagogyInsights,
} from "@/lib/dashboard/ecole-pedagogy-data";
import { loadSchoolOverviewData } from "@/lib/dashboard/ecole-overview-data";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function learnerDisplayName(p: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  id: string;
}): string {
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (p.email) return p.email;
  return p.id.slice(0, 8);
}

export default async function EcoleFormationsSuiviPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole/formations-suivi");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole/formations-suivi");
  }

  const isDemo = session.role === "demo";
  const gate = await fetchSchoolGateProfile(session.id, session.email, supabase);
  const requestPath = await getMiddlewarePathname();
  const ok = schoolDashboardAllowed({
    isDemoSession: isDemo,
    sessionFrontendRole: session.role,
    role: gate?.role ?? "",
    roleType: gate?.roleType ?? "",
    schoolIdPresent: Boolean(gate?.school_id),
    profileRowPresent: Boolean(gate),
    requestPath: requestPath || undefined,
  });
  if (!ok) {
    redirect("/dashboard/apprenant");
  }

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);

  let listClient = supabase;
  try {
    listClient = await getServiceSupabase();
  } catch {
    /* RLS si pas de service role */
  }

  let quizRows: Awaited<ReturnType<typeof loadSchoolPedagogyInsights>>["quizRows"] = [];
  let formationTime: Awaited<ReturnType<typeof loadSchoolPedagogyInsights>>["formationTime"] = [];
  const nameById = new Map<string, string>();

  if (schoolId) {
    const overview = await loadSchoolOverviewData(schoolId, listClient);
    for (const a of overview.apprenants) {
      nameById.set(a.id, learnerDisplayName(a));
    }
    const learnerIds = overview.apprenants.map((a) => a.id).filter(Boolean);
    const insights = await loadSchoolPedagogyInsights(listClient, learnerIds);
    quizRows = insights.quizRows;
    formationTime = insights.formationTime;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-8 pt-4">
        <div className="flex flex-col gap-3 border-b border-[#E5E5EA] pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#121212] text-white shadow-sm">
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#86868B]">Pilotage</p>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Suivi formations & quiz</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#515154]">
                Résultats des quiz enregistrés dans la plateforme et temps passé sur les formations (sessions de type
                cours), pour les apprenants rattachés à votre école.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/ecole/apprenants"
            className="text-sm font-medium text-[#007AFF] hover:underline"
          >
            Mes apprenants →
          </Link>
        </div>

        {!schoolId ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Aucune école associée à ce compte : les données de suivi ne peuvent pas être chargées.
          </p>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Résultats de quiz récents</h2>
          <div className="overflow-x-auto rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E5EA] bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wide text-[#86868B]">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Apprenant</th>
                  <th className="px-4 py-3">Quiz</th>
                  <th className="px-4 py-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {quizRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[#86868B]">
                      Aucune soumission enregistrée pour vos apprenants (les quiz complétés via le lecteur LMS apparaissent
                      ici).
                    </td>
                  </tr>
                ) : (
                  quizRows.map((row) => (
                    <tr key={row.id} className="border-b border-[#F2F2F7] last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[#515154]">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-medium">{nameById.get(row.user_id) ?? row.user_id.slice(0, 8)}</td>
                      <td className="max-w-[280px] truncate px-4 py-3 text-[#515154]" title={row.test_title ?? ""}>
                        {row.test_title ?? row.test_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{row.score}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Temps passé sur les formations (par apprenant)</h2>
          <p className="text-sm text-[#515154]">
            Agrégation des sessions d&apos;apprentissage dont le contenu est une formation (cours). Le temps actif reflète
            l&apos;attention estimée lorsque le suivi fin est disponible.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-[#E5E5EA] bg-white shadow-sm">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E5EA] bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wide text-[#86868B]">
                  <th className="px-4 py-3">Apprenant</th>
                  <th className="px-4 py-3">Formation</th>
                  <th className="px-4 py-3 text-right">Temps total</th>
                  <th className="px-4 py-3 text-right">Temps actif</th>
                </tr>
              </thead>
              <tbody>
                {formationTime.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[#86868B]">
                      Aucune session de formation enregistrée pour vos apprenants.
                    </td>
                  </tr>
                ) : (
                  formationTime.map((row) => (
                    <tr key={`${row.user_id}-${row.course_id}`} className="border-b border-[#F2F2F7] last:border-0">
                      <td className="px-4 py-3 font-medium">{nameById.get(row.user_id) ?? row.user_id.slice(0, 8)}</td>
                      <td className="max-w-[320px] truncate px-4 py-3 text-[#515154]" title={row.course_title ?? ""}>
                        {row.course_title ?? row.course_id.slice(0, 8)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        {formatDurationFr(row.total_seconds)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-[#515154]">
                        {formatDurationFr(row.active_seconds)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
