import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  expertId: z.string().uuid(),
  email: z.string().email().max(180),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Indisponible" }, { status: 500 });
  const email = parsed.data.email.trim().toLowerCase();
  const { error } = await db.from("care_slot_watches").insert({ expert_id: parsed.data.expertId, email });
  if (error && !/duplicate|unique/i.test(error.message)) {
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
