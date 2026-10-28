import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CareCancelButton } from "@/components/care/care-cancel-button";
import { formatCarePrice } from "@/lib/care/care.config";
import { canCancelCareBooking, loadCareBookingByToken } from "@/lib/care/load-booking";
import { formatCareDateLong } from "@/lib/care/working-days";

export const metadata: Metadata = {
  title: "Réservation confirmée",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> };

export default async function CareReservationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { token } = await searchParams;
  const booking = await loadCareBookingByToken(id, token ?? "");
  if (!booking) notFound();
  const cancelled = booking.status !== "confirmed";
  const canCancel = booking.status === "confirmed" && canCancelCareBooking(booking.starts_at, booking.cancellation_hours);
  const icsHref = `/api/care/ics/${booking.id}?token=${encodeURIComponent(booking.access_token)}`;
  const rows = [
    ["Praticien", booking.practitioner_name],
    ["Séance", booking.service_name],
    ["Quand", formatCareDateLong(booking.starts_at)],
    ["Format", booking.format === "visio" ? "Visio" : "Cabinet"],
  ];

  return (
    <div className="care-rev">
      <div className="care-rev-card">
        <div className={`care-rev-mark${cancelled ? " is-off" : ""}`} aria-hidden>
          {cancelled ? "×" : "✓"}
        </div>
        <p className="care-rev-kicker">{cancelled ? "Annulé" : "Confirmé"}</p>
        <h1>{cancelled ? "Rendez-vous annulé" : `C’est réservé, ${booking.client_first_name}.`}</h1>
        <p className="care-rev-amount">{formatCarePrice(booking.price_cents)}</p>
        <p className="care-rev-hint">{cancelled ? "Ce créneau a été libéré." : "Réglé sur place · aucun prélèvement maintenant"}</p>
        <ul className="care-rev-rows">
          {rows.map(([label, value]) => (
            <li key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </li>
          ))}
        </ul>
        {!cancelled ? (
          <div className="care-rev-actions">
            <a className="care-rev-primary" href={icsHref}>
              Ajouter au calendrier
            </a>
            <Link className="care-rev-secondary" href="/dashboard/patient">
              Ouvrir mon espace
            </Link>
            <p className="care-rev-cancel-hint">
              Annulation possible jusqu’à {booking.cancellation_hours} h avant.
            </p>
            {canCancel ? <CareCancelButton id={booking.id} token={booking.access_token} /> : null}
          </div>
        ) : (
          <Link className="care-rev-primary" href="/care/praticiens">
            Reprendre un rendez-vous
          </Link>
        )}
      </div>
    </div>
  );
}
