import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { formationAgendaToIcs, loadFormationAgenda } from "@/lib/formation-dossier/agenda";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return new NextResponse("Accès refusé", { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return new NextResponse("Service indisponible", { status: 503 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const events = await loadFormationAgenda(service, { from, to });
  const ics = formationAgendaToIcs(events);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="byound-programmation.ics"',
      "Cache-Control": "no-store",
    },
  });
}
