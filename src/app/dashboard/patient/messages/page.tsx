export const dynamic = "force-dynamic";

export default function PatientMessagesPage() {
  return (
    <section>
      <h1 className="patient-page-title">Messages</h1>
      <article className="patient-card" style={{ marginTop: 18 }}>
        <p className="patient-muted" style={{ marginTop: 0 }}>
          Aucun message. Les échanges avec votre praticien apparaîtront ici.
        </p>
      </article>
    </section>
  );
}