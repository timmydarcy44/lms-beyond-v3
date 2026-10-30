import { NextResponse } from "next/server";
import { reminderToken } from "@/lib/offres/reminders";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const db = getServiceRoleClient();
  if (!db || !id || token !== reminderToken(id)) {
    return new NextResponse("Lien invalide.", { status: 400 });
  }
  await db.from("applications").update({ reminders_opt_out: true }).eq("id", id);
  return new NextResponse("Les rappels de cette candidature sont arrêtés.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
