import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { availableCfaTests } from "@/lib/cfa/assessment-shares";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ connected: false, tests: [] });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ connected: false, tests: [] });

  const full = await db
    .from("profiles")
    .select("first_name, last_name, email, phone, cv_url, cv_file_name")
    .eq("id", session.id)
    .maybeSingle();
  const profile = full.error
    ? await db.from("profiles").select("first_name, last_name, email").eq("id", session.id).maybeSingle()
    : full;
  const row = (profile.data ?? {}) as {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    cv_url?: string | null;
    cv_file_name?: string | null;
  };
  const tests = profile.error ? [] : await availableCfaTests(db, session.id);

  return NextResponse.json({
    connected: true,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? session.email ?? "",
    phone: row.phone ?? "",
    cvName: row.cv_url ? row.cv_file_name || "CV déjà déposé" : "",
    tests,
  });
}
