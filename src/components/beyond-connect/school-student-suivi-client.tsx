"use client";

import { useMemo, useState } from "react";

type SuiviProfile = {
  first_name?: string | null;
  last_name?: string | null;
};

type RdvItem = {
  id: string;
  date: string;
  who: string;
  where: string;
  how: string;
  notes: string;
};

type MissionItem = {
  id: string;
  name: string;
  score: number;
  comment: string;
  note: number;
};

const HOW_OPTIONS = ["Téléphone", "Visio", "Sur place", "À l'école"];

export function SchoolStudentSuiviClient({ profile }: { profile: SuiviProfile }) {
  const [rdvs, setRdvs] = useState<RdvItem[]>([]);
  const [showRdvForm, setShowRdvForm] = useState(false);
  const [rdvDate, setRdvDate] = useState("");
  const [rdvWho, setRdvWho] = useState("");
  const [rdvWhere, setRdvWhere] = useState("");
  const [rdvHow, setRdvHow] = useState(HOW_OPTIONS[0]);
  const [rdvNotes, setRdvNotes] = useState("");

  const [missions, setMissions] = useState<MissionItem[]>([
    { id: "m1", name: "Prospection terrain", score: 85, comment: "", note: 4 },
    { id: "m2", name: "Négociation client", score: 78, comment: "", note: 3 },
    { id: "m3", name: "Reporting hebdomadaire", score: 92, comment: "", note: 5 },
  ]);
  const [newMissionName, setNewMissionName] = useState("");
  const [newMissionScore, setNewMissionScore] = useState("70");

  const handleAddRdv = () => {
    if (!rdvDate.trim() || !rdvWho.trim()) return;
    setRdvs((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        date: rdvDate,
        who: rdvWho,
        where: rdvWhere,
        how: rdvHow,
        notes: rdvNotes,
      },
    ]);
    setShowRdvForm(false);
    setRdvDate("");
    setRdvWho("");
    setRdvWhere("");
    setRdvHow(HOW_OPTIONS[0]);
    setRdvNotes("");
  };

  const handleAddMission = () => {
    if (!newMissionName.trim()) return;
    const score = Math.max(0, Math.min(100, Number(newMissionScore) || 0));
    setMissions((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        name: newMissionName.trim(),
        score,
        comment: "",
        note: 3,
      },
    ]);
    setNewMissionName("");
    setNewMissionScore("70");
  };

  const averageScore = useMemo(() => {
    if (!missions.length) return 0;
    const total = missions.reduce((sum, m) => sum + m.score, 0);
    return Math.round(total / missions.length);
  }, [missions]);

  return (
    <>
      <header className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <h1 className="text-2xl font-semibold">
          Suivi de {profile.first_name || ""} {profile.last_name || ""}
        </h1>
        <p className="mt-2 text-sm text-black/60">Pilotage pédagogique et entreprise en temps réel.</p>
      </header>

      <section className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-black/50">Rendez-vous</p>
          <button
            type="button"
            onClick={() => setShowRdvForm((prev) => !prev)}
            className="rounded-full bg-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            + Ajouter un RDV
          </button>
        </div>
        {showRdvForm ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black/60">Date</label>
              <input
                type="date"
                value={rdvDate}
                onChange={(event) => setRdvDate(event.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black/60">Qui</label>
              <input
                value={rdvWho}
                onChange={(event) => setRdvWho(event.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black/60">Où</label>
              <input
                value={rdvWhere}
                onChange={(event) => setRdvWhere(event.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black/60">Comment</label>
              <select
                value={rdvHow}
                onChange={(event) => setRdvHow(event.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              >
                {HOW_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-black/60">Appréciation</label>
              <textarea
                value={rdvNotes}
                onChange={(event) => setRdvNotes(event.target.value)}
                className="h-24 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAddRdv}
              className="inline-flex w-fit rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Enregistrer
            </button>
          </div>
        ) : null}
        {rdvs.length ? (
          <div className="mt-4 space-y-3">
            {rdvs.map((rdv) => (
              <div key={rdv.id} className="rounded-2xl border border-black/10 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-black/60">
                  <span>{rdv.date}</span>
                  <span>{rdv.how}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-black">{rdv.who}</p>
                <p className="text-xs text-black/50">{rdv.where}</p>
                <p className="mt-2 text-sm text-black/70">{rdv.notes}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-black/50">Missions & Évaluations</p>
          <div className="text-xs font-semibold text-black/60">Moyenne générale : {averageScore}%</div>
        </div>
        <p className="mt-2 text-xs text-black/50">Données synchronisées depuis l'interface tuteur.</p>
        <div className="mt-4 space-y-4">
          {missions.map((mission) => (
            <div key={mission.id} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-black">{mission.name}</p>
                <span className="text-xs font-semibold text-black/60">{mission.score}%</span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-black/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600"
                  style={{ width: `${mission.score}%` }}
                />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-black/10 bg-white px-3 py-2">
                  <p className="text-xs font-semibold text-black/60">Commentaire du tuteur</p>
                  <p className="mt-1 text-sm text-black/70">
                    {mission.comment || "Commentaire en attente de synchronisation."}
                  </p>
                </div>
                <div className="rounded-lg border border-black/10 bg-white px-3 py-2">
                  <p className="text-xs font-semibold text-black/60">Note /5</p>
                  <p className="mt-1 text-sm text-black/70">{mission.note}/5</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-black/50">Ajouter une mission (cursus)</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input
              value={newMissionName}
              onChange={(event) => setNewMissionName(event.target.value)}
              placeholder="NDRC · Prospection terrain"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={newMissionScore}
              onChange={(event) => setNewMissionScore(event.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              min={0}
              max={100}
            />
            <button
              type="button"
              onClick={handleAddMission}
              className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Ajouter
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
