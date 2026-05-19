import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const service = getServiceRoleClient();
  const anon = supabase;

  const run = async (label: string, client: any) => {
    try {
      // minimal select to avoid missing columns
      const res = await client.from("paths").select("id, title, org_id, path_snapshot, created_at").limit(20);
      return {
        label,
        ok: !res.error,
        error: res.error ? { message: res.error.message, code: res.error.code } : null,
        count: Array.isArray(res.data) ? res.data.length : 0,
        sample: Array.isArray(res.data)
          ? res.data.slice(0, 3).map((r: any) => ({ id: r.id, title: r.title, org_id: r.org_id }))
          : [],
      };
    } catch (e) {
      return {
        label,
        ok: false,
        error: { message: e instanceof Error ? e.message : String(e), code: "EXCEPTION" },
        count: 0,
        sample: [],
      };
    }
  };

  const [serviceResult, anonResult] = await Promise.all([
    service ? run("service_role", service) : Promise.resolve({ label: "service_role", ok: false, error: { message: "service role unavailable", code: "NO_SERVICE_ROLE" }, count: 0, sample: [] }),
    run("session_client", anon),
  ]);

  return NextResponse.json({
    userId,
    serviceRoleAvailable: !!service,
    results: [serviceResult, anonResult],
  });
}

