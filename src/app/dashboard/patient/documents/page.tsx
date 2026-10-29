import { PatientDocumentsBrowser } from "@/app/dashboard/patient/documents/documents-browser";
import { loadPatientDocuments } from "@/lib/care/patient-documents";
import { activeSubjectId, loadPatientRelatives, sameSubject } from "@/lib/care/patient-relatives";

export const dynamic = "force-dynamic";

export default async function PatientDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ doc?: string; personne?: string }>;
}) {
  const [{ doc, personne }, documents, relatives] = await Promise.all([searchParams, loadPatientDocuments(), loadPatientRelatives()]);
  const subjectId = activeSubjectId(personne, relatives);
  const visible = documents.filter((item) => sameSubject(item.subjectRelativeId, subjectId));
  return (
    <section>
      <h1 className="patient-page-title">Mes documents</h1>
      <p className="patient-page-lead">Comptes rendus, résultats et factures au même endroit.</p>
      {visible.length ? (
        <PatientDocumentsBrowser documents={visible} requestedId={doc} />
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
