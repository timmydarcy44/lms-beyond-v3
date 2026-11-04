import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { id } = await params;
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ emails: [] });
  const { data, error } = await db
    .from("expert_emails")
    .select("id,subject,html,status,sender_email,template_label,created_at")
    .eq("expert_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    if (/does not exist|schema cache|42P01|PGRST205/i.test(error.message)) return NextResponse.json({ emails: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ emails: data ?? [] });
}
