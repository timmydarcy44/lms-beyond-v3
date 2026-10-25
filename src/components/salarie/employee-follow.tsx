"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DatePill, EmptyState, SegmentBar } from "@/components/salarie/employee-fiche-blocks";
import { parseInterviewDetails, type HrDocument } from "@/components/enterprise/enterprise-employee-entretiens";
import type { EmployeeMission } from "@/components/enterprise/enterprise-employee-missions";
import { summarizeFicheGaps, type SoftSkillGap } from "@/lib/entreprise/metier-skill-gaps";
import { AXES_LABELS, IDMC_AXIS_KEYS, type AxisKey } from "@/lib/idmc/idmc-display";
import { foldSkillKey } from "@/lib/hard-skills/skill-catalog-policy";

type DiscScores = { D: number; I: number; S: number; C: number };
type FormationRow = { id: string; title: string; progress: number };
type NoteRow = { id: string; body: string; author: string; created_at: string };

const INTERVIEW_TYPES = ["entretien_individuel", "bilan_annuel", "autre"];
const TYPE_LABEL: Record<string, string> = {
  entretien_individuel: "Entretien individuel",
  bilan_annuel: "Bilan annuel",
  autre: "Autre",
};
const MISSION_LABEL: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};
const BEHAVIOR = [
  { key: "D" as const, label: "Décisionnel", sentence: "Privilégie l'action, les décisions rapides et les objectifs clairs." },
  { key: "I" as const, label: "Relationnel", sentence: "Mise sur la communication, l'enthousiasme et la mobilisation des autres." },
  { key: "S" as const, label: "Stable", sentence: "Recherche la stabilité, l'écoute et un rythme de travail régulier." },
  { key: "C" as const, label: "Structuré", sentence: "Valorise la rigueur, la qualité et le respect des procédures." },
];

function formatLong(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function startOfDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function addMonths(value: string, months: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function monthsSince(value: string) {
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return months;
}

function isProfessional(doc: HrDocument) {
  return /entretien professionnel/i.test(doc.title);
}

export function EmployeeFollow({
  employeeId,
  firstName,
  fullName,
  hireDate,
  documents,
  missions,
  onMissionsChange,
  gaps,
  shareConsent,
  disc,
  idmcAxes,
  formations,
  byoundSkills,
  onPlanInterview,
  onAssignFormation,
}: {
  employeeId: string;
  firstName: string;
  fullName: string;
  hireDate: string | null;
  documents: HrDocument[];
  missions: EmployeeMission[];
  onMissionsChange: (missions: EmployeeMission[]) => void;
  gaps: SoftSkillGap[];
  shareConsent: boolean;
  disc: DiscScores | null;
  idmcAxes: Record<string, number> | null;
  formations: FormationRow[];
  byoundSkills: Array<{ name: string; status: "declared" | "proof" | "badge" }>;
  onPlanInterview: () => void;
  onAssignFormation: () => void;
}) {
  const [prepareOpen, setPrepareOpen] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDue, setMissionDue] = useState("");
  const [missionDetail, setMissionDetail] = useState("");
  const [savingMission, setSavingMission] = useState(false);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [canManageNotes, setCanManageNotes] = useState(false);
  const [notesUnavailable, setNotesUnavailable] = useState(false);
  const [notesLoading, setNotesLoading] = useState(true);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const name = firstName.trim() || "Ce collaborateur";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const interviews = useMemo(
    () => documents.filter((doc) => INTERVIEW_TYPES.includes(doc.document_type)),
    [documents],
  );
  const nextInterview = useMemo(() => {
    return interviews
      .filter((doc) => {
        const date = doc.document_date ? startOfDay(doc.document_date) : null;
        return date != null && date.getTime() >= today.getTime();
      })
      .sort((a, b) => String(a.document_date).localeCompare(String(b.document_date)))[0] ?? null;
  }, [interviews, today]);

  const professional = useMemo(() => {
    const rows = interviews.filter(isProfessional).filter((doc) => doc.document_date);
    const past = rows
      .filter((doc) => {
        const date = startOfDay(doc.document_date!);
        return date != null && date.getTime() <= today.getTime();
      })
      .sort((a, b) => String(b.document_date).localeCompare(String(a.document_date)));
    const upcoming = rows
      .filter((doc) => {
        const date = startOfDay(doc.document_date!);
        return date != null && date.getTime() > today.getTime();
      })
      .sort((a, b) => String(a.document_date).localeCompare(String(b.document_date)));
    const last = past[0]?.document_date ?? null;
    const nextFromDoc = upcoming[0]?.document_date ?? null;
    const computed = last ? addMonths(last, 24) : hireDate ? addMonths(hireDate, 24) : null;
    const elapsed = last ? monthsSince(last) : null;
    const needsPlan = (!last && !nextFromDoc) || (elapsed != null && elapsed > 22);
    return { last, next: nextFromDoc ?? computed?.toISOString() ?? null, needsPlan };
  }, [interviews, hireDate, today]);

  const workGaps = summarizeFicheGaps(gaps).work;
  const inProgress = formations.filter((item) => item.progress < 100);
  const done = formations.filter((item) => item.progress >= 100);
  const badgeNames = byoundSkills.filter((skill) => skill.status === "badge").map((skill) => foldSkillKey(skill.name));

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/notes`)
      .then((res) => res.json())
      .then((payload: { notes?: NoteRow[]; canManage?: boolean; unavailable?: boolean }) => {
        if (cancelled) return;
        setNotes(payload.notes ?? []);
        setCanManageNotes(Boolean(payload.canManage));
        setNotesUnavailable(Boolean(payload.unavailable));
      })
      .catch(() => {
        if (!cancelled) setNotesUnavailable(true);
      })
      .finally(() => {
        if (!cancelled) setNotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const saveMission = async () => {
    if (!missionTitle.trim()) return;
    setSavingMission(true);
    try {
      const res = await fetch(`/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/missions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: missionTitle.trim(),
          description: missionDetail.trim() || null,
          due_date: missionDue || null,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as { mission?: EmployeeMission; error?: string };
      if (!res.ok || !payload.mission) throw new Error(payload.error ?? "Impossible d'ajouter la mission");
      onMissionsChange([payload.mission, ...missions]);
      setMissionTitle("");
      setMissionDue("");
      setMissionDetail("");
      setMissionOpen(false);
      toast.success("Mission assignée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'ajouter la mission");
    } finally {
      setSavingMission(false);
    }
  };

  const saveNote = async () => {
    if (!noteBody.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/dashboard/entreprise/employees/${encodeURIComponent(employeeId)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: noteBody.trim() }),
      });
      const payload = (await res.json().catch(() => ({}))) as { note?: NoteRow; error?: string };
      if (!res.ok || !payload.note) throw new Error(payload.error ?? "Impossible d'ajouter la note");
      setNotes((current) => [payload.note!, ...current]);
      setNoteBody("");
      setNoteOpen(false);
      toast.success("Note enregistrée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'ajouter la note");
    } finally {
      setSavingNote(false);
    }
  };

  const nextDetails = nextInterview ? parseInterviewDetails(nextInterview.notes) : null;
  const nextLine = nextInterview
    ? [
        formatLong(nextInterview.document_date),
        nextDetails?.time || null,
        nextDetails?.participants ? `avec ${nextDetails.participants}` : fullName ? `avec ${fullName}` : null,
        nextDetails?.location || null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  const dominant = disc
    ? [...BEHAVIOR].sort((a, b) => Number(disc[b.key]) - Number(disc[a.key]))[0]
    : null;
  const weakestAxis = shareConsent && idmcAxes
    ? IDMC_AXIS_KEYS.map((key) => ({ key, score: Number(idmcAxes[key] ?? 0) }))
        .filter((axis) => axis.score > 0)
        .sort((a, b) => a.score - b.score)[0]
    : null;

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 min-[1100px]:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        {nextInterview ? (
          <section className="rounded-[26px] bg-[#6E5BFF] px-6 py-5 text-white">
            {nextInterview.document_date ? <DatePill date={nextInterview.document_date} tone="white" /> : null}
            <p className="mt-4 text-sm font-semibold text-white/80">Prochain entretien</p>
            <p className="mt-1 text-[22px] font-extrabold">{TYPE_LABEL[nextInterview.document_type] ?? nextInterview.title}</p>
            <p className="mt-2 text-sm text-white/80">{nextLine}</p>
            <button
              type="button"
              onClick={() => setPrepareOpen(true)}
              className="mt-5 h-11 rounded-full bg-white px-4 text-sm font-semibold text-[#1A0C04]"
            >
              Préparer
            </button>
          </section>
        ) : (
          <EmptyState
            title="Aucun entretien prévu"
            detail={`Aucun entretien à venir n'est enregistré pour ${name}.`}
            action={{ label: "Planifier", onClick: onPlanInterview }}
          />
        )}

        <section className="rounded-[26px] bg-white px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-[#07080B]">Entretiens et bilans</h2>
            <button type="button" onClick={onPlanInterview} className="h-11 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white">
              Planifier
            </button>
          </div>
          {interviews.length === 0 ? (
            <p className="mt-4 text-sm text-[#6B6F7A]">Aucun entretien enregistré.</p>
          ) : (
            <ul className="mt-2">
              {interviews.map((doc) => {
                const details = parseInterviewDetails(doc.notes);
                const date = doc.document_date ? startOfDay(doc.document_date) : null;
                const doneInterview = Boolean(details.hr_feedback || details.employee_feedback || (date && date.getTime() < today.getTime()));
                const detail = [
                  details.participants ? `avec ${details.participants}` : null,
                  details.location || null,
                  details.hr_feedback || details.employee_feedback || doc.file_name ? "compte rendu" : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={doc.id} className="flex items-center gap-3 border-t border-[#F1EFE9] py-4 first:border-t-0">
                    {doc.document_date ? <DatePill date={doc.document_date} /> : <span className="w-14" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#07080B]">{TYPE_LABEL[doc.document_type] ?? doc.title}</p>
                      {detail ? <p className="text-sm text-[#6B6F7A]">{detail}</p> : null}
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={doneInterview ? { background: "#E3F6EC", color: "#126B3B" } : { background: "#EEEBFF", color: "#4B3BD1" }}
                    >
                      {doneInterview ? "Fait" : "Planifié"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-[26px] bg-white px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-[#07080B]">Missions</h2>
            <button type="button" onClick={() => setMissionOpen(true)} className="h-11 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white">
              Assigner une mission
            </button>
          </div>
          {missions.length === 0 ? (
            <p className="mt-4 text-sm text-[#6B6F7A]">Aucune mission assignée.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {missions.map((mission) => (
                <li key={mission.id}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-[#07080B]">{mission.title}</p>
                    <span className="text-sm text-[#6B6F7A]">{MISSION_LABEL[mission.status] ?? mission.status}</span>
                  </div>
                  {mission.due_date ? (
                    <p className="mt-1 text-sm text-[#6B6F7A]">
                      Échéance {new Date(mission.due_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  ) : null}
                  {mission.status === "completed" ? (
                    <div className="mt-2">
                      <SegmentBar segments={[{ value: 1, color: "#1F9D57" }]} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {missions.length > 0 ? (
            <p className="mt-3 text-sm text-[#6B6F7A]">Aucun objectif chiffré n'est enregistré sur les missions.</p>
          ) : null}
        </section>
      </div>

      <div className="space-y-4">
        <section className={`rounded-[26px] px-6 py-5 ${professional.needsPlan ? "bg-[#FFF1E2]" : "bg-white"}`}>
          <h2 className="text-lg font-extrabold text-[#07080B]">Entretien professionnel</h2>
          <p className="mt-1 text-sm text-[#6B6F7A]">Obligatoire tous les 2 ans</p>
          <p className="mt-3 text-sm text-[#3A3D45]">
            Dernier : {professional.last ? formatLong(professional.last) : "aucun enregistré"}
          </p>
          <p className="mt-1 text-sm text-[#3A3D45]">
            Prochain : {professional.next ? formatLong(professional.next) : "date non calculable"}
          </p>
          {professional.needsPlan ? (
            <p className="mt-3 text-sm font-semibold text-[#8A4B0F]">
              À planifier{professional.next ? ` avant le ${formatLong(professional.next)}` : ""}.
            </p>
          ) : null}
        </section>

        <section className="rounded-[26px] bg-white px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-[#07080B]">Formations</h2>
            <button type="button" onClick={onAssignFormation} className="h-11 rounded-full bg-[#6E5BFF] px-4 text-sm font-semibold text-white">
              Assigner
            </button>
          </div>
          {workGaps.length === 0 && formations.length === 0 ? (
            <p className="mt-4 text-sm text-[#6B6F7A]">Aucune formation assignée, et aucun écart à travailler.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {workGaps.map((gap) => (
                <li key={gap.skill} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#07080B]">{gap.skill}</p>
                    <p className="text-sm text-[#6B6F7A]">Écart à travailler. Aucune formation n'est liée à cette compétence.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#FFF1E2] px-3 py-1 text-xs font-semibold text-[#8A4B0F]">À assigner</span>
                </li>
              ))}
              {inProgress.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#07080B]">{item.title}</p>
                    <p className="text-sm text-[#6B6F7A]">{Math.round(item.progress)} %</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F4F4F1] px-3 py-1 text-xs font-semibold text-[#3A3D45]">En cours</span>
                </li>
              ))}
              {done.map((item) => {
                const earned = badgeNames.includes(foldSkillKey(item.title));
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#07080B]">{item.title}</p>
                      {earned ? <p className="text-sm text-[#6B6F7A]">Badge obtenu</p> : null}
                    </div>
                    <span className="shrink-0 rounded-full bg-[#E3F6EC] px-3 py-1 text-xs font-semibold text-[#126B3B]">Terminée</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-[26px] bg-white px-6 py-5">
          <h2 className="text-lg font-extrabold text-[#07080B]">Notes RH</h2>
          <p className="mt-1 text-sm text-[#6B6F7A]">Visibles par les admins RH uniquement</p>
          {notesLoading ? (
            <div className="mt-4 h-16 animate-pulse rounded-2xl bg-[#ECE9E1]" />
          ) : !canManageNotes ? (
            <p className="mt-4 text-sm text-[#6B6F7A]">Ces notes sont réservées aux admins RH.</p>
          ) : notesUnavailable ? (
            <p className="mt-4 text-sm text-[#6B6F7A]">Le journal n'est pas encore disponible. Le SQL des notes RH doit être collé dans Supabase.</p>
          ) : (
            <>
              {notes.length === 0 ? <p className="mt-4 text-sm text-[#6B6F7A]">Aucune note.</p> : null}
              <ul className="mt-3 space-y-3">
                {notes.map((note) => (
                  <li key={note.id}>
                    <p className="text-sm text-[#07080B]">{note.body}</p>
                    <p className="mt-1 text-xs text-[#6B6F7A]">
                      {note.author} · {formatLong(note.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
              {noteOpen ? (
                <div className="mt-4">
                  <textarea
                    value={noteBody}
                    onChange={(event) => setNoteBody(event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-[#E3E0D8] px-3 py-2 text-sm text-[#07080B]"
                    placeholder="Note factuelle"
                  />
                  <p className="mt-2 text-xs text-[#6B6F7A]">Restez factuel : le salarié peut demander à consulter ces notes.</p>
                  <button
                    type="button"
                    onClick={() => void saveNote()}
                    disabled={savingNote || !noteBody.trim()}
                    className="mt-3 h-10 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {savingNote ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setNoteOpen(true)}
                  className="mt-4 h-11 w-full rounded-full border border-dashed border-[#D6D2C8] text-sm font-semibold text-[#3A3D45]"
                >
                  + Ajouter une note
                </button>
              )}
            </>
          )}
        </section>
      </div>

      {prepareOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-[26px] bg-white p-6">
            <h2 className="text-lg font-extrabold text-[#07080B]">Trame pour {name}</h2>
            <p className="mt-2 text-sm text-[#6B6F7A]">Construite à partir des écarts{shareConsent ? " et des tests partagés" : ""}.</p>
            {workGaps.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {workGaps.map((gap) => (
                  <li key={gap.skill} className="text-sm text-[#07080B]">
                    {gap.skill} : {gap.actual}/15, cible {gap.target}/15
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[#6B6F7A]">Aucun écart à travailler.</p>
            )}
            {shareConsent && dominant ? <p className="mt-4 text-sm text-[#3A3D45]">Dominante {dominant.label}. {dominant.sentence}</p> : null}
            {weakestAxis ? (
              <p className="mt-2 text-sm text-[#3A3D45]">
                Axe IDMC le plus bas : {AXES_LABELS[weakestAxis.key as AxisKey]} ({Math.round(weakestAxis.score)}/100).
              </p>
            ) : null}
            <button type="button" onClick={() => setPrepareOpen(false)} className="mt-5 h-11 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white">
              Fermer
            </button>
          </div>
        </div>
      ) : null}

      {missionOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[26px] bg-white p-6">
            <h2 className="text-lg font-extrabold text-[#07080B]">Assigner une mission</h2>
            <input
              value={missionTitle}
              onChange={(event) => setMissionTitle(event.target.value)}
              placeholder="Titre"
              className="mt-4 w-full rounded-2xl border border-[#E3E0D8] px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={missionDue}
              onChange={(event) => setMissionDue(event.target.value)}
              className="mt-3 w-full rounded-2xl border border-[#E3E0D8] px-3 py-2 text-sm"
            />
            <textarea
              value={missionDetail}
              onChange={(event) => setMissionDetail(event.target.value)}
              rows={3}
              placeholder="Description"
              className="mt-3 w-full rounded-2xl border border-[#E3E0D8] px-3 py-2 text-sm"
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => void saveMission()} disabled={savingMission || !missionTitle.trim()} className="h-11 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white disabled:opacity-50">
                {savingMission ? "Ajout…" : "Assigner"}
              </button>
              <button type="button" onClick={() => setMissionOpen(false)} className="h-11 rounded-full bg-[#F4F4F1] px-4 text-sm font-semibold text-[#07080B]">
                Annuler
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
