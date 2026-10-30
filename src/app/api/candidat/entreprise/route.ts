import { NextResponse } from "next/server";
import { applicationRevealsCompany } from "@/lib/entreprise/application-stage";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ companies: [] });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ companies: [] });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ companies: [] });
  const jobId = new URL(request.url).searchParams.get("jobId");
  const apps = await db.from("applications").select("job_id, status, stage").eq("talent_id", user.id);
  if (apps.error) return NextResponse.json({ companies: [] });
  const ids = [
    ...new Set(
      (apps.data ?? [])
        .filter((row) => applicationRevealsCompany(row) && (!jobId || String((row as { job_id?: string }).job_id ?? "") === jobId))
        .map((row) => String((row as { job_id?: string }).job_id ?? ""))
        .filter(Boolean),
    ),
  ];
  if (!ids.length) return NextResponse.json({ companies: [] });

  const offers = await db.from("job_offers").select("id, school_id").in("id", ids);
  const schoolIds = [...new Set((offers.data ?? []).map((row) => String((row as { school_id?: string }).school_id ?? "")).filter(Boolean))];
  if (!schoolIds.length) return NextResponse.json({ companies: [] });
  const orgs = await db.from("organizations").select("id, name").in("id", schoolIds);
  const names = new Map((orgs.data ?? []).map((row) => [String((row as { id: string }).id), String((row as { name?: string | null }).name ?? "").trim()]));
  const companies = (offers.data ?? [])
    .map((row) => {
      const item = row as { id: string; school_id?: string | null };
      return { jobId: String(item.id), companyName: names.get(String(item.school_id ?? "")) ?? "" };
    })
    .filter((item) => item.companyName);
  return NextResponse.json({ companies });
}
