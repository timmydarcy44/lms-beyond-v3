"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import {
  BUSINESS_TRAINING_CATEGORIES,
  BUSINESS_TRAINING_ITEMS,
  type BusinessTrainingItem,
} from "@/lib/enterprise/business-training-catalog";
import { cn } from "@/lib/utils";

const FORMAT_OPTIONS = ["Présentiel", "Distanciel", "Blended", "À définir"] as const;

type RequestFormState = {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  participants: string;
  preferred_format: string;
  preferred_period: string;
  notes: string;
};

const EMPTY_FORM: RequestFormState = {
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  participants: "",
  preferred_format: "À définir",
  preferred_period: "",
  notes: "",
};

function TrainingCard({
  item,
  onRequest,
}: {
  item: BusinessTrainingItem;
  onRequest: (item: BusinessTrainingItem) => void;
}) {
  return (
    <article className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
            {item.category}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-gray-900">{item.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{item.subtitle}</p>
        </div>
        <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          À partir de {item.startingPrice}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-gray-600 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Durée</p>
          <p className="mt-1 font-medium text-gray-800">{item.duration}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Niveau</p>
          <p className="mt-1 font-medium text-gray-800">{item.level}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Format</p>
          <p className="mt-1 font-medium text-gray-800">{item.format}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Expert</p>
          <p className="mt-1 font-medium text-gray-800">{item.expert}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-5">
        <div className="flex flex-wrap gap-5 text-sm text-gray-500">
          <span>{item.companiesCount} entreprises formées</span>
          <span>{item.participants}</span>
        </div>
        <button
          type="button"
          onClick={() => onRequest(item)}
          className="inline-flex items-center rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          Demander cette formation
        </button>
      </div>
    </article>
  );
}

function RequestModal({
  item,
  form,
  onChange,
  onClose,
  onSubmit,
  submitting,
  error,
  success,
}: {
  item: BusinessTrainingItem;
  form: RequestFormState;
  onChange: (patch: Partial<RequestFormState>) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
  success: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-gray-100 bg-white p-6 shadow-2xl sm:p-8">
        {success ? (
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-500">
              Demande envoyée
            </p>
            <h2 className="mt-3 text-2xl font-bold text-gray-950">Merci, c’est bien reçu</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Votre demande pour <strong>{item.title}</strong> a été transmise à l’équipe EDGE. Nous
              vous recontactons rapidement.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-500">
                  {item.category}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950">Demander {item.title}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {item.duration} · {item.level} · à partir de {item.startingPrice}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Contact</span>
                  <input
                    required
                    value={form.contact_name}
                    onChange={(e) => onChange({ contact_name: e.target.value })}
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Email</span>
                  <input
                    required
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => onChange({ contact_email: e.target.value })}
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">
                    Téléphone <span className="font-normal text-gray-400">(optionnel)</span>
                  </span>
                  <input
                    value={form.contact_phone}
                    onChange={(e) => onChange({ contact_phone: e.target.value })}
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Nombre de participants</span>
                  <input
                    required
                    value={form.participants}
                    onChange={(e) => onChange({ participants: e.target.value })}
                    placeholder="ex. 8"
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Format souhaité</span>
                  <select
                    value={form.preferred_format}
                    onChange={(e) => onChange({ preferred_format: e.target.value })}
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  >
                    {FORMAT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">
                    Période souhaitée <span className="font-normal text-gray-400">(optionnel)</span>
                  </span>
                  <input
                    value={form.preferred_period}
                    onChange={(e) => onChange({ preferred_period: e.target.value })}
                    placeholder="ex. octobre 2026"
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-gray-700">
                  Précisions pour EDGE <span className="font-normal text-gray-400">(optionnel)</span>
                </span>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => onChange({ notes: e.target.value })}
                  placeholder="Objectifs, public concerné, contraintes…"
                  className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                />
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex items-center justify-center rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
              >
                {submitting ? "Envoi…" : "Envoyer la demande"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function EntrepriseFormationRequestPage() {
  const [category, setCategory] = useState<string>("Tous");
  const [selected, setSelected] = useState<BusinessTrainingItem | null>(null);
  const [form, setForm] = useState<RequestFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const viewerRes = await fetch("/api/dashboard/entreprise/viewer");
        const viewer = viewerRes.ok ? await viewerRes.json() : null;
        if (cancelled) return;

        const prenom = String(viewer?.prenom ?? "").trim();
        const nom = String(viewer?.nom ?? "").trim();
        const name = [prenom, nom].filter(Boolean).join(" ");
        const email = String(viewer?.email ?? "").trim();

        setForm((prev) => ({
          ...prev,
          contact_name: prev.contact_name || name,
          contact_email: prev.contact_email || email,
        }));
      } catch {
        // Prefill optionnel
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (category === "Tous") return BUSINESS_TRAINING_ITEMS;
    return BUSINESS_TRAINING_ITEMS.filter((item) => item.category === category);
  }, [category]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of BUSINESS_TRAINING_ITEMS) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return map;
  }, []);

  const openRequest = (item: BusinessTrainingItem) => {
    setSelected(item);
    setError(null);
    setSuccess(false);
  };

  const closeRequest = () => {
    setSelected(null);
    setError(null);
    setSuccess(false);
    setSubmitting(false);
  };

  const submitRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/entreprise/formations/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          training_id: selected.id,
          ...form,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data.error ?? "Envoi impossible."));
        return;
      }
      setSuccess(true);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f3fb] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mx-auto mb-8 max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-500">
            Formations EDGE
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-950">
            Demander une formation
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Catalogue business EDGE ({BUSINESS_TRAINING_ITEMS.length} formations) — filtrer par
            thématique puis envoyer une demande : l’équipe EDGE reçoit votre besoin par email.
          </p>
        </header>

        <section className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap gap-2">
            {BUSINESS_TRAINING_CATEGORIES.map((cat) => {
              const count =
                cat === "Tous" ? BUSINESS_TRAINING_ITEMS.length : (counts.get(cat) ?? 0);
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-violet-200 bg-white text-violet-700 hover:border-violet-400",
                  )}
                >
                  {cat}
                  <span className={cn("ml-1.5 opacity-70", active && "opacity-90")}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mb-4 text-sm text-gray-500">
            {filtered.length} formation{filtered.length > 1 ? "s" : ""}
            {category !== "Tous" ? ` · ${category}` : ""}
          </p>

          {filtered.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              Aucune formation dans cette catégorie pour le moment.
            </div>
          ) : (
            <div className="grid gap-5">
              {filtered.map((item) => (
                <TrainingCard key={item.id} item={item} onRequest={openRequest} />
              ))}
            </div>
          )}
        </section>
      </main>

      {selected ? (
        <RequestModal
          item={selected}
          form={form}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          onClose={closeRequest}
          onSubmit={submitRequest}
          submitting={submitting}
          error={error}
          success={success}
        />
      ) : null}
    </div>
  );
}
