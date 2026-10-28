import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CareCancelButton } from "@/components/care/care-cancel-button";
import { canCancelCareBooking, loadCareBookingByToken } from "@/lib/care/load-booking";
import { formatCareCalendarParts } from "@/lib/care/working-days";

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
  const cal = formatCareCalendarParts(booking.starts_at);
  const cancelled = booking.status !== "confirmed";
  const canCancel = booking.status === "confirmed" && canCancelCareBooking(booking.starts_at, booking.cancellation_hours);
  const icsHref = `/api/care/ics/${booking.id}?token=${encodeURIComponent(booking.access_token)}`;

  return (
    <div className="care-confirm">
      <section className="care-confirm-hero">
        <div className="care-wrap">
          <div className="care-pop" aria-hidden="true">
            <span>✓</span>
          </div>
          <h1>{cancelled ? "Rendez-vous annulé" : `C’est réservé, ${booking.client_first_name}.`}</h1>
          <p>{booking.service_name} avec {booking.practitioner_name}</p>
          <article className="care-cal-card">
            <span className="care-cal-month">{cal.month}</span>
            <strong>{cal.day}</strong>
            <span>
              {cal.weekday} · {cal.time}
            </span>
          </article>
          {!cancelled ? (
            <div className="care-hero-actions">
              <a className="care-pill care-pill--white" href={icsHref}>
                Ajouter au calendrier
              </a>
              <Link className="care-pill care-pill--ghost" href="/login">
                Mon espace
              </Link>
            </div>
          ) : null}
        </div>
      </section>
      {!cancelled ? (
        <section className="care-wrap care-section">
          <h2>Avant votre rendez-vous</h2>
          <div className="care-grid-3">
            <article className="care-card">
              <h3>Questionnaire préalable</h3>
              <p>Quelques questions pour préparer la séance.</p>
              <a href="#">Ouvrir le questionnaire</a>
            </article>
            <article className="care-card">
              <h3>{booking.format === "visio" ? "Lien visio" : "Accès au cabinet"}</h3>
              <p>
                {booking.format === "visio"
                  ? "Le lien de connexion vous sera envoyé la veille."
                  : booking.practitioner_address || "L’adresse vous sera confirmée par e-mail."}
              </p>
            </article>
            <article className="care-card">
              <h3>Modifier / annuler</h3>
              <p>Annulation possible jusqu’à {booking.cancellation_hours} h avant.</p>
              {canCancel ? <CareCancelButton id={booking.id} token={booking.access_token} /> : <p>Le délai d’annulation est dépassé.</p>}
            </article>
          </div>
        </section>
      ) : null}
    </div>
  );
}
