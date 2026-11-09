"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import {
  BUSINESS_TRAINING_CATEGORIES,
  BUSINESS_TRAINING_ITEMS,
  type BusinessTrainingItem,
} from "@/lib/enterprise/business-training-catalog";
import { filterRealEntrepriseEmployees } from "@/lib/entreprise/demo-employee-id";
import type { EntrepriseEmployee } from "@/lib/entreprise/overview-types";
import { useEntrepriseOverview } from "@/hooks/use-entreprise-overview";
import { cn } from "@/lib/utils";

const FORMAT_OPTIONS = ["Présentiel", "Distanciel", "Blended", "À définir"] as const;

type RequestFormState = {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  participant_ids: string[];
  /** Nombre / noms hors plateforme (optionnel). */
  participants: string;
  preferred_format: string;
  preferred_period: string;
  funding_type: "direct" | "opco";
  preferred_location: string;
  notes: string;
};

const EMPTY_FORM: RequestFormState = {
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  participant_ids: [],
  participants: "",
  preferred_format: "À définir",
  preferred_period: "",
  funding_type: "direct",
  preferred_location: "Au sein de nos locaux",
  notes: "",
};

function matchTrainingFromIntent(courseId: string, courseTitle?: string): BusinessTrainingItem | null {
  const byId = BUSINESS_TRAINING_ITEMS.find((item) => item.id === courseId);
  if (byId) return byId;
  const title = (courseTitle ?? "").trim().toLowerCase();
  if (!title) return null;
  return (
    BUSINESS_TRAINING_ITEMS.find((item) => item.title.toLowerCase() === title) ??
    BUSINESS_TRAINING_ITEMS.find(
      (item) =>
        item.title.toLowerCase().includes(title) || title.includes(item.title.toLowerCase()),
    ) ??
    null
  );
}

function employeeName(employee: EntrepriseEmployee) {
  return (
    [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim() ||
    employee.email ||
    "Collaborateur"
  );
}

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
  employees,
  employeesLoading,
  opcoName,
  onChange,
  onToggleParticipant,
  onClose,
  onSubmit,
  submitting,
  error,
  success,
}: {
  item: BusinessTrainingItem;
  form: RequestFormState;
  employees: EntrepriseEmployee[];
  employeesLoading: boolean;
  opcoName: string | null;
  onChange: (patch: Partial<RequestFormState>) => void;
  onToggleParticipant: (employeeId: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
  success: boolean;
}) {
  const selectedCount = form.participant_ids.length;
  const allSelected =
    employees.length > 0 && selectedCount === employees.length;

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
              Votre demande pour <strong>{item.title}</strong> a été transmise à l’équipe Byound. Nous
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

              <fieldset className="grid gap-2 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
                <legend className="px-1 text-sm font-semibold text-gray-700">
                  Participants{" "}
                  <span className="font-normal text-gray-400">(optionnel)</span>
                  {selectedCount > 0 ? (
                    <span className="ml-2 font-normal text-violet-600">
                      {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </legend>

                {employeesLoading ? (
                  <p className="text-sm text-gray-500">Chargement de l’équipe…</p>
                ) : employees.length === 0 ? (
                  <div className="grid gap-2">
                    <p className="text-sm leading-6 text-gray-600">
                      Pas besoin d’inviter vos collaborateurs sur Byound pour un devis. Indiquez
                      le public ci-dessous, ou{" "}
                      <Link
                        href="/dashboard/entreprise/salaries"
                        className="font-semibold text-violet-600 underline-offset-2 hover:underline"
                      >
                        ajoutez-les plus tard
                      </Link>
                      .
                    </p>
                    <input
                      value={form.participants}
                      onChange={(e) => onChange({ participants: e.target.value })}
                      placeholder="ex. 8 commerciaux · équipe RH"
                      className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-violet-400"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            participant_ids: allSelected
                              ? []
                              : employees.map((employee) => employee.id),
                          })
                        }
                        className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-semibold text-violet-700 hover:border-violet-400"
                      >
                        {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                      </button>
                    </div>
                    <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                      {employees.map((employee) => {
                        const checked = form.participant_ids.includes(employee.id);
                        return (
                          <li key={employee.id}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-2xl border bg-white px-3 py-2.5 transition",
                                checked
                                  ? "border-violet-400 shadow-[0_0_0_1px_rgba(124,58,237,0.15)]"
                                  : "border-gray-200 hover:border-violet-200",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleParticipant(employee.id)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-gray-900">
                                  {employeeName(employee)}
                                </span>
                                <span className="block truncate text-xs text-gray-500">
                                  {[employee.job_title, employee.email].filter(Boolean).join(" · ") ||
                                    "—"}
                                </span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                    <label className="mt-1 grid gap-1.5 text-sm">
                      <span className="text-xs font-medium text-gray-500">
                        Autres participants hors plateforme (optionnel)
                      </span>
                      <input
                        value={form.participants}
                        onChange={(e) => onChange({ participants: e.target.value })}
                        placeholder="ex. 3 managers non encore invités"
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 outline-none focus:border-violet-400"
                      />
                    </label>
                  </>
                )}
              </fieldset>

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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5 text-sm">
                  <label className="grid gap-1.5">
                    <span className="font-semibold text-gray-700">Financement</span>
                    <select
                      value={form.funding_type}
                      onChange={(e) =>
                        onChange({ funding_type: e.target.value as "direct" | "opco" })
                      }
                      className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                    >
                      <option value="direct">Fonds propres</option>
                      <option value="opco">Prise en charge OPCO</option>
                    </select>
                  </label>
                  {form.funding_type === "opco" ? (
                    <p className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">
                      {opcoName
                        ? <>OPCO détecté pour votre entreprise : <strong>{opcoName}</strong></>
                        : "L’OPCO sera détecté automatiquement via votre SIRET (Mon compte) et reporté sur le devis."}
                    </p>
                  ) : null}
                </div>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Lieu souhaité</span>
                  <select
                    value={form.preferred_location}
                    onChange={(e) => onChange({ preferred_location: e.target.value })}
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  >
                    <option value="Au sein de nos locaux">Au sein de nos locaux</option>
                    <option value="Au sein de vos locaux (Byound)">
                      Au sein de vos locaux (Byound)
                    </option>
                    <option value="Distanciel / visio">Distanciel / visio</option>
                    <option value="Autre">Autre (à préciser)</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="font-semibold text-gray-700">
                  Précisions pour Byound <span className="font-normal text-gray-400">(optionnel)</span>
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
  const searchParams = useSearchParams();
  const skillParam = (searchParams.get("skill") ?? "").trim();
  const metierParam = (searchParams.get("metier") ?? "").trim();
  const formatParam = (searchParams.get("format") ?? "").trim();
  const fromSignup = searchParams.get("from") === "signup";
  const { loading: overviewLoading, data: overview } = useEntrepriseOverview();

  const [category, setCategory] = useState<string>("Tous");
  const [selected, setSelected] = useState<BusinessTrainingItem | null>(null);
  const [form, setForm] = useState<RequestFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [opcoName, setOpcoName] = useState<string | null>(null);
  const [intentBanner, setIntentBanner] = useState<string | null>(null);

  const employees = useMemo(
    () => filterRealEntrepriseEmployees(overview?.employees ?? []),
    [overview?.employees],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/entreprise/account");
        if (!res.ok) return;
        const json = (await res.json()) as { opco_name?: string | null };
        if (!cancelled) setOpcoName(String(json.opco_name ?? "").trim() || null);
      } catch {
        /* optionnel */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!skillParam && !formatParam) return;
    const needle = skillParam.toLowerCase();
    if (skillParam) {
      const softCat = BUSINESS_TRAINING_CATEGORIES.find((c) => c === "Soft Skills");
      if (softCat) setCategory(softCat);
      const match = BUSINESS_TRAINING_ITEMS.find(
        (item) =>
          item.title.toLowerCase().includes(needle) ||
          item.subtitle.toLowerCase().includes(needle) ||
          item.category.toLowerCase().includes(needle),
      );
      if (match) setSelected(match);
    }
    setForm((prev) => ({
      ...prev,
      preferred_format:
        formatParam && (FORMAT_OPTIONS as readonly string[]).includes(formatParam)
          ? formatParam
          : prev.preferred_format,
      notes:
        prev.notes ||
        (skillParam
          ? `Besoin Skills Gap : renforcer « ${skillParam} »${metierParam ? ` pour le métier « ${metierParam} »` : ""}.`
          : prev.notes),
    }));
  }, [skillParam, metierParam, formatParam]);

  useEffect(() => {
    const prenom = String(overview?.viewer?.prenom ?? "").trim();
    const nom = String(overview?.viewer?.nom ?? "").trim();
    const name = [prenom, nom].filter(Boolean).join(" ");
    const email = String(overview?.viewer?.email ?? "").trim();
    if (!name && !email) return;
    setForm((prev) => ({
      ...prev,
      contact_name: prev.contact_name || name,
      contact_email: prev.contact_email || email,
    }));
  }, [overview?.viewer?.prenom, overview?.viewer?.nom, overview?.viewer?.email]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { readFormationIntent, clearFormationIntent } = await import(
          "@/lib/entreprise/formation-intent"
        );
        const intent = readFormationIntent();
        if (!intent?.courseId || cancelled) return;

        const matched = matchTrainingFromIntent(intent.courseId, intent.courseTitle);
        const noteBits = [
          intent.courseTitle && !matched ? `Formation demandée (site) : ${intent.courseTitle}` : "",
          intent.notes ?? "",
        ].filter(Boolean);

        setForm((prev) => ({
          ...prev,
          contact_name: prev.contact_name || intent.contactName || "",
          contact_email: prev.contact_email || intent.contactEmail || "",
          contact_phone: prev.contact_phone || intent.contactPhone || "",
          participants: prev.participants || intent.participants || "",
          preferred_period: prev.preferred_period || intent.preferredPeriod || "",
          preferred_location: prev.preferred_location || intent.preferredLocation || prev.preferred_location,
          funding_type: intent.fundingType === "opco" ? "opco" : prev.funding_type,
          notes: prev.notes || noteBits.join("\n"),
        }));

        if (matched) {
          setCategory(matched.category);
          setSelected(matched);
          setIntentBanner(null);
        } else if (intent.courseTitle) {
          setIntentBanner(
            `Reprise de votre demande « ${intent.courseTitle} » — choisissez la formation la plus proche dans le catalogue.`,
          );
        }

        if (fromSignup || matched) clearFormationIntent();
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fromSignup]);

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
    setForm((prev) => ({ ...prev, participant_ids: [], participants: prev.participants }));
  };

  const toggleParticipant = (employeeId: string) => {
    setForm((prev) => {
      const has = prev.participant_ids.includes(employeeId);
      return {
        ...prev,
        participant_ids: has
          ? prev.participant_ids.filter((id) => id !== employeeId)
          : [...prev.participant_ids, employeeId],
      };
    });
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
            Formations Byound
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-950">
            Demander une formation
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            Catalogue business Byound ({BUSINESS_TRAINING_ITEMS.length} formations) — filtrer par
            thématique puis envoyer une demande : l’équipe Byound reçoit votre besoin par email.
            Collaborateurs optionnels.
          </p>
          {intentBanner ? (
            <p className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
              {intentBanner}
            </p>
          ) : null}
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
          employees={employees}
          employeesLoading={overviewLoading && !overview}
          opcoName={opcoName}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          onToggleParticipant={toggleParticipant}
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
