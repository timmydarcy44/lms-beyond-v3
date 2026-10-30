"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, X } from "lucide-react";
import { DocumentKindMark } from "@/app/dashboard/patient/_ui/document-kind";
import { parisDayLabel, parisLongDate, parisMonthTitle } from "@/app/dashboard/patient/_ui/format";
import {
  DOCUMENT_KIND_LABEL,
  type CareDocumentKind,
  type PatientDocument,
} from "@/lib/care/patient-document-model";
import { patientTokens } from "@/app/dashboard/patient/_ui/tokens";

const TABS: Array<{ id: "all" | CareDocumentKind; label: string }> = [
  { id: "all", label: "Tout" },
  { id: "report", label: "Comptes rendus" },
  { id: "test_result", label: "Résultats de tests" },
  { id: "invoice", label: "Factures" },
  { id: "other", label: "Autres" },
];

export function PatientDocumentsBrowser({
  documents,
  requestedId,
}: {
  documents: PatientDocument[];
  requestedId?: string;
}) {
  const router = useRouter();
  const requested = documents.some((item) => item.id === requestedId) ? requestedId : undefined;
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(requested ?? null);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [fileSettled, setFileSettled] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (requested) {
      setSelectedId(requested);
      return;
    }
    if (window.matchMedia("(min-width: 1100px)").matches) {
      setSelectedId((current) => current ?? documents[0]?.id ?? null);
    }
  }, [documents, requested]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr-FR");
    return documents.filter((item) => {
      if (tab !== "all" && item.kind !== tab) return false;
      if (!needle) return true;
      return `${item.title} ${item.practitionerName}`.toLocaleLowerCase("fr-FR").includes(needle);
    });
  }, [documents, query, tab]);

  const groups = useMemo(() => {
    const buckets = new Map<string, PatientDocument[]>();
    for (const item of visible) {
      const key = parisMonthTitle(item.sharedAt);
      buckets.set(key, [...(buckets.get(key) ?? []), item]);
    }
    return [...buckets.entries()];
  }, [visible]);

  const selected = documents.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) return;
    let cancel = false;
    setSignedUrl(null);
    setFileSettled(false);
    setPreviewError(false);
    void fetch(`/api/care/patient/documents/${selectedId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("missing");
        return response.json() as Promise<{ signedUrl?: string | null }>;
      })
      .then((body) => {
        if (cancel) return;
        setSignedUrl(body.signedUrl ?? null);
        setFileSettled(true);
        setOpenedIds((current) => (current.includes(selectedId) ? current : [...current, selectedId]));
        router.refresh();
      })
      .catch(() => {
        if (!cancel) {
          setPreviewError(true);
          setFileSettled(true);
        }
      });
    return () => {
      cancel = true;
    };
  }, [router, selectedId]);

  function isNew(item: PatientDocument) {
    return !item.openedAt && !openedIds.includes(item.id);
  }

  return (
    <div className="patient-docs">
      <div>
        <div className="patient-doc-toolbar">
          <div className="patient-doc-tabs" role="tablist" aria-label="Types de documents">
            {TABS.map((item) => {
              const count = item.id === "all" ? documents.length : documents.filter((doc) => doc.kind === item.id).length;
              const on = tab === item.id;
              return (
                <button key={item.id} type="button" role="tab" aria-selected={on} className={on ? "is-on" : ""} onClick={() => setTab(item.id)}>
                  {item.label}
                  {count > 0 ? <span>{count}</span> : null}
                </button>
              );
            })}
          </div>
          <form className="patient-doc-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un document"
              aria-label="Rechercher un document"
            />
          </form>
        </div>
        {groups.length ? (
          groups.map(([month, rows]) => (
            <section key={month} className="patient-doc-month">
              <h2>{month}</h2>
              <div className="patient-card patient-doc-card">
                {rows.map((item) => {
                  const on = item.id === selectedId;
                  return (
                    <div key={item.id} className={on ? "patient-doc-row is-on" : "patient-doc-row"}>
                      <button type="button" className="patient-doc-open" onClick={() => setSelectedId(item.id)}>
                        <DocumentKindMark kind={item.kind} />
                        <span>
                          <strong>
                            {item.title}
                            {isNew(item) ? <em>Nouveau</em> : null}
                          </strong>
                          <small>
                            {parisDayLabel(item.sharedAt)} · {item.practitionerName}
                          </small>
                        </span>
                        <span className="patient-doc-kind">{DOCUMENT_KIND_LABEL[item.kind]}</span>
                      </button>
                      {item.hasFile ? (
                        <a
                          className="patient-doc-download"
                          href={`/api/care/patient/documents/${item.id}?download=1`}
                          aria-label={`Télécharger ${item.title}`}
                        >
                          <Download size={16} aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <article className="patient-card" style={{ marginTop: 16 }}>
            <p className="patient-muted" style={{ marginTop: 0 }}>
              {documents.length ? "Aucun document dans cette catégorie." : "Aucun document partagé. Un document apparaît ici seulement si votre praticien le partage avec vous."}
            </p>
          </article>
        )}
      </div>

      {selected ? (
        <aside className="patient-doc-preview is-open" aria-label="Aperçu du document">
          <div className="patient-doc-panel">
            <button type="button" className="patient-doc-close" aria-label="Fermer l'aperçu" onClick={() => setSelectedId(null)}>
              <X size={18} aria-hidden />
            </button>
            {selected.test ? (
              <TestPreview document={selected} />
            ) : previewError ? (
              <p className="patient-muted">Ce document n&apos;est pas disponible.</p>
            ) : (
              <FilePreview document={selected} signedUrl={signedUrl} settled={fileSettled} />
            )}
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function TestPreview({ document }: { document: PatientDocument }) {
  const test = document.test;
  if (!test) return null;
  return (
    <div>
      <p className="patient-doc-badge" style={{ background: patientTokens.kinds.test.bg, color: patientTokens.kinds.test.fg }}>
        Résultat de test
      </p>
      <h2>{document.title}</h2>
      <p className="patient-muted">
        Passé le {parisLongDate(test.takenAt)} · Commenté par {document.practitionerName} le {parisLongDate(test.commentedAt)}
      </p>
      <div className="patient-scores">
        {test.scores.map((score, index) => (
          <div key={`${score.label}-${index}`}>
            <div className="patient-score-label">
              <span>{score.label}</span>
              <span>
                {score.value} / {score.max}
              </span>
            </div>
            <div className="patient-score-track" aria-hidden>
              <span style={{ width: `${Math.min(100, (score.value / score.max) * 100)}%`, background: index < 2 ? patientTokens.accent : patientTokens.scoreLate }} />
            </div>
          </div>
        ))}
      </div>
      <div className="patient-doc-comment">
        <strong>
        {document.practitionerName === "Votre praticien"
          ? "Commentaire de votre praticien"
          : `Commentaire de ${document.practitionerName.split(" ")[0]}`}
      </strong>
        <p>{test.comment}</p>
      </div>
      <p className="patient-doc-note">
        Un résultat de test est un point de départ pour échanger, pas une étiquette. Visible uniquement par vous et {document.practitionerName}.
      </p>
    </div>
  );
}

function FilePreview({ document, signedUrl, settled }: { document: PatientDocument; signedUrl: string | null; settled: boolean }) {
  const tone = document.kind === "test_result" ? patientTokens.kinds.test : patientTokens.kinds[document.kind];
  return (
    <div>
      <p className="patient-doc-badge" style={{ background: tone.bg, color: tone.fg }}>
        {DOCUMENT_KIND_LABEL[document.kind]}
      </p>
      <h2>{document.title}</h2>
      <p className="patient-muted">
        Partagé par {document.practitionerName} · {parisLongDate(document.sharedAt)}
      </p>
      {signedUrl ? (
        <>
          <iframe className="patient-doc-frame" title={document.title} src={signedUrl} />
          <a className="patient-pill patient-pill--primary" href={`/api/care/patient/documents/${document.id}?download=1`}>
            Télécharger
          </a>
        </>
      ) : (
        <p className="patient-muted">
          {!document.hasFile
            ? "Aucun fichier n'est joint à ce document."
            : settled
              ? "Le fichier n'est pas disponible pour le moment."
              : "Préparation du fichier…"}
        </p>
      )}
    </div>
  );
}
