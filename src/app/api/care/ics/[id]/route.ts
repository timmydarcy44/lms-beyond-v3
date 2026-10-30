import { NextRequest, NextResponse } from "next/server";
import { buildCareBookingIcs } from "@/lib/care/ics";
import { loadCareBookingByToken } from "@/lib/care/load-booking";
import { locationText, mailInputFromBooking } from "@/lib/care/mail-copy";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const booking = await loadCareBookingByToken(id, token);
  if (!booking || booking.status !== "confirmed" || new Date(booking.ends_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const input = mailInputFromBooking(booking);
  const ics = buildCareBookingIcs({
    id: booking.id,
    startsAt: new Date(booking.starts_at),
    endsAt: new Date(booking.ends_at),
    location: locationText(input),
    method: "REQUEST",
    sequence: 0,
  });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="rendez-vous.ics"`,
    },
  });
}
