"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { REASON_CODES } from "@/lib/control/constants";
import { formatEuroDelta, formatEurosHt } from "@/lib/control/policy";
import type { loadAccountDetail } from "@/lib/control/load";

type Detail = Awaited<ReturnType<typeof loadAccountDetail>>;
type Tab = "overview" | "members" | "courses" | "badges" | "tests" | "revenue" | "funding" | "documents" | "modules" | "journal" | "notes";

const MODULES = [
  { key: "beyond_lms", label: "LMS et parcours" },
  { key: "open_badges", label: "Open Badges" },
  { key: "tests", label: "Tests" },
  { key: "beyond_care", label: "Byound Care" },
];

function moduleState(keys: string[], key: string) {
  if (key === "beyond_care") {
    return keys.includes("beyond_care") || keys.includes("mental_health_tracking") ? "Option active" : "Non activé";
  }
  return keys.includes(key) ? "Option active" : "Non activé";
}

export function AccountFile({ detail }: { detail: Detail }) {
  const account = detail.account;
  const [tab, setTab] = useState<Tab>("overview");
  const [panel, setPanel] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  if (!account) return <p className="p-8">Compte introuvable.</p>;

  const delta = account.revenue12HtCents - account.revenuePrev12HtCents;
  const actions = [
    ["Inviter des collaborateurs", "invite"],
    ["Assigner une formation", "course"],
    ["Envoyer les tests", "tests"],
    ["Dossier OPCO", "opco"],
    ["Délivrer un badge", "badge"],
    ["Ajouter un document", "document"],
  ] as const;

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8">
      <p className="mb-3 text-sm text-[#9AA6C2]">
        <Link href="/super/organisations">Comptes clients</Link> · {account.name}
      </p>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-extrabold tracking-[-1.2px]">{account.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Pill>{account.status === "active" ? "Actif" : account.status === "demo" ? "Démo" : account.status === "onboarding" ? "À configurer" : account.status}</Pill>
            <Pill>{account.kind === "internal" ? "Interne" : "Entreprise"}</Pill>
            {account.clientSince ? <Pill>Client depuis {new Date(account.clientSince).toLocaleDateString("fr-FR")}</Pill> : null}
            <Pill>{account.accountManagerName ?? "Chargé de compte non assigné"}</Pill>
            <Pill>CA 12 mois · {formatEurosHt(account.revenue12HtCents)} HT</Pill>
          </div>
        </div>
        <div className="flex gap-2">
          {detail.members[0]?.email ? (
            <a href={`mailto:${detail.members[0].email}`} className="rounded-full border border-[#26304F] px-4 py-2 text-sm">Contacter l'admin</a>
          ) : null}
          <button type="button" onClick={() => setPanel("invite")} className="rounded-full border border-[#26304F] px-4 py-2 text-sm">Faire une action</button>
          <button type="button" onClick={() => setWriteOpen(true)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Ouvrir son espace</button>
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto text-sm">
        {(
          [
            ["overview", "Vue d'ensemble"],
            ["members", "Membres"],
            ["courses", "Formations"],
            ["badges", "Open Badges"],
            ["tests", "Tests"],
            ["revenue", "Chiffre d'affaires"],
            ["funding", "Financement"],
            ["documents", "Documents"],
            ["modules", "Modules"],
            ["journal", "Journal"],
            ["notes", "Notes"],
          ] as Array<[Tab, string]>
        ).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className="rounded-full px-3 py-1.5" style={{ background: tab === key ? "#6E5BFF" : "transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {message ? <p className="mt-4 text-sm text-[#6BE39B]">{message}</p> : null}

      {tab === "overview" ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_.8fr]">
          <div className="space-y-4">
            <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
              <h2 className="text-lg font-bold">Agir pour {account.name}</h2>
              <div className="mt-4 flex flex-wrap gap-4">
                {actions.map(([label, key]) => (
                  <button key={key} type="button" onClick={() => setPanel(key)} className="w-28 text-center text-xs">
                    <span className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full bg-[#6E5BFF] text-lg">+</span>
                    {label}
                  </button>
                ))}
              </div>
            </section>
            <div className="grid gap-3 md:grid-cols-4">
              <Mini label="Utilisateurs actifs" value={`${account.activeUsers} / ${account.totalUsers}`} />
              <Mini label="Formations en cours" value={String(detail.courses.length)} />
              <Mini label="Open Badges délivrés" value="0" />
              <Mini label="Prochaine session" value="—" />
            </div>
            <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-[#9AA6C2]">Chiffre d'affaires HT</p>
                  <p className="text-3xl font-extrabold">{formatEurosHt(account.revenue12HtCents)}</p>
                  <p className="text-sm" style={{ color: delta < 0 ? "#FF8A9B" : "#6BE39B" }}>{formatEuroDelta(delta)} vs 12 mois précédents</p>
                </div>
                <p className="text-xs text-[#9AA6C2]">12 mois</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <Mini label="Encaissé" value={formatEurosHt(account.revenue12HtCents - account.outstandingHtCents)} />
                <Mini label="À encaisser" value={formatEurosHt(account.outstandingHtCents)} />
                <Mini label="Devis en cours" value={formatEurosHt(account.openQuoteHtCents)} />
                <Mini label="Financé par l'OPCO" value={formatEurosHt(0)} />
              </div>
              <p className="mt-4 text-xs text-[#9AA6C2]">Aucune facture client n'est encore rattachée. Les devis ne sont pas dans le CA.</p>
            </section>
            <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
              <h2 className="font-bold">À faire</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {account.signal ? <li className="flex items-center justify-between gap-3"><span>{account.signal.label}</span><button type="button" className="rounded-full border border-[#26304F] px-3 py-1" onClick={() => setPanel("invite")}>Agir</button></li> : <li className="text-[#9AA6C2]">Rien d'automatique pour le moment.</li>}
              </ul>
            </section>
            <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
              <h2 className="font-bold">Journal du compte</h2>
              <Activity items={detail.activity.slice(0, 5)} name={account.name} />
            </section>
          </div>
          <aside className="space-y-4">
            <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5 text-sm">
              <h2 className="font-bold">Démarrage</h2>
              <ul className="mt-3 space-y-2 text-[#C9D2E8]">
                <li>{account.logoUrl ? "Logo déposé" : "Logo à déposer"}</li>
                <li>{detail.members.length ? "Admin invité" : "Admin à inviter"}</li>
                <li>{detail.employees.length ? "Collaborateurs importés" : "Collaborateurs à importer"}</li>
                <li>{detail.courses.length ? "Première formation assignée" : "Première formation à assigner"}</li>
                <li>Tests à envoyer</li>
              </ul>
            </section>
            <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5 text-sm">
              <h2 className="font-bold">Contacts</h2>
              <ul className="mt-3 space-y-2">
                {detail.members.map((member) => (
                  <li key={member.userId}>{member.name}<span className="block text-xs text-[#9AA6C2]">{member.email}</span></li>
                ))}
              </ul>
            </section>
            <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5 text-sm">
              <h2 className="font-bold">Offre et modules</h2>
              <ul className="mt-3 space-y-2">{MODULES.map((module) => <li key={module.key} className="flex justify-between"><span>{module.label}</span><span className="text-[#9AA6C2]">{moduleState(account.modules, module.key)}</span></li>)}</ul>
            </section>
            <NoteForm orgId={account.id} initial={detail.note?.body ?? ""} onSaved={setMessage} />
          </aside>
        </div>
      ) : null}

      {tab === "members" ? <MembersTab detail={detail} onMessage={setMessage} /> : null}
      {tab === "courses" ? <SimpleList title="Formations de l'organisation" rows={detail.courses.map((course) => course.title || "Formation")} /> : null}
      {tab === "badges" ? <SimpleList title="Open Badges" rows={["Les badges délivrés se lisent via les assertions du profil. Aucune assertion n'est agrégée sur ce compte."]} /> : null}
      {tab === "tests" ? <SimpleList title="Tests" rows={["Les résultats individuels restent masqués en accompagnement. L'envoi se fait depuis l'action « Envoyer les tests »."]} /> : null}
      {tab === "revenue" ? <RevenueTab documents={detail.documents} /> : null}
      {tab === "funding" ? <SimpleList title="Financement" rows={["Aucun dossier OPCO n'est rattaché à ce compte. La table leads_opco n'est pas encore appliquée."]} /> : null}
      {tab === "documents" ? <SimpleList title="Documents" rows={detail.documents.length ? detail.documents.map((doc) => doc.number || doc.doc_type) : ["Aucun document de facturation."]} /> : null}
      {tab === "modules" ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {MODULES.map((module) => (
            <article key={module.key} className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-4">
              <h3 className="font-semibold">{module.label}</h3>
              <p className="mt-2 text-sm text-[#9AA6C2]">{moduleState(account.modules, module.key)}</p>
              <p className="mt-1 text-xs text-[#9AA6C2]">Date et auteur d'activation : non renseignés. Byound Care reprend l'ancien suivi de bien-être.</p>
            </article>
          ))}
        </div>
      ) : null}
      {tab === "journal" ? <div className="mt-5 rounded-[28px] border border-[#1A2340] bg-[#111831] p-5"><Activity items={detail.activity} name={account.name} /></div> : null}
      {tab === "notes" ? <div className="mt-5 max-w-xl"><NoteForm orgId={account.id} initial={detail.note?.body ?? ""} onSaved={setMessage} /></div> : null}

      {panel ? (
        <ActionPanel
          orgId={account.id}
          kind={panel}
          onClose={() => setPanel(null)}
          onDone={(text) => {
            setMessage(text);
            setPanel(null);
          }}
        />
      ) : null}
      {writeOpen ? <OpenSpaceDialog orgId={account.id} orgName={account.name} onClose={() => setWriteOpen(false)} /> : null}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-[#1A2340] px-2 py-1">{children}</span>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[22px] border border-[#1A2340] bg-[#0B1122] p-3"><p className="text-xs text-[#9AA6C2]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function Activity({ items, name }: { items: Detail["activity"]; name: string }) {
  if (!items.length) return <p className="mt-3 text-sm text-[#9AA6C2]">Aucune action enregistrée.</p>;
  return (
    <ul className="mt-3 space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.id}>
          <span className="text-[#C4B8FF]">{item.actor_type === "byound_on_behalf" ? `Byound pour ${name}` : "Client"}</span>
          {" · "}{item.action}{" · "}{new Date(item.created_at).toLocaleString("fr-FR")}
        </li>
      ))}
    </ul>
  );
}

function SimpleList({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="mt-5 rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
      <h2 className="font-bold">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">{rows.map((row) => <li key={row}>{row}</li>)}</ul>
    </section>
  );
}

function NoteForm({ orgId, initial, onSaved }: { orgId: string; initial: string; onSaved: (message: string) => void }) {
  const [body, setBody] = useState(initial);
  return (
    <form
      className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch(`/api/super/comptes-clients/${orgId}/note`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const json = (await response.json()) as { error?: string };
        onSaved(response.ok ? "Note interne enregistrée." : json.error || "Note impossible");
      }}
    >
      <h2 className="font-bold">Note interne</h2>
      <p className="mt-1 text-xs text-[#9AA6C2]">Visible uniquement par le staff Byound.</p>
      <textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-3 min-h-28 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] p-3 text-sm" />
      <button type="submit" className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Enregistrer</button>
    </form>
  );
}

function MembersTab({ detail, onMessage }: { detail: Detail; onMessage: (message: string) => void }) {
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const [errors, setErrors] = useState<Array<{ line: number; message: string }>>([]);
  const account = detail.account;
  if (!account) return null;

  return (
    <section className="mt-5 rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
      <h2 className="font-bold">Membres</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {detail.members.map((member) => <li key={member.userId}>{member.name} · {member.role} · {member.email}</li>)}
        {detail.employees.map((employee) => <li key={employee.id}>{employee.first_name} {employee.last_name} · {employee.email} · {employee.status ?? "actif"}</li>)}
      </ul>
      <label className="mt-4 block text-sm">
        Importer un fichier .csv ou .xlsx
        <input
          type="file"
          accept=".csv,.xlsx"
          className="mt-2 block text-xs"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
            const sheet = book.Sheets[book.SheetNames[0] ?? ""];
            const raw = XLSX.utils.sheet_to_json<Record<string, string>>(sheet ?? {}, { defval: "" });
            setPreview(raw.slice(0, 8));
            const rows = raw.map((row) => mapColumns(row));
            const response = await fetch(`/api/super/comptes-clients/${account.id}/import`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rows }),
            });
            const json = (await response.json()) as { created?: number; errors?: Array<{ line: number; message: string }>; error?: string };
            setErrors(json.errors ?? []);
            onMessage(response.ok ? `${json.created ?? 0} collaborateurs importés.` : json.error || "Import impossible");
          }}
        />
      </label>
      {preview.length ? (
        <div className="mt-3 overflow-auto text-xs text-[#C9D2E8]">
          Aperçu : {preview.map((row) => Object.values(row).join(" · ")).join(" | ")}
        </div>
      ) : null}
      {errors.length ? <ul className="mt-3 text-sm text-[#FF8A9B]">{errors.map((error) => <li key={`${error.line}-${error.message}`}>Ligne {error.line} : {error.message}</li>)}</ul> : null}
    </section>
  );
}

function mapColumns(row: Record<string, string>) {
  const entries = Object.entries(row).map(([key, value]) => [key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(), String(value)] as const);
  const find = (...names: string[]) => entries.find(([key]) => names.some((name) => key.includes(name)))?.[1] ?? "";
  return {
    firstName: find("prenom", "first"),
    lastName: find("nom", "last"),
    email: find("email", "mail"),
    jobTitle: find("poste", "job", "titre"),
    department: find("service", "departement", "department"),
  };
}

function RevenueTab({ documents }: { documents: Detail["documents"] }) {
  const csv = useMemo(() => {
    const header = "type,numero,date,ht,statut,echeance";
    const lines = documents.map((doc) => [doc.doc_type, doc.number ?? "", doc.issued_at, (doc.amount_ht_cents / 100).toFixed(2), doc.status, doc.due_at ?? ""].join(","));
    return [header, ...lines].join("\n");
  }, [documents]);
  return (
    <section className="mt-5 rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Factures, devis, avoirs</h2>
        <a className="rounded-full border border-[#26304F] px-3 py-1 text-sm" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="chiffre-affaires.csv">Export CSV</a>
      </div>
      {documents.length === 0 ? <p className="mt-3 text-sm text-[#9AA6C2]">Aucune pièce. Le CA reste à 0 € HT.</p> : (
        <ul className="mt-3 space-y-2 text-sm">
          {documents.map((doc) => (
            <li key={doc.id} className="flex justify-between gap-3">
              <span>{doc.number || doc.doc_type} · {new Date(doc.issued_at).toLocaleDateString("fr-FR")} · {formatEurosHt(doc.amount_ht_cents)} · {doc.status}</span>
              {doc.doc_type === "invoice" && !doc.paid_at ? <RemindButton id={doc.id} /> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RemindButton({ id }: { id: string }) {
  const [text, setText] = useState("Envoyer un rappel");
  return (
    <button
      type="button"
      className="rounded-full border border-[#26304F] px-3 py-1"
      onClick={async () => {
        const response = await fetch(`/api/super/comptes-clients/remind/${id}`, { method: "POST" });
        setText(response.ok ? "Rappel envoyé" : "Rappel impossible");
      }}
    >
      {text}
    </button>
  );
}

function ActionPanel({ orgId, kind, onClose, onDone }: { orgId: string; kind: string; onClose: () => void; onDone: (message: string) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
      <form
        className="h-full w-full max-w-md overflow-auto bg-[#111831] p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          if (kind !== "invite") {
            onDone("Cette action réutilise les services du compte dès que la donnée source existe. Rien n'a été inventé.");
            return;
          }
          const response = await fetch(`/api/super/comptes-clients/${orgId}/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ firstName, lastName, email }),
          });
          const json = (await response.json()) as { error?: string };
          onDone(response.ok ? "Invitation envoyée pour le compte." : json.error || "Invitation impossible");
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{kind === "invite" ? "Inviter un collaborateur" : "Action"}</h2>
          <button type="button" onClick={onClose}>Fermer</button>
        </div>
        {kind === "invite" ? (
          <div className="mt-4 space-y-3">
            <input required value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Prénom" className="w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2" />
            <input required value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nom" className="w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2" />
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" className="w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2" />
            <button type="submit" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Envoyer l'invitation</button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-[#C9D2E8]">Le panneau est prêt. La source (session, badge, dossier OPCO, document) n'est pas encore reliée à l'organisation, donc aucune écriture n'est faite.</p>
        )}
        {kind !== "invite" ? <button type="submit" className="mt-4 rounded-full border border-[#26304F] px-4 py-2 text-sm">Fermer le panneau</button> : null}
      </form>
    </div>
  );
}

function OpenSpaceDialog({ orgId, orgName, onClose }: { orgId: string; orgName: string; onClose: () => void }) {
  const [mode, setMode] = useState<"choose" | "write">("choose");
  const [reasonCode, setReasonCode] = useState("client_request");
  const [reasonText, setReasonText] = useState("");
  const [notifyAdmin, setNotifyAdmin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function start(nextMode: "read" | "write") {
    const response = await fetch("/api/super/impersonation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, mode: nextMode, reasonCode, reasonText, notifyAdmin }),
    });
    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(json.error || "Ouverture impossible");
      return;
    }
    window.location.href = "/dashboard/entreprise";
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-[#1A2340] bg-[#111831] p-6">
        {mode === "choose" ? (
          <>
            <h2 className="text-xl font-bold">Ouvrir l'espace de {orgName}</h2>
            <p className="mt-2 text-sm text-[#C9D2E8]">La session Byound reste la vôtre. L'espace s'ouvre en lecture.</p>
            {error ? <p className="mt-3 text-sm text-[#FF8A9B]">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm">Annuler</button>
              <button type="button" onClick={() => void start("read")} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Ouvrir en lecture</button>
              <button type="button" onClick={() => setMode("write")} className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm">Passer en modification</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Passer en modification</h2>
            <p className="mt-2 text-sm text-[#C9D2E8]">Vos actions seront enregistrées dans le journal de {orgName}. Le mode écriture dure 30 minutes.</p>
            <label className="mt-4 block text-sm">Motif
              <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2">
                {REASON_CODES.map((reason) => <option key={reason.code} value={reason.code}>{reason.label}</option>)}
              </select>
            </label>
            <label className="mt-3 block text-sm">Précision
              <textarea value={reasonText} onChange={(event) => setReasonText(event.target.value)} className="mt-1 min-h-20 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] p-3" />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notifyAdmin} onChange={(event) => setNotifyAdmin(event.target.checked)} />
              Prévenir l'administrateur du compte par e-mail
            </label>
            {error ? <p className="mt-3 text-sm text-[#FF8A9B]">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm">Annuler</button>
              <button type="button" onClick={() => void start("write")} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">Activer pour 30 min</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
