import { getSession } from "@/lib/auth/session";
import { loadCareBookingsForPatient, type CareBookingRecord } from "@/lib/care/load-booking";

export async function loadPatientCareHome() {
  const session = await getSession();
  if (!session?.email) return { session: null, upcoming: [] as CareBookingRecord[], past: [] as CareBookingRecord[], next: null as CareBookingRecord | null };
  const bookings = await loadCareBookingsForPatient(session.email);
  const now = Date.now();
  const upcoming = bookings
    .filter((item) => item.status === "confirmed" && new Date(item.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const past = bookings.filter((item) => new Date(item.starts_at).getTime() < now || item.status !== "confirmed");
  return { session, upcoming, past, next: upcoming[0] ?? null };
}
