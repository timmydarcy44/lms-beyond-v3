"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatPersonName } from "@/lib/control/account-participants-format";

type Tutor = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string | null;
  user_id?: string | null;
  activated_at?: string | null;
};

type Apprentice = {
  placementId: string;
  applicationId: string;
  tutorId: string | null;
  placementStatus: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  applicationStatus: string;
  startedAt: string | null;
};

type Payload = {
  linked: boolean;
  organizationName?: string;
  company: null | { id: string; name: string; city: string | null; siret: string | null };
  tutors: Tutor[];
  apprentices: Apprentice[];
  cfaHref: string | null;
};

export function AccountAlternanceTab({ organizationId }: { organizationId: string }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [designating, setDesignating] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ firstName: "", lastName: "", email: "", jobTitle: "" });
  const [search, setSearch] = useState("");
  const [candidates, setCandidates] = useState<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      specialization: string;
      status: string;
      alreadyHere: boolean;
      currentCompanyName: string;
    }>
  >([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/super/comptes-clients/${organizationId}/alternance`, {
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Chargement impossible");
    setData(json as Payload);
  }, [organizationId]);

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

  useEffect(() => {
    if (!data?.company?.id || search.trim().length < 2) {
      setCandidates([]);
      return;
    }
    const t = window.setTimeout(() => {
      void fetch(
        `/api/super-admin/crm/cfa/placements?q=${encodeURIComponent(search.trim())}&companyId=${encodeURIComponent(data.company!.id)}`,
        { cache: "no-store" },
      )
        .then(async (r) => {
          const j = await r.json();
          if (r.ok) setCandidates(j.candidates ?? []);
        })
        .catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search, data?.company?.id]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/super/comptes-clients/${organizationId}/alternance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action impossible");
      if (json.warning || json.message) setNotice(String(json.warning || json.message));
      await load();
      return json;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      return null;
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  if (!data?.linked || !data.company) {
    return (
      <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-6 text-[#F2F4FA]">
        <h2 className="text-lg font-extrabold">Alternance / entreprise d’accueil</h2>
        <p className="mt-2 max-w-xl text-sm text-[#9AA3BD]">
          Ce compte n’est pas encore relié à une entreprise d’accueil CFA. Active l’accueil pour
          gérer ici les alternants et les maîtres d’apprentissage.
        </p>
        {error ? <p className="mt-3 text-sm text-[#FF8A9B]">{error}</p> : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void post({ action: "ensure_cfa_company" })}
          className="mt-5 h-10 rounded-full bg-[#6E5BFF] px-5 text-sm font-extrabold text-white disabled:opacity-40"
        >
          {busy ? "…" : "Activer l’accueil CFA"}
        </button>
      </section>
    );
  }

  const unassigned = data.apprentices.filter((a) => !a.tutorId);

  return (
    <div className="space-y-5 text-[#F2F4FA]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Alternance</h2>
          <p className="mt-1 text-sm text-[#9AA3BD]">
            {data.company.name}
            {data.company.city ? ` · ${data.company.city}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.cfaHref ? (
            <Link
              href={data.cfaHref}
              className="inline-flex h-9 items-center rounded-full border border-[#26304F] px-4 text-xs font-extrabold"
            >
              Fiche CFA détaillée
            </Link>
          ) : null}
          <button
            type="button"
            className="h-9 rounded-full border border-[#26304F] px-4 text-xs font-extrabold"
            onClick={() => {
              setShowCreate((v) => !v);
              setDesignating(null);
            }}
          >
            ＋ Tuteur
          </button>
        </div>
      </header>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#F2CF6B]">{notice}</p> : null}

      {unassigned.map((a) => (
        <div
          key={`alert-${a.placementId}`}
          className="flex flex-wrap items-center gap-3 rounded-[16px] border border-[#FF8A9B40] px-4 py-3"
          style={{ background: "#FF8A9B14" }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">
              {formatPersonName(`${a.firstName} ${a.lastName}`)} n’a pas de maître d’apprentissage
            </p>
          </div>
          <button
            type="button"
            className="h-9 rounded-full bg-[#FF8A9B] px-4 text-xs font-extrabold text-[#0A0F1E]"
            onClick={() => {
              if (!data.tutors.length) setShowCreate(true);
              setDesignating(a.applicationId);
            }}
          >
            Désigner un tuteur
          </button>
        </div>
      ))}

      {designating && data.tutors.length ? (
        <ul className="space-y-2 rounded-[18px] border border-[#1A2340] bg-[#0B1122] p-3">
          {data.tutors.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                disabled={busy}
                className="w-full rounded-xl border border-[#26304F] px-3 py-2 text-left text-sm disabled:opacity-40"
                onClick={() =>
                  void post({
                    action: "set_tutor",
                    applicationId: designating,
                    tutorId: t.id,
                  }).then((r) => {
                    if (r) setDesignating(null);
                  })
                }
              >
                Désigner {formatPersonName(`${t.first_name} ${t.last_name}`)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showCreate ? (
        <form
          className="space-y-2 rounded-[18px] border border-[#1A2340] bg-[#111831] p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const autoAssign =
              designating || (unassigned.length === 1 ? unassigned[0].applicationId : undefined);
            void post({
              action: "create_tutor",
              firstName: formatPersonName(draft.firstName),
              lastName: formatPersonName(draft.lastName),
              email: draft.email,
              jobTitle: formatPersonName(draft.jobTitle),
              ...(autoAssign ? { applicationId: autoAssign } : {}),
            }).then((r) => {
              if (!r) return;
              setDraft({ firstName: "", lastName: "", email: "", jobTitle: "" });
              setShowCreate(false);
              if (r.needsAssignment && unassigned[0]) setDesignating(unassigned[0].applicationId);
              else setDesignating(null);
            });
          }}
        >
          <p className="text-sm font-semibold">Nouveau maître d’apprentissage</p>
          <input
            required
            placeholder="Prénom"
            value={draft.firstName}
            onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
            className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm"
          />
          <input
            required
            placeholder="Nom"
            value={draft.lastName}
            onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
            className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm"
          />
          <input
            required
            type="email"
            placeholder="E-mail professionnel"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm"
          />
          <input
            placeholder="Poste"
            value={draft.jobTitle}
            onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
            className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm"
          />
          <p className="text-xs text-[#AEB6CC]">
            {designating || unassigned.length === 1
              ? "Le tuteur sera rattaché à l’alternant et recevra un code."
              : "Sans alternant sélectionné, tu devras l’assigner juste après."}
          </p>
          <button
            type="submit"
            disabled={busy}
            className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white disabled:opacity-40"
          >
            Créer et prévenir
          </button>
        </form>
      ) : null}

      <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <h3 className="font-extrabold">Alternants</h3>
        <div className="mt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rattacher un apprenant (prénom ou nom)…"
            className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm"
          />
          {candidates.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {candidates.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#26304F] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {formatPersonName(`${c.firstName} ${c.lastName}`)}
                    </p>
                    <p className="text-xs text-[#9AA3BD]">
                      {c.specialization || c.status}
                      {c.currentCompanyName && !c.alreadyHere
                        ? ` · déjà chez ${c.currentCompanyName}`
                        : ""}
                    </p>
                  </div>
                  {c.alreadyHere ? (
                    <span className="text-xs font-extrabold text-[#5EDCC3]">Déjà ici</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      className="h-8 rounded-full bg-[#E7A92C] px-3 text-xs font-extrabold text-[#2A1F06]"
                      onClick={() =>
                        void post({ action: "set_company", applicationId: c.id }).then(() =>
                          setSearch(""),
                        )
                      }
                    >
                      Rattacher
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <ul className="mt-4 divide-y divide-[#1C2443]">
          {data.apprentices.length === 0 ? (
            <li className="py-4 text-sm text-[#9AA3BD]">Aucun alternant pour l’instant.</li>
          ) : (
            data.apprentices.map((a) => {
              const tutor = data.tutors.find((t) => t.id === a.tutorId);
              return (
                <li key={a.placementId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link
                      href={`/super/crm/cfa/apprenants/${a.applicationId}`}
                      className="font-semibold hover:underline"
                    >
                      {formatPersonName(`${a.firstName} ${a.lastName}`)}
                    </Link>
                    <p className="text-xs text-[#9AA3BD]">
                      {a.specialization || a.applicationStatus}
                      {a.placementStatus === "active" ? " · en contrat" : " · placement en cours"}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                    style={{
                      background: tutor ? "#0E2A28" : "#3A1420",
                      color: tutor ? "#5EDCC3" : "#FF8A9B",
                    }}
                  >
                    {tutor
                      ? `Tuteur : ${formatPersonName(`${tutor.first_name} ${tutor.last_name}`)}`
                      : "Sans tuteur"}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <h3 className="font-extrabold">Tuteurs</h3>
        <ul className="mt-3 divide-y divide-[#1C2443]">
          {data.tutors.length === 0 ? (
            <li className="py-4 text-sm text-[#9AA3BD]">Aucun tuteur pour l’instant.</li>
          ) : (
            data.tutors.map((t) => {
              const count = data.apprentices.filter((a) => a.tutorId === t.id).length;
              return (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">
                      {formatPersonName(`${t.first_name} ${t.last_name}`)}
                    </p>
                    <p className="text-xs text-[#9AA3BD]">
                      {formatPersonName(t.job_title) || "Maître d’apprentissage"} · {t.email}
                    </p>
                  </div>
                  <span className="text-xs text-[#9AA3BD]">
                    {count} alternant{count > 1 ? "s" : ""}
                    {t.activated_at ? " · activé" : " · invitation envoyée"}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      </section>
    </div>
  );
}
