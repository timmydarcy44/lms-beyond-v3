import { NextRequest, NextResponse } from "next/server";
import { buildCareBookingIcs } from "@/lib/care/ics";
import { loadCareBookingByToken } from "@/lib/care/load-booking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const booking = await loadCareBookingByToken(id, token);
  if (!booking || booking.status !== "confirmed") {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const ics = buildCareBookingIcs({
    id: booking.id,
    title: `${booking.service_name} — ${booking.practitioner_name}`,
    startsAt: new Date(booking.starts_at),
    endsAt: new Date(booking.ends_at),
    location: booking.format === "visio" ? "Visio Byound Care" : booking.practitioner_address || "Cabinet",
    description: "Rendez-vous Byound Care",
  });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="rendez-vous.ics"`,
    },
  });
}
