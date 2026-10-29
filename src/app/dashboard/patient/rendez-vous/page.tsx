import Link from "next/link";
import { CareCancelButton } from "@/components/care/care-cancel-button";
import { bookingPlace, bookingSubtitle } from "@/app/dashboard/patient/_ui/format";
import { canCancelCareBooking, type CareBookingRecord } from "@/lib/care/load-booking";
import { loadPatientCareHome } from "@/lib/care/patient-home";
import { formatPersonName } from "@/lib/care/person-name";
import { formatCareDateLong } from "@/lib/care/working-days";

export const dynamic = "force-dynamic";

function BookingCard({ item, past = false }: { item: CareBookingRecord; past?: boolean }) {
  const name = formatPersonName(item.practitioner_name);
  const place = bookingPlace(item);
  return (
    <article className="patient-card">
      <strong>{formatCareDateLong(item.starts_at)}</strong>
      <p className="patient-sub">{[name, bookingSubtitle(item)].filter(Boolean).join(" · ")}</p>
      {past ? <p className="patient-muted">{item.status === "confirmed" ? "Terminé" : "Annulé"}</p> : null}
      {!past && item.format !== "visio" && !place ? <p className="patient-muted">Lieu à confirmer</p> : null}
      <div className="patient-row-actions" style={{ marginTop: 12 }}>
        {item.practitioner_slug ? (
          <Link className="patient-pill patient-pill--soft" href={`/care/praticiens/${item.practitioner_slug}`}>
            Voir la fiche
          </Link>
        ) : null}
        {!past && canCancelCareBooking(item.starts_at, item.cancellation_hours) ? (
          <CareCancelButton id={item.id} token={item.access_token} />
        ) : null}
      </div>
    </article>
  );
}

export default async function PatientAppointmentsPage() {
  const { upcoming, past } = await loadPatientCareHome();
  return (
    <section>
      <h1 className="patient-page-title">Rendez-vous</h1>
      <h2 className="patient-section-label">À venir</h2>
      <div className="patient-list">
        {upcoming.length ? (
          upcoming.map((item) => <BookingCard key={item.id} item={item} />)
        ) : (
          <p className="patient-muted">Aucun rendez-vous planifié.</p>
        )}
      </div>
      <h2 className="patient-section-label">Passés</h2>
      <div className="patient-list">
        {past.length ? (
          past.map((item) => <BookingCard key={item.id} item={item} past />)
        ) : (
          <p className="patient-muted">Pas encore d&apos;historique.</p>
        )}
      </div>
    </section>
  );
}
