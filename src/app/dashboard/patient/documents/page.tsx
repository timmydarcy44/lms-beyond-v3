import { PatientDocumentsBrowser } from "@/app/dashboard/patient/documents/documents-browser";
import { loadPatientDocuments } from "@/lib/care/patient-documents";

export const dynamic = "force-dynamic";

export default async function PatientDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string }>;
}) {
  const [{ doc }, documents] = await Promise.all([searchParams, loadPatientDocuments()]);
  return (
    <section>
      <h1 className="patient-page-title">Mes documents</h1>
      <p className="patient-page-lead">Comptes rendus, résultats et factures au même endroit.</p>
      {documents.length ? (
        <PatientDocumentsBrowser documents={documents} requestedId={doc} />
      ) : (
        <article className="patient-card" style={{ marginTop: 18 }}>
          <p className="patient-muted" style={{ marginTop: 0 }}>
            Aucun document partagé. Un document apparaît ici seulement si votre praticien le partage avec vous.
          </p>
        </article>
      )}
    </section>
  );
}
