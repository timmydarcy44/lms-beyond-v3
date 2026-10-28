import Link from "next/link";
import { CareCancelButton } from "@/components/care/care-cancel-button";
import { canCancelCareBooking } from "@/lib/care/load-booking";
import { loadPatientCareHome } from "@/lib/care/patient-home";
import { formatCareDateLong } from "@/lib/care/working-days";

export const dynamic = "force-dynamic";

export default async function PatientHomePage() {
  const { next, upcoming } = await loadPatientCareHome();
  return (
    <section className="care-section" style={{ paddingTop: 12 }}>
      <h1 className="care-h1" style={{ fontSize: 32 }}>Votre espace</h1>
      <p className="care-lead">Prochains rendez-vous, praticien, et suivi Byound Care.</p>
      {next ? (
        <article className="care-patient-card" style={{ marginTop: 20 }}>
          <p className="care-kicker">Prochain rendez-vous</p>
          <strong>{formatCareDateLong(next.starts_at)}</strong>
          <p>
            {next.service_name} · {next.practitioner_name}
          </p>
          <p className="care-muted">{next.format === "visio" ? "Visio" : "Cabinet"}</p>
          {canCancelCareBooking(next.starts_at, next.cancellation_hours) ? (
            <div style={{ marginTop: 12 }}>
              <CareCancelButton id={next.id} token={next.access_token} />
            </div>
          ) : null}
        </article>
      ) : (
        <article className="care-patient-card" style={{ marginTop: 20 }}>
          <strong>Aucun rendez-vous à venir</strong>
          <p className="care-muted">Choisissez un praticien pour un premier rendez-vous.</p>
          <Link className="care-pill care-pill--accent" href="/care/praticiens" style={{ marginTop: 12, display: "inline-flex" }}>
            Voir les praticiens
          </Link>
        </article>
      )}
      {upcoming.length > 1 ? (
        <div className="care-patient-list">
          {upcoming.slice(1).map((item) => (
            <article key={item.id} className="care-patient-card">
              <strong>{formatCareDateLong(item.starts_at)}</strong>
              <p>
                {item.service_name} · {item.practitioner_name}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
