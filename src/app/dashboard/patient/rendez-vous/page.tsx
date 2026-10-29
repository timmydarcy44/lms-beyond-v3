import { CareCancelButton } from "@/components/care/care-cancel-button";
import { CareLink } from "@/components/care/care-host";
import { canCancelCareBooking } from "@/lib/care/load-booking";
import { loadPatientCareHome } from "@/lib/care/patient-home";
import { formatCareDateLong } from "@/lib/care/working-days";

export const dynamic = "force-dynamic";

export default async function PatientAppointmentsPage() {
  const { upcoming, past } = await loadPatientCareHome();
  return (
    <section className="care-section" style={{ paddingTop: 12 }}>
      <h1 className="care-h1" style={{ fontSize: 32 }}>Rendez-vous</h1>
      <h2 style={{ marginTop: 24 }}>À venir</h2>
      <div className="care-patient-list">
        {upcoming.length ? (
          upcoming.map((item) => (
            <article key={item.id} className="care-patient-card">
              <strong>{formatCareDateLong(item.starts_at)}</strong>
              <p>
                {item.service_name} · {item.practitioner_name}
              </p>
              <p className="care-muted">{item.format === "visio" ? "Visio" : "Cabinet"}</p>
              {item.practitioner_slug ? (
                <CareLink className="care-pill care-pill--ink" href={`/care/praticiens/${item.practitioner_slug}`} style={{ marginTop: 12, display: "inline-flex" }}>
                  Voir la fiche
                </CareLink>
              ) : null}
              {canCancelCareBooking(item.starts_at, item.cancellation_hours) ? (
                <div style={{ marginTop: 12 }}>
                  <CareCancelButton id={item.id} token={item.access_token} />
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <p className="care-muted">Aucun rendez-vous planifié.</p>
        )}
      </div>
      <h2 style={{ marginTop: 32 }}>Passés</h2>
      <div className="care-patient-list">
        {past.length ? (
          past.map((item) => (
            <article key={item.id} className="care-patient-card">
              <strong>{formatCareDateLong(item.starts_at)}</strong>
              <p>
                {item.service_name} · {item.practitioner_name}
              </p>
              <p className="care-muted">{item.status === "confirmed" ? "Terminé" : "Annulé"}</p>
            </article>
          ))
        ) : (
          <p className="care-muted">Pas encore d’historique.</p>
        )}
      </div>
    </section>
  );
}
