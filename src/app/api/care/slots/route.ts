import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loadAvailableCareSlots } from "@/lib/care/load-available-slots";

const querySchema = z.object({
  expert: z.string().uuid(),
  service: z.string().uuid().optional(),
  from: z.string().min(10),
  to: z.string().min(10),
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    expert: req.nextUrl.searchParams.get("expert"),
    service: req.nextUrl.searchParams.get("service") || undefined,
    from: req.nextUrl.searchParams.get("from"),
    to: req.nextUrl.searchParams.get("to"),
  });
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "Période invalide" }, { status: 400 });
  }
  const slots = await loadAvailableCareSlots({
    expertId: parsed.data.expert,
    serviceId: parsed.data.service,
    from,
    to,
  });
  return NextResponse.json({
    slots: slots.map((slot) => ({
      starts_at: slot.startsAt.toISOString(),
      ends_at: slot.endsAt.toISOString(),
      format: slot.format,
    })),
  });
}
