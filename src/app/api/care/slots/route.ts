import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/server";

const querySchema = z.object({
  expert: z.string().uuid(),
  service: z.string().uuid(),
  from: z.string().min(10),
  to: z.string().min(10),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    expert: req.nextUrl.searchParams.get("expert"),
    service: req.nextUrl.searchParams.get("service"),
    from: req.nextUrl.searchParams.get("from"),
    to: req.nextUrl.searchParams.get("to"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ slots: [] });
  const { data, error } = await db.rpc("get_available_slots", {
    p_expert_id: parsed.data.expert,
    p_service_id: parsed.data.service,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) return NextResponse.json({ slots: [] });
  const slots = (data ?? []).map((row: { starts_at?: string; ends_at?: string; format?: string }) => ({
    starts_at: String(row.starts_at ?? ""),
    ends_at: String(row.ends_at ?? ""),
    format: row.format === "cabinet" ? "cabinet" : "visio",
  }));
  return NextResponse.json({ slots });
}
