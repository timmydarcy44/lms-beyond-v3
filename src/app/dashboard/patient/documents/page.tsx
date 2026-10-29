export const dynamic = "force-dynamic";

export default function PatientDocumentsPage() {
  return (
    <section>
      <h1 className="patient-page-title">Mes documents</h1>
      <p className="patient-page-lead">Comptes rendus, résultats et factures au même endroit.</p>
      <article className="patient-card" style={{ marginTop: 18 }}>
        <p className="patient-muted" style={{ marginTop: 0 }}>
          Aucun document partagé. Un document apparaît ici seulement si votre praticien le partage avec vous.
        </p>
      </article>
    </section>
  );
}
