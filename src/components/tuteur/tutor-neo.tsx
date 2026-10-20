"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import type { TutorFiche } from "@/lib/tuteur/tutor-fiche-server";
import type { TutorAction, TutorHomePayload, TutorHomeStudent } from "@/lib/tuteur/tutor-home-server";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function ringStyle(done: number, total: number) {
  const ratio = total > 0 ? Math.round((done / total) * 100) : 0;
  return { background: `conic-gradient(#6E5BFF ${ratio * 3.6}deg, #262A36 0deg)` };
}

function statusPill(statut: TutorHomeStudent["statut"]) {
  if (statut === "a_surveiller") return { label: "À surveiller", className: "bg-[#3A2414] text-[#FFAA6B]" };
  if (statut === "en_retard") return { label: "En retard", className: "bg-[#3A2414] text-[#FFAA6B]" };
  return { label: "À jour", className: "bg-[#0E2A1D] text-[#6BE39B]" };
}

function cardTone(statut: TutorHomeStudent["statut"], firstUpToDate: boolean) {
  if (firstUpToDate && statut === "a_jour") return "bg-[#6E5BFF] text-white";
  if (statut === "a_surveiller") return "bg-[#3A2414] text-[#F4F5F7] ring-1 ring-[#FFAA6B]";
  return "bg-[#12141A] text-[#F4F5F7] border border-[#262A36]";
}

async function loadHome() {
  const res = await fetch("/api/tuteur/home", { cache: "no-store" });
  if (res.status === 401 || res.status === 403) return { error: "auth" as const, data: null };
  if (!res.ok) return { error: "network" as const, data: null };
  return { error: null, data: (await res.json()) as TutorHomePayload };
}

export function TutorHome() {
  const [data, setData] = useState<TutorHomePayload | null>(null);
  const [error, setError] = useState<"auth" | "network" | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    void loadHome().then((result) => {
      setData(result.data);
      setError(result.error);
    });
  }, []);

  const actions = (data?.actions ?? []).filter((action) => !done.includes(action.id));
  const counts = {
    validate: actions.filter((action) => action.kind === "validation").length,
    evaluate: actions.filter((action) => action.kind === "evaluation").length,
    sign: actions.filter((action) => action.kind === "signature").length,
    writeCfa: actions.filter((action) => action.kind === "message").length,
  };
  const total = actions.length;
  const preview = (data?.students ?? []).slice(0, 3);
  const firstUpToDate = preview.find((student) => student.statut === "a_jour")?.learnerId;

  async function validate(action: TutorAction) {
    if (!action.missionId) return;
    const res = await fetch(`/api/tuteur/missions/${action.missionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "VALIDEE", motif: comment }),
    });
    if (!res.ok) return;
    setDone((current) => [...current, action.id]);
    setOpenId(null);
    setComment("");
    const fresh = await loadHome();
    if (fresh.data) setData(fresh.data);
  }

  return (
    <TuteurShell tutorName={data?.tutorName ?? "Tuteur"} navBadges={{ missions: counts.validate }}>
      {error === "auth" ? <p className="text-sm text-[#B5BAC6]">Accès réservé aux tuteurs.</p> : null}
      {data ? (
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[36px] bg-[#0C0D12] p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#6E5BFF]/20" aria-hidden />
            <p className="text-lg font-semibold text-[#DADDE4]">Bonjour {data.tutorFirstName} · cette semaine</p>
            <p className="mt-3 text-5xl font-extrabold tracking-tight">{total === 0 ? "Tout est à jour" : total}</p>
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                ["Valider", counts.validate],
                ["Évaluer", counts.evaluate],
                ["Signer", counts.sign],
                ["Écrire au CFA", counts.writeCfa],
              ].map(([label, count]) => (
                <div key={String(label)} className="flex flex-col items-center gap-2">
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#07080B]">
                    {label === "Valider" ? "V" : label === "Évaluer" ? "E" : label === "Signer" ? "S" : "C"}
                    {Number(count) > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] text-[#07080B] ring-2 ring-[#0C0D12]">
                        {count}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-[#B5BAC6]">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {preview.length ? (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-extrabold">Mes alternants</h2>
                <Link href="/dashboard/tuteur/alternants" className="text-sm font-semibold text-[#C9C2FF]">
                  Voir les {data.students.length}
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {preview.map((student) => (
                  <StudentCard key={student.learnerId} student={student} highlight={student.learnerId === firstUpToDate} />
                ))}
              </div>
            </section>
          ) : null}

          {data.week ? (
            <section className="rounded-[26px] border border-[#262A36] bg-[#12141A] p-5">
              <h2 className="text-lg font-extrabold">{data.week.label}</h2>
              <div className="mt-4 grid grid-cols-7 gap-2">
                {data.week.days.map((day) => (
                  <div
                    key={day.date}
                    className={`rounded-2xl p-2 text-center text-xs ${
                      day.lieu === "ecole"
                        ? "bg-[#6E5BFF]/20"
                        : day.lieu === "entreprise"
                          ? "bg-[#2F7CF6]/20"
                          : "bg-[#1E2130]"
                    } ${day.today ? "ring-2 ring-white" : ""}`}
                  >
                    <p className="font-semibold">{day.label}</p>
                    {day.schoolCount ? <p className="mt-1 text-[#C9C2FF]">{day.schoolCount} école</p> : null}
                    {day.companyCount ? <p className="text-[#B5BAC6]">{day.companyCount} entreprise</p> : null}
                    {day.absence ? <p className="text-[#FFAA6B]">Absence</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            {actions.length ? (
              <section className="space-y-3">
                <h2 className="text-lg font-extrabold">À faire</h2>
                {actions.map((action) => (
                  <article key={action.id} className="flex items-center gap-3 rounded-[22px] border border-[#262A36] bg-[#12141A] p-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                        action.kind === "validation"
                          ? "bg-[#6E5BFF] text-white"
                          : action.kind === "evaluation"
                            ? "bg-[#2F7CF6] text-white"
                            : action.kind === "signature"
                              ? "bg-[#F2CF6B] text-[#07080B]"
                              : "bg-[#14A38B] text-white"
                      }`}
                    >
                      {action.kind === "validation" ? "V" : action.kind === "evaluation" ? "E" : action.kind === "signature" ? "S" : "M"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{action.title}</p>
                      <p className="truncate text-sm text-[#B5BAC6]">{action.subtitle}</p>
                    </div>
                    {action.kind === "validation" ? (
                      <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]" onClick={() => setOpenId(action.id)}>
                        Valider
                      </button>
                    ) : action.href ? (
                      <Link href={action.href} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]">
                        Ouvrir
                      </Link>
                    ) : null}
                    {openId === action.id ? (
                      <form
                        className="absolute z-10 mt-28 w-64 rounded-2xl bg-[#1E2130] p-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void validate(action);
                        }}
                      >
                        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Commentaire" className="w-full rounded-xl bg-[#07080B] p-2 text-sm" />
                        <div className="mt-2 flex gap-2">
                          <button type="submit" className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#07080B]">Valider</button>
                          <button
                            type="button"
                            className="rounded-full bg-[#3A2414] px-3 py-1 text-xs font-bold text-[#FFAA6B]"
                            onClick={() => {
                              void fetch(`/api/tuteur/missions/${action.missionId}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ statut: "INVALIDEE", motif: comment || "Correction demandée" }),
                              }).then(() => setDone((current) => [...current, action.id]));
                            }}
                          >
                            Demander une correction
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </article>
                ))}
              </section>
            ) : null}
            <aside className="space-y-4">
              {data.watch.length ? (
                <section className="rounded-[26px] border border-[#262A36] bg-[#12141A] p-4">
                  <h2 className="font-extrabold">À surveiller</h2>
                  {data.watch.map((item) => (
                    <div key={item.learnerId} className="mt-3">
                      <p className="font-bold">{item.name}</p>
                      {item.signals.map((signal) => (
                        <p key={signal} className="text-sm text-[#FFAA6B]">{signal}</p>
                      ))}
                      <Link href="/dashboard/student/community" className="mt-2 inline-block text-sm font-semibold text-[#C9C2FF]">
                        Prévenir le CFA
                      </Link>
                    </div>
                  ))}
                </section>
              ) : null}
              {data.deadlines.length ? (
                <section className="rounded-[26px] border border-[#262A36] bg-[#12141A] p-4">
                  <h2 className="font-extrabold">Échéances</h2>
                  {data.deadlines.map((item) => (
                    <p key={item.id} className="mt-2 text-sm text-[#DADDE4]">
                      {item.dateLabel} · {item.label}
                    </p>
                  ))}
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      ) : error ? null : (
        <p className="text-sm text-[#9096A3]">Chargement…</p>
      )}
    </TuteurShell>
  );
}

function StudentCard({ student, highlight }: { student: TutorHomeStudent; highlight?: boolean }) {
  const pill = statusPill(student.statut);
  return (
    <Link href={`/dashboard/tuteur/alternants/${student.learnerId}`} className={`relative block overflow-hidden rounded-[26px] p-5 ${cardTone(student.statut, Boolean(highlight))}`}>
      <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" aria-hidden />
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-sm font-extrabold">{initials(student.displayName)}</span>
        <div>
          <p className="text-lg font-extrabold">{student.displayName}</p>
          {student.formation ? <p className="text-[13px] opacity-80">{student.formation}</p> : null}
        </div>
      </div>
      <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${pill.className}`}>{pill.label}</span>
      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full" style={ringStyle(student.missionsValidees, student.missionsTotal)}>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0C0D12] text-xs font-bold">
            {student.missionsValidees}/{student.missionsTotal}
          </span>
        </span>
        <div className="text-sm">
          <p>{student.missionsValidees} / {student.missionsTotal} missions validées</p>
          {student.nextDeadline ? <p className="opacity-80">Échéance {student.nextDeadline}</p> : null}
          {student.todayPlace ? <p className="opacity-80">{student.todayPlace === "ecole" ? "À l'école aujourd'hui" : "En entreprise aujourd'hui"}</p> : null}
        </div>
      </div>
    </Link>
  );
}

export function TutorAlternants() {
  const router = useRouter();
  const params = useSearchParams();
  const filter = params.get("filtre") ?? "tous";
  const [query, setQuery] = useState("");
  const [data, setData] = useState<TutorHomePayload | null>(null);

  useEffect(() => {
    void loadHome().then((result) => setData(result.data));
  }, []);

  const students = useMemo(() => {
    const source = data?.students ?? [];
    return source.filter((student) => {
      if (query && !student.displayName.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === "surveiller") return student.statut === "a_surveiller";
      if (filter === "entreprise") return student.todayPlace === "entreprise";
      if (filter === "missions") return student.missionsAValider > 0;
      return true;
    });
  }, [data, filter, query]);

  function setFilter(next: string) {
    const url = next === "tous" ? "/dashboard/tuteur/alternants" : `/dashboard/tuteur/alternants?filtre=${next}`;
    router.push(url);
  }

  const watch = data?.students.filter((student) => student.statut === "a_surveiller").length ?? 0;
  const company = data?.inCompanyToday ?? 0;
  const missions = data?.students.filter((student) => student.missionsAValider > 0).length ?? 0;

  return (
    <TuteurShell tutorName={data?.tutorName ?? "Tuteur"} navBadges={{ missions: data?.counts.validate }}>
      <h1 className="text-[44px] font-extrabold leading-none tracking-[-1.5px]">Mes alternants</h1>
      {data ? (
        <p className="mt-3 text-[#B5BAC6]">
          {data.students.length} alternants · {watch} à surveiller · {company} en entreprise aujourd&apos;hui
        </p>
      ) : null}
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher"
        className="mt-5 w-full rounded-full border border-[#262A36] bg-[#12141A] px-4 py-3 text-sm"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ["tous", "Tous", data?.students.length ?? 0],
          ["surveiller", "À surveiller", watch],
          ["entreprise", "En entreprise aujourd'hui", company],
          ["missions", "Missions à valider", missions],
        ].map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(String(id))}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === id ? "bg-white text-[#07080B]" : "bg-[#1E2130] text-[#DADDE4]"}`}
          >
            {label} · {count}
          </button>
        ))}
      </div>
      {!data ? <p className="mt-8 text-sm text-[#9096A3]">Chargement…</p> : null}
      {data && students.length === 0 ? (
        <p className="mt-8 text-[#DADDE4]">
          Aucun alternant ne vous est encore rattaché.{" "}
          <Link href="/dashboard/student/community" className="font-semibold text-[#C9C2FF]">Contacter le CFA</Link>
        </p>
      ) : null}
      <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {students.map((student) => (
          <StudentCard key={student.learnerId} student={student} highlight={student.statut === "a_jour" && students.filter((item) => item.statut === "a_jour")[0]?.learnerId === student.learnerId} />
        ))}
      </div>
    </TuteurShell>
  );
}

export function TutorFicheView({ studentId }: { studentId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") ?? "missions";
  const [fiche, setFiche] = useState<TutorFiche | null>(null);
  const [missingStudent, setMissingStudent] = useState(false);
  const [results, setResults] = useState<{ shares: Array<{ scope: string; grantedAt: string }>; results: Record<string, unknown> } | null>(null);
  const [modal, setModal] = useState<"interview" | "absence" | null>(null);

  useEffect(() => {
    void fetch(`/api/tuteur/alternants/${studentId}`, { cache: "no-store" }).then(async (res) => {
      if (res.status === 404) {
        setMissingStudent(true);
        return;
      }
      if (res.ok) setFiche(await res.json());
    });
  }, [studentId]);

  useEffect(() => {
    if (tab !== "resultats") return;
    void fetch(`/api/tuteur/alternants/${studentId}/resultats`, { cache: "no-store" }).then(async (res) => {
      if (res.ok) setResults(await res.json());
    });
  }, [studentId, tab]);

  if (missingStudent) {
    return (
      <TuteurShell tutorName="Tuteur">
        <p>Cet alternant ne vous est pas rattaché.</p>
      </TuteurShell>
    );
  }
  if (!fiche) {
    return (
      <TuteurShell tutorName="Tuteur">
        <p className="text-sm text-[#9096A3]">Chargement…</p>
      </TuteurShell>
    );
  }

  const student = fiche.student;
  const groups = new Map<string, TutorFiche["missions"]>();
  for (const mission of fiche.missions) {
    const list = groups.get(mission.competency) ?? [];
    list.push(mission);
    groups.set(mission.competency, list);
  }

  return (
    <TuteurShell tutorName={student.displayName}>
      <Link href="/dashboard/tuteur/alternants" className="inline-flex rounded-full bg-[#1E2130] px-4 py-2 text-sm font-semibold">← Mes alternants</Link>
      <section className="relative mt-4 overflow-hidden rounded-[36px] bg-[#0C0D12] p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#6E5BFF]/25" aria-hidden />
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1E2130] text-2xl font-extrabold">{initials(student.displayName)}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(32px,3.6vw,44px)] font-extrabold leading-none">{student.displayName}</h1>
            <p className="mt-2 text-sm text-[#B5BAC6]">{[fiche.diploma, student.formation, "Byound School"].filter(Boolean).join(" · ")}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {student.email ? <a className="rounded-full bg-[#1E2130] px-3 py-1" href={`mailto:${student.email}`}>{student.email}</a> : null}
              {student.phone ? <a className="rounded-full bg-[#1E2130] px-3 py-1" href={`tel:${student.phone}`}>{student.phone}</a> : null}
              {student.rythme ? <span className="rounded-full bg-[#1E2130] px-3 py-1">{student.rythme}</span> : null}
            </div>
          </div>
          <span className="flex h-[136px] w-[136px] items-center justify-center rounded-full" style={ringStyle(student.missionsValidees, student.missionsTotal)}>
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#0C0D12] text-center text-sm font-bold">
              {student.missionsValidees}/{student.missionsTotal}
            </span>
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/dashboard/student/community" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]">Message</Link>
          {student.phone ? <a href={`tel:${student.phone}`} className="rounded-full bg-[#1E2130] px-4 py-2 text-sm font-bold">Appeler</a> : null}
          <button type="button" className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-bold" onClick={() => setModal("interview")}>Planifier un entretien</button>
          <button type="button" className="rounded-full bg-[#1E2130] px-4 py-2 text-sm font-bold" onClick={() => setModal("absence")}>Signaler une absence</button>
        </div>
      </section>

      <div role="tablist" className="mt-5 flex gap-2">
        {[
          ["missions", "Missions"],
          ["entretiens", "Entretiens"],
          ["agenda", "Agenda"],
          ["resultats", "Résultats des tests"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === id ? "bg-white text-[#07080B]" : "bg-[#1E2130]"}`}
            onClick={() => router.push(`/dashboard/tuteur/alternants/${studentId}?tab=${id}`)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "missions" ? (
        <div className="mt-5 space-y-4">
          {[...groups.entries()].map(([name, missions]) => {
            const doneCount = missions.filter((mission) => mission.status === "done").length;
            return (
              <section key={name} className="rounded-[26px] border border-[#262A36] bg-[#12141A] p-4">
                <p className="font-extrabold">{name}</p>
                <p className="text-sm text-[#B5BAC6]">{doneCount}/{missions.length}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#262A36]">
                  <div className="h-full bg-[#6E5BFF]" style={{ width: `${missions.length ? (doneCount / missions.length) * 100 : 0}%` }} />
                </div>
                {missions.map((mission) => (
                  <div key={mission.id} className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{mission.title}</p>
                      <p className="text-sm text-[#9096A3]">
                        {mission.status === "done" && mission.completedAt
                          ? `Validée le ${new Date(mission.completedAt).toLocaleDateString("fr-FR")}`
                          : mission.dueDate
                            ? `Échéance ${new Date(mission.dueDate).toLocaleDateString("fr-FR")}`
                            : mission.instructions ?? ""}
                      </p>
                    </div>
                    {mission.status === "in_progress" ? (
                      <button
                        type="button"
                        className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#07080B]"
                        onClick={() => {
                          void fetch(`/api/tuteur/missions/${mission.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ statut: "VALIDEE" }),
                          }).then(() => window.location.reload());
                        }}
                      >
                        Valider
                      </button>
                    ) : (
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${mission.status === "done" ? "bg-[#0E2A1D] text-[#6BE39B]" : mission.dueDate && new Date(mission.dueDate).getTime() < Date.now() ? "bg-[#3A2414] text-[#FFAA6B]" : "bg-[#1E2130] text-[#B5BAC6]"}`}>
                        {mission.status === "done" ? "Validée" : mission.dueDate && new Date(mission.dueDate).getTime() < Date.now() ? "En retard" : "À faire"}
                      </span>
                    )}
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      ) : null}

      {tab === "entretiens" ? (
        <div className="mt-5 space-y-3">
          <button type="button" className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-bold" onClick={() => setModal("interview")}>Planifier un entretien</button>
          {fiche.interviews.length === 0 ? <p className="text-[#B5BAC6]">Aucun entretien planifié.</p> : null}
          {fiche.interviews.map((item) => (
            <article key={item.id} className="rounded-[22px] border border-[#262A36] bg-[#12141A] p-4">
              <p className="font-bold">{item.title}</p>
              <p className="text-sm text-[#B5BAC6]">{new Date(item.startsAt).toLocaleString("fr-FR")}{item.place ? ` · ${item.place}` : ""}</p>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "agenda" ? (
        <div className="mt-5 grid grid-cols-7 gap-2">
          {fiche.agendaDays.map((day) => (
            <div key={day.date} className={`min-h-[52px] rounded-xl p-2 text-xs ${day.lieu === "ecole" ? "bg-[#6E5BFF]/20" : day.lieu === "entreprise" ? "bg-[#2F7CF6]/20" : "bg-[#1E2130]"}`}>
              {Number(day.date.slice(-2))}
            </div>
          ))}
        </div>
      ) : null}

      {tab === "resultats" ? (
        <div className="mt-5">
          {results && results.shares.length > 0 ? (
            <div className="rounded-[26px] bg-[#0E2A1D] p-4 text-[#6BE39B]">
              Résultats partagés. Cette personne peut retirer ce partage à tout moment.
              <p className="mt-3 text-sm text-[#DADDE4]">Ces résultats aident à adapter l&apos;accompagnement. Ils ne constituent pas une évaluation de la personne.</p>
            </div>
          ) : (
            <div className="rounded-[26px] border border-[#262A36] bg-[#12141A] p-6">
              <p className="text-xl font-extrabold">Résultats non partagés</p>
              <p className="mt-2 text-[#B5BAC6]">{student.firstName} n&apos;a pas choisi de partager ses résultats avec son tuteur. Cette personne seule peut décider de le faire.</p>
            </div>
          )}
        </div>
      ) : null}

      {modal ? (
        <FicheModal
          kind={modal}
          learnerId={student.learnerId}
          onClose={() => setModal(null)}
        />
      ) : null}
    </TuteurShell>
  );
}

function FicheModal({ kind, learnerId, onClose }: { kind: "interview" | "absence"; learnerId: string; onClose: () => void }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (kind === "absence") {
      await fetch("/api/tuteur/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, date: form.get("date"), motif: form.get("motif") }),
      });
    } else {
      const date = String(form.get("date") ?? "");
      const time = String(form.get("time") ?? "09:00");
      await fetch("/api/tuteur/entretiens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId,
          kind: form.get("kind"),
          startsAt: `${date}T${time}`,
          place: form.get("place"),
          participants: form.get("participants"),
        }),
      });
    }
    onClose();
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-3 rounded-[28px] bg-[#12141A] p-5">
        <h2 className="text-lg font-extrabold">{kind === "absence" ? "Signaler une absence" : "Planifier un entretien"}</h2>
        {kind === "interview" ? (
          <select name="kind" className="w-full rounded-xl bg-[#07080B] p-2">
            <option value="point">Point mensuel</option>
            <option value="evaluation">Évaluation</option>
            <option value="visite">Visite tripartite</option>
            <option value="autre">Autre</option>
          </select>
        ) : null}
        <input name="date" type="date" required className="w-full rounded-xl bg-[#07080B] p-2" />
        {kind === "interview" ? <input name="time" type="time" defaultValue="09:00" className="w-full rounded-xl bg-[#07080B] p-2" /> : null}
        {kind === "interview" ? <input name="place" placeholder="Lieu ou visio" className="w-full rounded-xl bg-[#07080B] p-2" /> : null}
        {kind === "interview" ? <input name="participants" placeholder="Participants" className="w-full rounded-xl bg-[#07080B] p-2" /> : null}
        {kind === "absence" ? <input name="motif" placeholder="Motif" className="w-full rounded-xl bg-[#07080B] p-2" /> : null}
        <div className="flex gap-2">
          <button type="submit" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#07080B]">Enregistrer</button>
          <button type="button" className="rounded-full bg-[#1E2130] px-4 py-2 text-sm" onClick={onClose}>Fermer</button>
        </div>
      </form>
    </div>
  );
}

export function TutorCalendar() {
  const [data, setData] = useState<TutorHomePayload | null>(null);
  useEffect(() => {
    void loadHome().then((result) => setData(result.data));
  }, []);
  return (
    <TuteurShell tutorName={data?.tutorName ?? "Tuteur"}>
      <h1 className="text-3xl font-extrabold">Calendrier</h1>
      {data?.week ? (
        <div className="mt-6 grid grid-cols-7 gap-2">
          {data.week.days.map((day) => (
            <div key={day.date} className="rounded-2xl bg-[#12141A] p-3 text-sm">
              <p className="font-bold">{day.label}</p>
              {day.schoolCount ? <p className="text-[#C9C2FF]">{day.schoolCount} à l&apos;école</p> : null}
              {day.companyCount ? <p className="text-[#B5BAC6]">{day.companyCount} en entreprise</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-[#B5BAC6]">Aucun rythme d&apos;alternance n&apos;est renseigné pour vos alternants.</p>
      )}
      {data?.deadlines.length ? (
        <section className="mt-6">
          <h2 className="font-extrabold">Échéances</h2>
          {data.deadlines.map((item) => (
            <p key={item.id} className="mt-2 text-sm text-[#DADDE4]">{item.dateLabel} · {item.label}</p>
          ))}
        </section>
      ) : null}
    </TuteurShell>
  );
}

export function TutorLivrets() {
  const [data, setData] = useState<TutorHomePayload | null>(null);
  useEffect(() => {
    void loadHome().then((result) => setData(result.data));
  }, []);
  const items = (data?.actions ?? []).filter((action) => action.kind === "signature");
  return (
    <TuteurShell tutorName={data?.tutorName ?? "Tuteur"}>
      <h1 className="text-3xl font-extrabold">Livrets</h1>
      {items.length === 0 ? <p className="mt-6 text-[#B5BAC6]">Aucun livret à signer.</p> : null}
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-[22px] border border-[#262A36] bg-[#12141A] p-4">
            <p className="font-bold">{item.title}</p>
            <p className="text-sm text-[#B5BAC6]">{item.subtitle}</p>
          </article>
        ))}
      </div>
    </TuteurShell>
  );
}
