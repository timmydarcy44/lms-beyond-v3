"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { TuteurShell } from "@/components/tuteur/tuteur-shell";

type MissionRow = {
  id: string;
  assignmentId: string;
  learnerId: string;
  learnerName: string;
  title: string;
  instructions: string | null;
  blockCode: string | null;
  dueDate: string | null;
  status: string;
  late: boolean;
  deliverable: string | null;
  submittedAt: string | null;
  validatedAt: string | null;
};

function missionBucket(row: { status: string; late: boolean }) {
  if (row.status === "validated" || row.status === "done") return "validees";
  if (row.status === "submitted") return "a_valider";
  if (row.late) return "en_retard";
  return "en_cours";
}

const LEVELS = ["Non acquis", "En cours", "Acquis", "Maîtrisé"];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatDay(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function TutorMissionsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const statut = params.get("statut") ?? "a_valider";
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [blocks, setBlocks] = useState<Array<{ id: string; code: string; title: string }>>([]);
  const [assignments, setAssignments] = useState<Array<{ id: string; learner_id: string }>>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [openCreate, setOpenCreate] = useState(false);
  const [selected, setSelected] = useState<MissionRow | null>(null);
  const [comment, setComment] = useState("");

  async function load() {
    const res = await fetch("/api/tuteur/missions-board", { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    const rows = (json.missions ?? []) as MissionRow[];
    setMissions(rows);
    setBlocks(json.blocks ?? []);
    setAssignments(json.assignments ?? []);
    setNames(Object.fromEntries(rows.map((row) => [row.assignmentId, row.learnerName])));
  }

  useEffect(() => { void load(); }, []);

  const counts = {
    a_valider: missions.filter((row) => missionBucket(row) === "a_valider").length,
    en_retard: missions.filter((row) => missionBucket(row) === "en_retard").length,
    en_cours: missions.filter((row) => missionBucket(row) === "en_cours").length,
    validees: missions.filter((row) => missionBucket(row) === "validees").length,
  };
  const monthValidated = missions.filter((row) => {
    if (missionBucket(row) !== "validees" || !row.validatedAt) return false;
    const date = new Date(row.validatedAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const visible = missions.filter((row) => missionBucket(row) === statut);

  async function act(status: "VALIDEE" | "CORRECTION_REQUESTED") {
    if (!selected) return;
    if (status === "CORRECTION_REQUESTED" && !comment.trim()) return;
    await fetch(`/api/tuteur/missions/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: status, motif: comment }),
    });
    setSelected(null);
    setComment("");
    await load();
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const block = blocks.find((item) => item.id === String(form.get("blockId")));
    await fetch("/api/tuteur/missions-board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: form.get("assignmentId"),
        blockId: block?.id,
        blockCode: block?.code,
        blockTitle: block?.title,
        title: form.get("title"),
        description: form.get("description"),
        dueDate: form.get("dueDate"),
        deliverable: form.get("deliverable"),
      }),
    });
    setOpenCreate(false);
    await load();
  }

  return (
    <TuteurShell tutorName="">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Missions</h1>
          <p className="mt-2 text-sm text-[var(--tutor-text-3)]">Toutes les missions de vos alternants, rattachées au référentiel</p>
        </div>
        <button type="button" className="rounded-full bg-[var(--tutor-accent)] px-4 py-2 text-sm font-bold text-[var(--tutor-on-accent)]" onClick={() => setOpenCreate(true)}>+ Créer une mission</button>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <article className="relative overflow-hidden rounded-[28px] bg-[var(--tutor-accent)] p-5 text-[var(--tutor-on-accent)]">
          <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/30" aria-hidden />
          <p className="text-sm font-semibold">À valider</p>
          <p className="text-5xl font-extrabold">{counts.a_valider}</p>
        </article>
        <article className="rounded-[28px] bg-[var(--tutor-alert-bg)] p-5 text-[var(--tutor-alert)]">
          <p className="text-sm font-semibold">En retard</p>
          <p className="text-5xl font-extrabold">{counts.en_retard}</p>
        </article>
        <article className="rounded-[28px] border border-[var(--tutor-border)] bg-[var(--tutor-surface)] p-5">
          <p className="text-sm text-[var(--tutor-text-3)]">Validées ce mois-ci</p>
          <p className="text-5xl font-extrabold">{monthValidated}</p>
        </article>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {([
          ["a_valider", "À valider", counts.a_valider],
          ["en_retard", "En retard", counts.en_retard],
          ["en_cours", "En cours", counts.en_cours],
          ["validees", "Validées", counts.validees],
        ] as const).map(([id, label, count]) => (
          <button key={id} type="button" onClick={() => router.push(`/dashboard/tuteur/missions?statut=${id}`)} className={`rounded-full px-4 py-2 text-sm font-semibold ${statut === id ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[var(--tutor-surface-2)] text-[var(--tutor-text-2)]"}`}>
            {label} · {count}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3 rounded-[28px] border border-[var(--tutor-border)] bg-[var(--tutor-surface)] p-3">
        {visible.length === 0 ? <p className="p-4 text-sm text-[var(--tutor-text-3)]">Aucune mission dans ce filtre.</p> : null}
        {visible.map((mission) => (
          <article key={mission.id} className="flex min-h-[72px] flex-wrap items-center gap-3 rounded-2xl px-2 py-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tutor-accent)] text-xs font-extrabold text-[var(--tutor-on-accent)]">{initials(mission.learnerName)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold">{mission.title}</p>
              <p className="text-sm text-[var(--tutor-text-4)]">
                {mission.learnerName}
                {mission.submittedAt ? ` · déposée le ${formatDay(mission.submittedAt)}` : ""}
                {mission.late && mission.dueDate ? ` · ${Math.max(1, Math.ceil((Date.now() - new Date(mission.dueDate).getTime()) / 86400000))} jours de retard` : ""}
                {!mission.submittedAt && !mission.late && mission.dueDate ? ` · échéance ${formatDay(mission.dueDate)}` : ""}
              </p>
            </div>
            {mission.blockCode ? <span className="rounded-full bg-[var(--tutor-surface-2)] px-3 py-1 text-xs font-bold text-[var(--tutor-accent-text)]">{mission.blockCode}</span> : null}
            {missionBucket(mission) === "a_valider" ? (
              <div className="flex gap-2">
                <button type="button" className="rounded-full border border-[var(--tutor-border)] px-3 py-2 text-sm" onClick={() => setSelected(mission)}>Voir le livrable</button>
                <button type="button" className="rounded-full bg-white px-3 py-2 text-sm font-bold text-[#07080B]" onClick={() => setSelected(mission)}>Valider</button>
              </div>
            ) : (
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${missionBucket(mission) === "validees" ? "bg-[var(--tutor-success-bg)] text-[var(--tutor-success)]" : missionBucket(mission) === "en_retard" ? "bg-[var(--tutor-alert-bg)] text-[var(--tutor-alert)]" : "bg-[var(--tutor-surface-2)] text-[var(--tutor-text-3)]"}`}>
                {missionBucket(mission) === "validees" ? "Validée" : missionBucket(mission) === "en_retard" ? "En retard" : "En cours"}
              </span>
            )}
          </article>
        ))}
      </div>
      {selected ? (
        <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-[var(--tutor-border)] bg-[var(--tutor-hero)] p-5">
          <h2 className="text-xl font-extrabold">{selected.title}</h2>
          <p className="mt-2 text-sm text-[var(--tutor-text-3)]">{selected.deliverable || selected.instructions || "Aucun livrable déposé."}</p>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Commentaire" className="mt-4 w-full rounded-2xl bg-[var(--tutor-surface)] p-3 text-sm" />
          <div className="mt-4 flex gap-2">
            <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]" onClick={() => void act("VALIDEE")}>Valider</button>
            <button type="button" className="rounded-full bg-[var(--tutor-alert-bg)] px-4 py-2 text-sm font-bold text-[var(--tutor-alert)]" onClick={() => void act("CORRECTION_REQUESTED")}>Demander une correction</button>
            <button type="button" className="rounded-full bg-[var(--tutor-surface-2)] px-4 py-2 text-sm" onClick={() => setSelected(null)}>Fermer</button>
          </div>
        </aside>
      ) : null}
      {openCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={create} className="w-full max-w-md space-y-3 rounded-[28px] bg-[var(--tutor-surface)] p-5">
            <h2 className="text-lg font-extrabold">Créer une mission</h2>
            <select name="assignmentId" required className="w-full rounded-xl bg-[var(--tutor-hero)] p-2">
              {assignments.map((item) => <option key={item.id} value={item.id}>{names[item.id] ?? "Alternant"}</option>)}
            </select>
            <select name="blockId" className="w-full rounded-xl bg-[var(--tutor-hero)] p-2">
              <option value="">Bloc du référentiel</option>
              {blocks.map((block) => <option key={block.id} value={block.id}>{block.code} · {block.title}</option>)}
            </select>
            <input name="title" required placeholder="Titre" className="w-full rounded-xl bg-[var(--tutor-hero)] p-2" />
            <textarea name="description" placeholder="Description" className="w-full rounded-xl bg-[var(--tutor-hero)] p-2" />
            <input name="dueDate" type="date" className="w-full rounded-xl bg-[var(--tutor-hero)] p-2" />
            <input name="deliverable" placeholder="Livrable attendu" className="w-full rounded-xl bg-[var(--tutor-hero)] p-2" />
            <div className="flex gap-2">
              <button className="rounded-full bg-[var(--tutor-accent)] px-4 py-2 text-sm font-bold text-[var(--tutor-on-accent)]" type="submit">Créer</button>
              <button className="rounded-full bg-[var(--tutor-surface-2)] px-4 py-2 text-sm" type="button" onClick={() => setOpenCreate(false)}>Fermer</button>
            </div>
          </form>
        </div>
      ) : null}
    </TuteurShell>
  );
}

type Period = { id: string; index: number; start_date: string; end_date: string; status: string; tutor_appreciation: string | null; student_comment: string | null };
type Signature = { period_id: string; signer_role: string; signed_at: string };

export function TutorLivretsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const alternant = params.get("alternant");
  const [board, setBoard] = useState<{ students: Array<{ id: string; name: string }>; booklet: { contract_start: string; contract_end: string; cfa_referent_id: string | null } | null; periods: Period[]; signatures: Signature[]; prefill: { missions: string[]; blocks: string[]; modules: string[]; justified: number; unjustified: number } | null; profile: { name: string; formation: string | null; rythme: string | null } | null; identity: { company: string | null; cfa: string | null; referent: string | null } | null; tutorName?: string; currentPeriodId: string | null } | null>(null);
  const [appreciation, setAppreciation] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const query = alternant ? `?alternant=${alternant}` : "";
    void fetch(`/api/tuteur/livrets${query}`, { cache: "no-store" }).then(async (res) => {
      if (!res.ok) return;
      const json = await res.json();
      setBoard(json);
      const current = (json.periods ?? []).find((period: Period) => period.id === json.currentPeriodId);
      setAppreciation(current?.tutor_appreciation ?? "");
    });
  }, [alternant]);

  const current = board?.periods.find((period) => period.id === board.currentPeriodId) ?? null;
  const signedCount = board?.periods.filter((period) => period.status === "signed").length ?? 0;
  const waiting = board?.periods.filter((period) => period.status === "awaiting_tutor").length ?? 0;
  const past = (board?.periods ?? []).filter((period) => period.status === "signed");

  async function saveAppreciation(value: string) {
    if (!current) return;
    setAppreciation(value);
    await fetch(`/api/tuteur/livrets/periods/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appreciation: value }),
    });
  }

  async function sign() {
    if (!current) return;
    const res = await fetch(`/api/tuteur/livrets/periods/${current.id}/sign`, { method: "POST" });
    if (!res.ok) return;
    setConfirming(false);
    router.refresh();
    const query = alternant ? `?alternant=${alternant}` : "";
    const next = await fetch(`/api/tuteur/livrets${query}`, { cache: "no-store" });
    if (next.ok) setBoard(await next.json());
  }

  async function exportPdf() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 16;
    const line = (text: string) => {
      doc.text(text, 14, y);
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
    };
    line("Livret d'apprentissage");
    line(board?.profile?.name ?? "");
    line(board?.profile?.formation ?? "");
    line(`${board?.booklet?.contract_start ?? ""} – ${board?.booklet?.contract_end ?? ""}`);
    for (const period of board?.periods ?? []) {
      line(`Periode ${period.index} · ${period.start_date} – ${period.end_date} · ${period.status}`);
      if (period.tutor_appreciation) line(`Appreciation : ${period.tutor_appreciation.slice(0, 180)}`);
      for (const sign of (board?.signatures ?? []).filter((item) => item.period_id === period.id)) {
        line(`Signature ${sign.signer_role} · ${sign.signed_at}`);
      }
    }
    doc.save("livret.pdf");
  }

  return (
    <TuteurShell tutorName="">
      <h1 className="text-4xl font-extrabold">Livrets</h1>
      <p className="mt-2 text-sm text-[var(--tutor-text-3)]">{waiting} période{waiting > 1 ? "s" : ""} à signer</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(board?.students ?? []).map((student) => (
          <button key={student.id} type="button" onClick={() => router.push(`/dashboard/tuteur/livrets?alternant=${student.id}`)} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${(alternant ?? board?.students[0]?.id) === student.id ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[var(--tutor-surface-2)]"}`}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tutor-accent)] text-[10px] font-extrabold text-[var(--tutor-on-accent)]">{initials(student.name)}</span>
            {student.name}
          </button>
        ))}
      </div>
      {!board?.booklet ? <p className="mt-8 text-[var(--tutor-text-3)]">Aucun livret n&apos;est ouvert. Les dates de contrat doivent être renseignées.</p> : null}
      {board?.booklet && board.profile ? (
        <>
          <section className="relative mt-6 overflow-hidden rounded-[32px] bg-[var(--tutor-accent)] p-6 text-[var(--tutor-on-accent)]">
            <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/25" aria-hidden />
            <span className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-black/10" aria-hidden />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Livret d&apos;apprentissage</p>
                <h2 className="text-[clamp(28px,4vw,38px)] font-extrabold">{board.profile.name}</h2>
                <p className="text-sm">{[board.profile.formation, `${formatDay(board.booklet.contract_start)} – ${formatDay(board.booklet.contract_end)}`].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-extrabold">{signedCount}/{board.periods.length}</p>
                <p className="text-sm">périodes signées par les 3 parties</p>
                <div className="mt-2 flex gap-1">
                  {board.periods.map((period) => (
                    <span key={period.id} className={`h-2 w-6 rounded-full ${period.status === "signed" ? "bg-[#1A0C04]" : "bg-[rgba(26,12,4,0.2)]"}`} />
                  ))}
                </div>
                <button type="button" className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]" onClick={exportPdf}>Exporter en PDF</button>
              </div>
            </div>
          </section>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {[
              ["Alternant", board.profile.name, board.profile.formation],
              ["Entreprise", board.identity?.company, board.tutorName ?? null],
              ["CFA", board.identity?.cfa, board.identity?.referent],
              ["Rythme", board.profile.rythme, null],
            ].map(([title, value, extra]) => (
              <article key={String(title)} className="rounded-[22px] bg-[var(--tutor-surface)] p-4">
                <p className="text-xs text-[var(--tutor-text-4)]">{title}</p>
                <p className="mt-1 font-bold">{value || "—"}</p>
                {extra ? <p className="text-sm text-[var(--tutor-text-3)]">{extra}</p> : null}
              </article>
            ))}
          </div>
          {current ? (
            <section className="mt-4 rounded-[28px] border border-[rgba(255,122,47,0.4)] bg-[var(--tutor-surface)] p-5">
              <p className="text-sm font-bold text-[var(--tutor-accent-text)]">Période {current.index} · en cours</p>
              <h3 className="text-[22px] font-extrabold">{formatDay(current.start_date)} – {formatDay(current.end_date)}</h3>
              <p className="mt-4 text-xs text-[var(--tutor-text-4)]">pré-rempli</p>
              <ul className="mt-2 space-y-1 text-sm">
                {(board.prefill?.missions ?? []).map((mission) => <li key={mission}>{mission}</li>)}
                {(board.prefill?.missions ?? []).length === 0 ? <li>Aucune mission validée sur la période.</li> : null}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {(board.prefill?.blocks ?? []).map((block) => <span key={block} className="rounded-full bg-[var(--tutor-accent-soft)] px-3 py-1 text-xs font-bold text-[var(--tutor-accent-text)]">{block}</span>)}
              </div>
              <p className="mt-3 text-sm text-[var(--tutor-text-3)]">{(board.prefill?.modules ?? []).join(" · ") || "Aucun module CFA sur la période."}</p>
              <p className="text-sm text-[var(--tutor-text-3)]">{board.prefill?.justified ?? 0} absence{board.prefill?.justified === 1 ? "" : "s"} justifiée{(board.prefill?.justified ?? 0) > 1 ? "s" : ""} · {board.prefill?.unjustified ?? 0} non justifiée{(board.prefill?.unjustified ?? 0) > 1 ? "s" : ""}</p>
              <label className="mt-4 block text-sm font-semibold">Appréciation du tuteur</label>
              <textarea value={appreciation} onChange={(event) => void saveAppreciation(event.target.value)} className="mt-2 w-full rounded-2xl bg-[var(--tutor-hero)] p-3 text-sm" rows={4} />
              {current.student_comment ? <p className="mt-3 text-sm text-[var(--tutor-text-3)]">{current.student_comment}</p> : <p className="mt-3 text-sm text-[var(--tutor-text-4)]">Le commentaire de l&apos;alternant apparaîtra ici.</p>}
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {(["student", "tutor", "cfa"] as const).map((role) => {
                  const sign = board.signatures.find((item) => item.period_id === current.id && item.signer_role === role);
                  const label = role === "student" ? "Alternant" : role === "tutor" ? "Vous · tuteur" : "Formateur référent";
                  return (
                    <article key={role} className="rounded-2xl bg-[var(--tutor-hero)] p-3">
                      <p className="font-bold">{label}</p>
                      <p className="text-sm text-[var(--tutor-text-3)]">{sign ? `Signé le ${formatDay(sign.signed_at)}` : "En attente"}</p>
                    </article>
                  );
                })}
              </div>
              {current.status === "awaiting_tutor" ? (
                <button type="button" className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]" onClick={() => setConfirming(true)}>Signer</button>
              ) : null}
              {confirming ? (
                <div className="mt-3 rounded-2xl bg-[var(--tutor-hero)] p-3">
                  <p className="text-sm">En signant, vous validez le contenu de cette période.</p>
                  <button type="button" className="mt-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]" onClick={() => void sign()}>Confirmer la signature</button>
                </div>
              ) : null}
            </section>
          ) : null}
          {past.length ? (
            <section className="mt-4 rounded-[28px] bg-[var(--tutor-surface)] p-5">
              <h3 className="font-extrabold">Périodes précédentes</h3>
              {past.map((period) => (
                <p key={period.id} className="mt-3 text-sm">Période {period.index} · {formatDay(period.start_date)} – {formatDay(period.end_date)} · Signé par les 3 parties</p>
              ))}
            </section>
          ) : null}
        </>
      ) : null}
    </TuteurShell>
  );
}

export function TutorEvaluationsPage() {
  const [rows, setRows] = useState<Array<{ id: string; studentName: string; type: string; dueDate: string | null; status: string; sentAt: string | null; selfSentAt: string | null; firstName: string }>>([]);
  useEffect(() => {
    void fetch("/api/tuteur/evaluations", { cache: "no-store" }).then(async (res) => {
      if (res.ok) setRows((await res.json()).evaluations ?? []);
    });
  }, []);
  const current = rows.find((row) => row.status === "to_fill") ?? null;
  const typeLabel = (type: string) => type === "trial_period" ? "Bilan de fin de période d'essai" : type === "final" ? "Évaluation finale" : "Évaluation trimestrielle";
  return (
    <TuteurShell tutorName="">
      <h1 className="text-4xl font-extrabold">Évaluations</h1>
      <p className="mt-2 text-sm text-[var(--tutor-text-3)]">Évaluations périodiques · comparez avec l&apos;auto-évaluation de l&apos;alternant</p>
      {current ? (
        <Link href={`/dashboard/tuteur/evaluations/${current.id}`} className="mt-6 block rounded-[28px] border border-[rgba(242,207,107,0.33)] bg-[var(--tutor-surface)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold">{typeLabel(current.type)} · {current.studentName}</p>
              <p className="text-sm text-[var(--tutor-text-3)]">À remplir{current.dueDate ? ` avant le ${formatDay(current.dueDate)}` : ""}{current.selfSentAt ? ` · auto-évaluation reçue le ${formatDay(current.selfSentAt)}` : ""}</p>
            </div>
            <span className="rounded-full bg-[var(--tutor-gold-bg)] px-3 py-1 text-xs font-bold text-[var(--tutor-gold)]">À remplir</span>
          </div>
        </Link>
      ) : null}
      <section className="mt-4 rounded-[28px] bg-[var(--tutor-surface)] p-5">
        <h2 className="font-extrabold">Toutes les évaluations</h2>
        {rows.length === 0 ? <p className="mt-3 text-sm text-[var(--tutor-text-3)]">Aucune évaluation pour le moment.</p> : null}
        {rows.map((row) => (
          <Link key={row.id} href={`/dashboard/tuteur/evaluations/${row.id}`} className="mt-3 flex items-center justify-between gap-3">
            <span>
              <span className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--tutor-surface-2)] text-[10px] font-extrabold">{initials(row.studentName)}</span>
              <span className="font-bold">{typeLabel(row.type)} · {row.studentName}</span>
              <span className="mt-1 block text-sm text-[var(--tutor-text-4)]">{row.sentAt ? `Envoyée le ${formatDay(row.sentAt)}` : row.dueDate ? `Avant le ${formatDay(row.dueDate)}` : ""}</span>
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.status === "sent" ? "bg-[var(--tutor-success-bg)] text-[var(--tutor-success)]" : row.status === "to_fill" ? "bg-[var(--tutor-gold-bg)] text-[var(--tutor-gold)]" : "bg-[var(--tutor-surface-2)] text-[var(--tutor-text-3)]"}`}>
              {row.status === "sent" ? "Envoyée" : row.status === "to_fill" ? "À remplir" : "En attente de l'alternant"}
            </span>
          </Link>
        ))}
      </section>
    </TuteurShell>
  );
}

export function TutorEvaluationDetail({ id }: { id: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<{ studentName: string; firstName: string; evaluation: { status: string; due_date: string | null; self_sent_at: string | null; type: string; general_comment: string | null }; items: Array<{ id: string; label: string; block_code: string | null; self_level: number | null; tutor_level: number | null }> } | null>(null);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    void fetch(`/api/tuteur/evaluations/${id}`, { cache: "no-store" }).then(async (res) => {
      if (!res.ok) return;
      const json = await res.json();
      setDetail(json);
      setComment(json.evaluation.general_comment ?? "");
      setLevels(Object.fromEntries((json.items ?? []).filter((item: { tutor_level: number | null }) => item.tutor_level != null).map((item: { id: string; tutor_level: number }) => [item.id, item.tutor_level])));
    });
  }, [id]);

  const complete = Boolean(detail && detail.items.length > 0 && detail.items.every((item) => levels[item.id] != null));

  async function save(send: boolean) {
    await fetch(`/api/tuteur/evaluations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment, send, levels: Object.entries(levels).map(([itemId, tutorLevel]) => ({ id: itemId, tutorLevel })) }),
    });
    if (send) router.push("/dashboard/tuteur/evaluations");
  }

  if (!detail) return <TuteurShell tutorName=""><p className="text-sm text-[var(--tutor-text-4)]">Chargement…</p></TuteurShell>;
  return (
    <TuteurShell tutorName="">
      <Link href="/dashboard/tuteur/evaluations" className="text-sm text-[var(--tutor-accent-text)]">Évaluations</Link>
      <section className="mt-4 rounded-[28px] border border-[rgba(242,207,107,0.33)] bg-[var(--tutor-surface)] p-5">
        <h1 className="text-2xl font-extrabold">{detail.studentName}</h1>
        <p className="mt-1 text-sm text-[var(--tutor-text-3)]">Anneau bleu : auto-évaluation. Pastille claire : votre évaluation.</p>
        <div className="mt-4 space-y-3">
          {detail.items.map((item) => (
            <div key={item.id} className="rounded-[18px] bg-[var(--tutor-hero)] p-3">
              <p className="font-bold">{item.label}</p>
              {item.block_code ? <p className="text-xs text-[var(--tutor-text-4)]">{item.block_code}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup">
                {LEVELS.map((label, index) => {
                  const selected = levels[item.id] === index;
                  const self = item.self_level === index;
                  return (
                    <button
                      key={label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setLevels((current) => ({ ...current, [item.id]: index }))}
                      className={`rounded-full px-3 py-1 text-sm ${selected ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[var(--tutor-surface-2)]"} ${self ? "ring-2 ring-[#8DB8FF]" : ""}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Commentaire général" className="mt-4 w-full rounded-2xl bg-[var(--tutor-hero)] p-3 text-sm" />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-full border border-[var(--tutor-border)] px-4 py-2 text-sm" onClick={() => void save(false)}>Enregistrer le brouillon</button>
          <button type="button" disabled={!complete || detail.evaluation.status === "sent"} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B] disabled:opacity-40" onClick={() => setConfirming(true)}>Envoyer l&apos;évaluation</button>
        </div>
        {confirming ? <button type="button" className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]" onClick={() => void save(true)}>Confirmer l&apos;envoi</button> : null}
      </section>
    </TuteurShell>
  );
}

export function TutorRessourcesPage() {
  return (
    <TuteurShell tutorName="">
      <h1 className="text-4xl font-extrabold">Ressources</h1>
      <p className="mt-4 text-[var(--tutor-text-3)]">Aucune ressource n&apos;est disponible pour le moment.</p>
    </TuteurShell>
  );
}
