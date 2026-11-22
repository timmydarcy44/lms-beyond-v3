import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveLearnerSituation } from "@/lib/apprenant/learner-situation";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const situation = await resolveLearnerSituation(db, session.id);
  if (!situation.showAlternanceNav || !situation.companyId) {
    return NextResponse.json({
      assigned: false,
      company: null,
      tutor: null,
      contract: null,
    });
  }

  const companyId = situation.companyId;
  const [{ data: company }, tutorFromProfile, tutorFromCompany] = await Promise.all([
    db
      .from("cfa_companies")
      .select("id, company_name, city, company_address, siret")
      .eq("id", companyId)
      .maybeSingle(),
    situation.tutorId
      ? db
          .from("profiles")
          .select("id, first_name, last_name, full_name, email")
          .eq("id", situation.tutorId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    situation.applicationId
      ? db
          .from("apprentice_placements")
          .select("tutor_id")
          .eq("apprentice_id", situation.applicationId)
          .in("status", ["active", "pending"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let tutor: {
    id: string | null;
    name: string | null;
    email: string | null;
    jobTitle: string | null;
  } | null = null;

  if (tutorFromProfile.data) {
    const t = tutorFromProfile.data as {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      full_name?: string | null;
      email?: string | null;
    };
    tutor = {
      id: t.id,
      name:
        [t.first_name, t.last_name].filter(Boolean).join(" ").trim() ||
        String(t.full_name ?? "").trim() ||
        null,
      email: t.email ? String(t.email) : null,
      jobTitle: null,
    };
  }

  const companyTutorId = String(
    (tutorFromCompany.data as { tutor_id?: string | null } | null)?.tutor_id ?? "",
  ).trim();
  if (companyTutorId) {
    const { data: ct } = await db
      .from("company_tutors")
      .select("id, first_name, last_name, email, job_title, user_id")
      .eq("id", companyTutorId)
      .maybeSingle();
    if (ct) {
      const row = ct as {
        id: string;
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
        job_title?: string | null;
        user_id?: string | null;
      };
      const name =
        [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || null;
      if (!tutor?.name) {
        tutor = {
          id: row.user_id || row.id,
          name,
          email: row.email ? String(row.email) : tutor?.email ?? null,
          jobTitle: row.job_title ? String(row.job_title) : null,
        };
      } else {
        tutor = {
          ...tutor,
          email: tutor.email || (row.email ? String(row.email) : null),
          jobTitle: row.job_title ? String(row.job_title) : tutor.jobTitle,
        };
      }
    }
  }

  const co = company as {
    id: string;
    company_name?: string | null;
    city?: string | null;
    company_address?: string | null;
    siret?: string | null;
  } | null;

  return NextResponse.json({
    assigned: true,
    company: co
      ? {
          id: co.id,
          name: String(co.company_name ?? "").trim() || "Entreprise d’accueil",
          city: co.city ? String(co.city).trim() : null,
          address: co.company_address ? String(co.company_address).trim() : null,
          siret: co.siret ? String(co.siret).trim() : null,
        }
      : null,
    tutor,
    contract: {
      id: situation.activeContractId,
      applicationId: situation.applicationId,
    },
  });
}
