"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  ClipboardList,
  Loader2,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";

const C = {
  border: "#1C2443",
  secondary: "#9AA3BD",
  tertiary: "#6C7593",
  violet: "#6E5BFF",
  blue: "#8DB8FF",
  green: "#6BE39B",
  amber: "#F2CF6B",
  turquoise: "#5EDCC3",
  framboise: "#FF5C8A",
};

type Mission = {
  id: string;
  title: string;
  instructions: string | null;
  status: string;
  statusLabel: string;
  dueDate: string | null;
  late: boolean;
  deliverable: string | null;
  tutorComment: string | null;
};

type LivretPeriod = {
  id: string;
  index: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  needsStudent: boolean;
};

type Payload = {
  assigned: boolean;
  company: null | {
    id: string;
    name: string;
    city: string | null;
    address: string | null;
    siret: string | null;
  };
  tutor: null | {
    id: string | null;
    name: string | null;
    email: string | null;
    jobTitle: string | null;
  };
  hasActiveTutorLink?: boolean;
  missions: Mission[];
  livret: { bookletId: string | null; periods: LivretPeriod[] };
  todos: { missionsOpen: number; livretOpen: number; total: number };
};

function formatDue(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function statusColor(status: string, late: boolean) {
  if (late) return C.framboise;
  if (status === "validated" || status === "done") return C.green;
  if (status === "submitted") return C.blue;
  if (status === "correction_requested") return C.amber;
  if (status === "in_progress") return C.violet;
  return C.secondary;
}

export function MonEntrepriseClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/dashboard/apprenant/entreprise", { credentials: "include" });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Chargement impossible");
    setData(j as Payload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void load()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const actMission = async (id: string, action: "start" | "submit") => {
    setBusyId(id);
    setError(null);
    try {
      const r = await fetch(`/api/dashboard/apprenant/entreprise/missions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Mise à jour impossible");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  if (!data?.assigned || !data.company) {
    return (
      <div className="mx-auto max-w-3xl pb-16 pt-1 text-[#F2F4FA]">
        <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[40px]">Mon entreprise</h1>
        <p className="mt-3 text-sm" style={{ color: C.secondary }}>
          Aucune entreprise d’accueil n’est encore rattachée. Dès que le CFA te place, tu retrouveras
          ici tes missions et ce qu’il te reste à faire.
        </p>
        {error ? <p className="mt-4 text-sm text-[#FF8A9B]">{error}</p> : null}
      </div>
    );
  }

  const { company, tutor, missions, livret, todos } = data;
  const place = [company.address, company.city].filter(Boolean).join(", ");
  const openMissions = missions.filter((m) =>
    ["todo", "in_progress", "submitted", "correction_requested"].includes(m.status),
  );
  const doneMissions = missions.filter((m) => ["done", "validated"].includes(m.status));
  const livretTodo = livret.periods.filter((p) => p.needsStudent);

  return (
    <div className="mx-auto max-w-3xl space-y-12 pb-16 pt-1 text-[#F2F4FA]">
      <header>
        <p className="text-sm font-medium" style={{ color: C.turquoise }}>
          Entreprise d’accueil
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold tracking-tight sm:text-[40px]">
          {company.name}
        </h1>
        {place ? (
          <p className="mt-3 flex items-start gap-2 text-sm" style={{ color: C.secondary }}>
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.tertiary }} />
            {place}
          </p>
        ) : null}
        {todos.total > 0 ? (
          <p className="mt-4 text-sm font-semibold" style={{ color: C.amber }}>
            {todos.total} chose{todos.total > 1 ? "s" : ""} à faire côté entreprise
          </p>
        ) : (
          <p className="mt-4 text-sm" style={{ color: C.secondary }}>
            Rien d’urgent pour l’instant — suis ton planning et tes missions au fil de l’eau.
          </p>
        )}
      </header>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      {/* À faire */}
      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" style={{ color: C.amber }} />
          <h2 className="text-lg font-extrabold">À faire en entreprise</h2>
        </div>

        {livretTodo.length > 0 ? (
          <ul className="space-y-3">
            {livretTodo.map((p) => (
              <li key={p.id} className="border-b pb-3" style={{ borderColor: C.border }}>
                <p className="font-semibold">Livret · période {p.index}</p>
                <p className="mt-1 text-sm" style={{ color: C.secondary }}>
                  Ta signature est attendue
                  {p.endDate ? ` · jusqu’au ${formatDue(p.endDate)}` : ""}
                </p>
                <Link
                  href={`/livret/periode/${p.id}`}
                  className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0A0F1E]"
                >
                  Signer la période →
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {openMissions.length > 0 ? (
          <ul className="space-y-4">
            {openMissions.map((m) => (
              <li key={m.id} className="border-b pb-4" style={{ borderColor: C.border }}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold">{m.title}</p>
                  <span className="text-[11px] font-semibold" style={{ color: statusColor(m.status, m.late) }}>
                    {m.late ? "En retard · " : ""}
                    {m.statusLabel}
                  </span>
                </div>
                {m.instructions ? (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.secondary }}>
                    {m.instructions}
                  </p>
                ) : null}
                {m.deliverable ? (
                  <p className="mt-2 text-xs" style={{ color: C.tertiary }}>
                    Livrable attendu : {m.deliverable}
                  </p>
                ) : null}
                {m.tutorComment ? (
                  <p className="mt-2 text-xs" style={{ color: C.amber }}>
                    Commentaire tuteur : {m.tutorComment}
                  </p>
                ) : null}
                {m.dueDate ? (
                  <p className="mt-2 text-xs" style={{ color: C.tertiary }}>
                    Pour le {formatDue(m.dueDate)}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {["todo", "correction_requested"].includes(m.status) ? (
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => void actMission(m.id, "start")}
                      className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-40"
                      style={{ borderColor: C.border }}
                    >
                      {busyId === m.id ? "…" : "Je commence"}
                    </button>
                  ) : null}
                  {["todo", "in_progress", "correction_requested"].includes(m.status) ? (
                    <button
                      type="button"
                      disabled={busyId === m.id}
                      onClick={() => void actMission(m.id, "submit")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0A0F1E] disabled:opacity-40"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {busyId === m.id ? "…" : "Envoyer au tuteur"}
                    </button>
                  ) : null}
                  {m.status === "submitted" ? (
                    <p className="text-sm" style={{ color: C.blue }}>
                      En attente de validation par ton tuteur.
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {!openMissions.length && !livretTodo.length ? (
          <p className="text-sm leading-relaxed" style={{ color: C.secondary }}>
            {data.hasActiveTutorLink
              ? "Ton tuteur ne t’a pas encore assigné de mission. Dès qu’il le fait, elles apparaîtront ici."
              : "Dès qu’un maître d’apprentissage est rattaché, il pourra te confier des missions — tu les verras ici, avec le livret à signer."}
          </p>
        ) : null}
      </section>

      {/* Validées */}
      {doneMissions.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-extrabold">Missions validées</h2>
          <ul className="space-y-2">
            {doneMissions.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{m.title}</span>
                <span style={{ color: C.green }}>Validée</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Tuteur */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4" style={{ color: C.blue }} />
          <h2 className="text-lg font-extrabold">Ton tuteur</h2>
        </div>
        {tutor?.name ? (
          <div>
            <p className="text-xl font-bold">{tutor.name}</p>
            {tutor.jobTitle ? (
              <p className="mt-1 text-sm" style={{ color: C.secondary }}>
                {tutor.jobTitle}
              </p>
            ) : null}
            {tutor.email ? (
              <a
                href={`mailto:${tutor.email}`}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#0A0F1E]"
              >
                <Mail className="h-4 w-4" /> Lui écrire
              </a>
            ) : (
              <p className="mt-3 text-sm" style={{ color: C.tertiary }}>
                Son e-mail n’est pas encore disponible.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm" style={{ color: C.secondary }}>
            Ton maître d’apprentissage n’est pas encore rattaché. Le CFA le fera bientôt.
          </p>
        )}
      </section>

      {/* Raccourcis */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" style={{ color: C.violet }} />
          <h2 className="text-lg font-extrabold">Autour de ton alternance</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/apprenant/planning"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            style={{ borderColor: C.border, color: C.blue }}
          >
            <CalendarDays className="h-4 w-4" /> Planning
          </Link>
          <Link
            href="/dashboard/apprenant/planning/absences"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            style={{ borderColor: C.border, color: C.blue }}
          >
            Signaler une absence
          </Link>
          <Link
            href="/dashboard/apprenant/livret"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            style={{ borderColor: C.border, color: C.blue }}
          >
            Livret d’apprentissage
          </Link>
        </div>
      </section>
    </div>
  );
}
