import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type Body = {
  title?: string;
  city?: string | null;
  salary?: string | null;
  salary_range?: string | null;
  contract_type?: string | null;
  description?: string | null;
  status?: string | null;
  company_name?: string | null;
  company_hidden_from_learner?: boolean;
  target_soft_skills?: string[] | null;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
  }

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) {
    return NextResponse.json({ error: "École non identifiée" }, { status: 403 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 });
  }

  const skills = Array.isArray(body.target_soft_skills)
    ? body.target_soft_skills.map((s) => String(s ?? "").trim()).filter(Boolean).slice(0, 24)
    : [];

  const row: Record<string, unknown> = {
    school_id: schoolId,
    title,
    city: body.city != null ? String(body.city).trim() || null : null,
    salary: body.salary != null ? String(body.salary).trim() || null : null,
    salary_range: body.salary_range != null ? String(body.salary_range).trim() || null : null,
    contract_type: body.contract_type != null ? String(body.contract_type).trim() || null : null,
    description: body.description != null ? String(body.description).trim() || null : null,
    status: (() => {
      const s = String(body.status ?? "active").trim().toLowerCase();
      return s.length ? s : "active";
    })(),
  };

  if (body.company_name != null && String(body.company_name).trim()) {
    row.company_name = String(body.company_name).trim();
  }
  if (typeof body.company_hidden_from_learner === "boolean") {
    row.company_hidden_from_learner = body.company_hidden_from_learner;
  }
  if (skills.length) {
    row.target_soft_skills = skills;
  }

  let writeClient = supabase;
  try {
    writeClient = await getServiceSupabase();
  } catch {
    /* RLS navigateur */
  }

  const { data, error } = await writeClient.from("job_offers").insert(row).select("id").single();

  if (error) {
    console.error("[api/dashboard/ecole/job-offers]", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id: data?.id });
}
