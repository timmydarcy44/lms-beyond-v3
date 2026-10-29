"use client";

import { useEffect, useState } from "react";

type Relative = { id: string; name: string; relation: string };
type DocumentRow = { id: string; title: string; kind: string; sharedAt: string | null };
type Space = {
  context: { accountId: string | null; relatives: Relative[] };
  documents: DocumentRow[];
  journey: {
    title: string;
    steps: Array<{ title: string; status: string; date: string | null }>;
    tasks: Array<{ label: string; hint: string | null }>;
    note: string;
    resource: { title: string; kind: string; durationMin: number | null; url: string } | null;
  } | null;
  results: Array<{ id: string; title: string; submittedAt: string }>;
  invoices: Array<{ id: string; number: string | null; amountCents: number; paidAt: string | null; linked: boolean }>;
};

const KIND_LABEL: Record<string, string> = {
  report: "Compte rendu",
  invoice: "Facture",
  other: "Autre document",
};

export function CarePatientSpacePanel({ clientId }: { clientId: string }) {
  const [space, setSpace] = useState<Space | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState("");

  async function reload() {
    const response = await fetch(`/api/expert/care/patient-space?clientId=${encodeURIComponent(clientId)}`);
    if (!response.ok) return;
    setSpace(await response.json());
  }

  useEffect(() => {
    void reload();
  }, [clientId]);

  async function run(action: () => Promise<Response>) {
    setBusy(true);
    setMessage("");
    const response = await action();
    const payload = (await response.json().catch(() => null)) as { error?: string; emailSent?: boolean } | null;
    setBusy(false);
    if (!response.ok) {
      setMessage(payload?.error || "L'action n'a pas abouti.");
      return;
    }
    setMessage(payload && payload.emailSent === false ? "Partagé. L'e-mail n'a pas pu partir." : "Enregistré.");
    await reload();
  }

  if (!space) return null;
  if (!space.context.accountId) {
    return (
      <section className="care-space-panel">
        <h2>Espace du patient</h2>
        <p>Cette personne n&apos;a pas encore d&apos;espace Byound Care. Le partage sera possible dès qu&apos;un compte existe avec la même adresse e-mail.</p>
      </section>
    );
  }

  return (
    <section className="care-space-panel">
      <h2>Espace du patient</h2>
      <p>Ce qui est partagé ici apparaît dans l&apos;espace Byound Care. Le contenu d&apos;une séance n&apos;est jamais envoyé par e-mail.</p>
      {space.context.relatives.length ? (
        <label>
          Pour
          <select value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Personne concernée">
            <option value="">Le patient</option>
            {space.context.relatives.map((person) => (
              <option key={person.id} value={person.id}>{person.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          data.set("clientId", clientId);
          data.set("subjectRelativeId", subject);
          void run(async () => {
            const response = await fetch("/api/expert/care/patient-space/documents", { method: "POST", body: data });
            if (response.ok) form.reset();
            return response;
          });
        }}
      >
        <h3>Déposer un document</h3>
        <label>
          Type
          <select name="kind" defaultValue="report">
            <option value="report">Compte rendu</option>
            <option value="invoice">Facture</option>
            <option value="other">Autre</option>
          </select>
        </label>
        <label>
          Titre
          <input name="title" required maxLength={160} />
        </label>
        <label>
          Fichier
          <input name="file" type="file" accept="application/pdf,image/png,image/jpeg" required />
        </label>
        <button type="submit" disabled={busy}>Enregistrer</button>
      </form>

      {space.documents.length ? (
        <ul>
          {space.documents.map((item) => (
            <li key={item.id}>
              <span>{KIND_LABEL[item.kind] ?? "Document"} · {item.title}</span>
              {item.sharedAt ? (
                <em>Partagé</em>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => fetch(`/api/expert/care/patient-space/documents/${item.id}/share`, { method: "POST" }))}
                >
                  Partager avec le patient
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <JourneyForm clientId={clientId} subject={subject} journey={space.journey} busy={busy} onRun={run} />

      {space.results.length ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(() => fetch("/api/expert/care/patient-space/results", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientId,
                responseId: String(data.get("responseId") ?? ""),
                comment: String(data.get("comment") ?? ""),
                subjectRelativeId: subject || null,
              }),
            }));
          }}
        >
          <h3>Publier un résultat de test</h3>
          <label>
            Test
            <select name="responseId" defaultValue={space.results[0]?.id}>
              {space.results.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>
          <label>
            Commentaire pour le patient
            <textarea name="comment" required maxLength={2000} rows={4} />
          </label>
          <button type="submit" disabled={busy}>Publier</button>
        </form>
      ) : null}

      {space.invoices.length ? (
        <ul>
          {space.invoices.map((item) => (
            <li key={item.id}>
              <span>{item.number || "Facture"} · {(item.amountCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
              {item.linked ? <em>Visible pour l&apos;attestation</em> : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(() => fetch(`/api/expert/care/patient-space/invoices/${item.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ clientId, subjectRelativeId: subject || null }),
                  }))}
                >
                  Rendre disponible pour l&apos;attestation
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {message ? <p>{message}</p> : null}
    </section>
  );
}

function JourneyForm({
  clientId,
  subject,
  journey,
  busy,
  onRun,
}: {
  clientId: string;
  subject: string;
  journey: Space["journey"];
  busy: boolean;
  onRun: (action: () => Promise<Response>) => Promise<void>;
}) {
  const [steps, setSteps] = useState(journey?.steps.length ? journey.steps : [{ title: "", status: "current", date: "" }]);
  const [tasks, setTasks] = useState(journey?.tasks.length ? journey.tasks.map((task) => ({ ...task, hint: task.hint ?? "" })) : [{ label: "", hint: "" }]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        void onRun(() => fetch("/api/expert/care/patient-space", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            subjectRelativeId: subject || null,
            title: String(data.get("title") ?? ""),
            steps: steps.map((step) => ({ title: step.title, status: step.status, date: step.date || null })),
            tasks: tasks.filter((task) => task.label.trim()),
            note: String(data.get("note") ?? ""),
            resource: String(data.get("resourceUrl") ?? "").trim()
              ? {
                  title: String(data.get("resourceTitle") ?? ""),
                  kind: String(data.get("resourceKind") ?? "Lecture"),
                  durationMin: Number(data.get("resourceDuration") || 0) || null,
                  url: String(data.get("resourceUrl") ?? ""),
                }
              : null,
          }),
        }));
      }}
    >
      <h3>Accompagnement</h3>
      <label>
        Nom
        <input name="title" required defaultValue={journey?.title ?? ""} maxLength={140} />
      </label>
      {steps.map((step, index) => (
        <div key={index} className="care-space-line">
          <input
            aria-label={`Étape ${index + 1}`}
            value={step.title}
            onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))}
          />
          <select
            aria-label={`Statut de l'étape ${index + 1}`}
            value={step.status}
            onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, status: event.target.value } : item))}
          >
            <option value="done">Faite</option>
            <option value="current">En cours</option>
            <option value="todo">À venir</option>
          </select>
          <input
            type="date"
            aria-label={`Date de l'étape ${index + 1}`}
            value={step.date ?? ""}
            onChange={(event) => setSteps((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, date: event.target.value } : item))}
          />
        </div>
      ))}
      <button type="button" onClick={() => setSteps((current) => [...current, { title: "", status: "todo", date: "" }])}>Ajouter une étape</button>
      {tasks.map((task, index) => (
        <div key={index} className="care-space-line">
          <input
            aria-label={`Tâche ${index + 1}`}
            value={task.label}
            placeholder="Tâche avant la séance"
            onChange={(event) => setTasks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))}
          />
          <input
            aria-label={`Précision de la tâche ${index + 1}`}
            value={task.hint ?? ""}
            placeholder="Précision"
            onChange={(event) => setTasks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, hint: event.target.value } : item))}
          />
        </div>
      ))}
      <button type="button" onClick={() => setTasks((current) => [...current, { label: "", hint: "" }])}>Ajouter une tâche</button>
      <label>
        Mot pour le patient
        <textarea name="note" maxLength={500} rows={3} defaultValue={journey?.note ?? ""} />
      </label>
      <label>
        Ressource
        <input name="resourceTitle" defaultValue={journey?.resource?.title ?? ""} placeholder="Titre" />
      </label>
      <label>
        Adresse de la ressource
        <input name="resourceUrl" defaultValue={journey?.resource?.url ?? ""} placeholder="https://" />
      </label>
      <input type="hidden" name="resourceKind" value={journey?.resource?.kind ?? "Lecture"} />
      <input type="hidden" name="resourceDuration" value={journey?.resource?.durationMin ?? ""} />
      <button type="submit" disabled={busy}>Enregistrer l&apos;accompagnement</button>
    </form>
  );
}
