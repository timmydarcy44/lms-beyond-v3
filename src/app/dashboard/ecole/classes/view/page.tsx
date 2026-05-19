import Link from "next/link";
import { redirect } from "next/navigation";
import {
  fetchSchoolGateProfile,
  resolveSchoolIdForEcoleDashboard,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function SchoolClassPromotionViewPage({
  searchParams,
}: {
  searchParams: Promise<{ promotion?: string }>;
}) {
  const { promotion: promotionRaw } = await searchParams;
  const promotion = String(promotionRaw ?? "").trim();
  if (!promotion) {
    redirect("/dashboard/ecole/classes");
  }

  const session = await getSession();
  if (!session) redirect(`/login?next=/dashboard/ecole/classes/view?promotion=${encodeURIComponent(promotion)}`);

  const supabase = await getServerClient();
  if (!supabase) redirect("/login?next=/dashboard/ecole/classes");

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
  if (!ok) redirect("/dashboard/apprenant");

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) redirect("/dashboard/ecole/classes");

  let listClient = supabase;
  try {
    listClient = await getServiceSupabase();
  } catch {
    /* RLS */
  }

  const { data: profiles } = await listClient
    .from("profiles")
    .select("id, first_name, last_name, email, phone, school_class, contract_type")
    .eq("school_id", schoolId);

  const students = (profiles || []).filter((p) => String(p.school_class ?? "").trim() === promotion);

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/dashboard/ecole/classes" className="text-indigo-600 hover:underline">
            Mes classes
          </Link>
          <span className="text-black/30">/</span>
          <span className="font-medium text-black/80">{promotion}</span>
        </div>

        <header className="rounded-3xl border border-[#E5E5EA] bg-white p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#86868B]">Regroupement libre (champ classe)</p>
          <h1 className="mt-2 text-2xl font-semibold md:text-3xl">{promotion}</h1>
          <p className="mt-3 text-sm text-[#86868B]">
            Ce groupe est dérivé du libellé « classe » sur les profils, sans fiche cursus en base. Pour la cover, le
            référentiel PDF et l’analyse IA structurée, créez un cursus officiel depuis{" "}
            <span className="font-medium text-[#1D1D1F]">Mes classes</span> puis rattachez les apprenants.
          </p>
        </header>

        <section className="rounded-3xl border border-[#E5E5EA] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Apprenants ({students.length})</h2>
          <ul className="mt-4 divide-y divide-[#E5E5EA]">
            {students.map((s: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null }) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold">
                    {(s.first_name || "") + " " + (s.last_name || "")}
                  </p>
                  <p className="text-xs text-[#86868B]">{s.email || "—"}</p>
                </div>
                <Link
                  href={`/dashboard/ecole/apprenants/${s.id}`}
                  className="rounded-full bg-[#1D1D1F] px-3 py-2 text-xs font-semibold text-white"
                >
                  Fiche apprenant
                </Link>
              </li>
            ))}
            {students.length === 0 ? (
              <li className="py-8 text-sm text-[#86868B]">Aucun apprenant avec ce libellé de classe.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
