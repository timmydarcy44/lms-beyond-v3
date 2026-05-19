"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  computeAddonsTotal,
  EDGE_COHORTE_LABEL,
  emptyPostulerForm,
  getSelectedAddons,
  POSTULER_CONFIRMATION_STORAGE_KEY,
  POSTULER_OBJECTIFS,
  POSTULER_SOURCES,
  POSTULER_SITUATIONS,
  validatePostulerStep1,
  validatePostulerStep2,
  type PostulerFormData,
} from "@/lib/edge-site/postuler";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";
import type { ParcoursAddon } from "@/lib/parcours";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-xl border-0 bg-[#f5f5f7] px-4 py-3.5 text-[15px] text-edge-black outline-none transition-all placeholder:text-black/30 focus:bg-white focus:ring-2 focus:ring-edge-red/20";
const labelClass = "mb-2 block text-[13px] text-black/50";

type Props = {
  parcoursSlug: string;
  parcoursTitre: string;
  parcoursPrix: number;
  addons: ParcoursAddon[];
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = total === 3 ? ["Toi", "Ton projet", "Options"] : ["Toi", "Ton projet"];
  return (
    <div className="mb-10 flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div key={step} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-medium transition-colors",
                done && "bg-edge-black text-white",
                active && "bg-edge-red text-white",
                !done && !active && "bg-[#f5f5f7] text-black/35",
              )}
            >
              {done ? "✓" : step}
            </div>
            <span
              className={cn(
                "hidden text-[12px] sm:inline",
                active ? "text-edge-black" : "text-black/35",
              )}
            >
              {labels[i]}
            </span>
            {step < total ? <div className="mx-1 h-px flex-1 bg-black/[0.06]" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function SidebarCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-black/[0.04] bg-white p-6", className)}>{children}</div>
  );
}

function ReassuranceSidebar() {
  return (
    <>
      <SidebarCard>
        <p className="text-[15px] font-medium text-edge-black">Tu es entre de bonnes mains</p>
        <ul className="mt-4 space-y-3.5 text-[14px] leading-relaxed text-black/55">
          {[
            "Aucun prépaiement aujourd'hui",
            "Sans engagement — tu décides après l'échange",
            "Réponse personnalisée sous 48h",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-0.5 text-edge-red" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </SidebarCard>
      <SidebarCard className="mt-4">
        <p className="text-[14px] font-medium text-edge-black">Comment ça se passe</p>
        <ol className="mt-4 space-y-3 text-[14px] leading-relaxed text-black/50">
          <li>3 minutes pour nous parler de toi</li>
          <li>Un appel de 20 min pour vérifier que le parcours te correspond</li>
          <li>Tu confirmes — on réserve ta place en cohorte</li>
        </ol>
      </SidebarCard>
    </>
  );
}

function RecapSidebar({
  formData,
  parcoursTitre,
  parcoursPrix,
  addons,
  currentStep,
  totalSteps,
  onEditStep1,
  onEditStep2,
  onEditStep3,
}: {
  formData: PostulerFormData;
  parcoursTitre: string;
  parcoursPrix: number;
  addons: ParcoursAddon[];
  currentStep: number;
  totalSteps: number;
  onEditStep1: () => void;
  onEditStep2: () => void;
  onEditStep3: () => void;
}) {
  const contactLabel = [formData.prenom, formData.nom].filter(Boolean).join(" ") || "—";
  const selected = getSelectedAddons(addons, formData.selectedAddonIds);
  const addonsTotal = computeAddonsTotal(addons, formData.selectedAddonIds);

  return (
    <>
      <SidebarCard>
        <p className="text-[14px] font-medium text-edge-black">Récapitulatif</p>
        <ul className="mt-4 space-y-3.5 text-[13px]">
          <RecapRow done={currentStep > 1} active={currentStep === 1} label="Contact" value={contactLabel} onEdit={onEditStep1} />
          <RecapRow
            done={currentStep > 2}
            active={currentStep === 2}
            label="Parcours"
            value={parcoursTitre}
            onEdit={onEditStep1}
          />
          <RecapRow done={currentStep > 2} active={false} label="Cohorte" value={EDGE_COHORTE_LABEL} onEdit={onEditStep1} />
          <RecapRow
            done={currentStep > 2}
            active={currentStep === 2}
            label="Motivations"
            value={formData.objectif ? "Renseigné" : "—"}
            onEdit={onEditStep2}
          />
          {totalSteps === 3 ? (
            <RecapRow
              done={false}
              active={currentStep === 3}
              label="Options"
              value={
                selected.length > 0
                  ? `${selected.length} module${selected.length > 1 ? "s" : ""} · +${addonsTotal}€`
                  : "Aucune pour l'instant"
              }
              onEdit={onEditStep3}
            />
          ) : null}
        </ul>
        <div className="mt-5 border-t border-black/[0.06] pt-4">
          <p className="text-[12px] text-black/40">Estimation indicative</p>
          <p className="mt-1 text-[18px] font-medium tracking-tight text-edge-black">
            {parcoursPrix + addonsTotal}€
            <span className="ml-1 text-[13px] font-normal text-black/40">TTC</span>
          </p>
        </div>
      </SidebarCard>
      <SidebarCard className="mt-4">
        <p className="text-[15px] font-medium text-edge-black">Pas encore sûr à 100% ?</p>
        <p className="mt-2 text-[14px] leading-relaxed text-black/50">
          Cette postulation ne t&apos;engage à rien. On en parle ensemble au téléphone — sans pression, sans paiement
          aujourd&apos;hui.
        </p>
      </SidebarCard>
    </>
  );
}

function RecapRow({
  done,
  active,
  label,
  value,
  onEdit,
}: {
  done: boolean;
  active: boolean;
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 text-edge-black">
      <span className="flex min-w-0 gap-2">
        {done ? (
          <span className="text-edge-red">✓</span>
        ) : active ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-edge-red text-[10px] font-medium text-white">
            ·
          </span>
        ) : (
          <span className="h-5 w-5 shrink-0 rounded-full border border-black/10" />
        )}
        <span className="min-w-0">
          <span className="text-black/45">{label}</span>
          <span className="block truncate text-black/70">{value}</span>
        </span>
      </span>
      {(done || active) && (
        <button type="button" onClick={onEdit} className="text-[12px] text-black/35 hover:text-edge-black">
          modifier
        </button>
      )}
    </li>
  );
}

function FormErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="mb-6 rounded-2xl bg-edge-red/[0.06] px-5 py-4 text-[14px] text-edge-red">
      {message}
    </div>
  );
}

export function PostulerApplicationForm({ parcoursSlug, parcoursTitre, parcoursPrix, addons }: Props) {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const totalSteps = addons.length > 0 ? 3 : 2;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PostulerFormData>(() => emptyPostulerForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addonsTotal = useMemo(
    () => computeAddonsTotal(addons, formData.selectedAddonIds),
    [addons, formData.selectedAddonIds],
  );
  const grandTotal = parcoursPrix + addonsTotal;

  const showError = useCallback((message: string) => {
    setError(message);
    requestAnimationFrame(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, []);

  const update = <K extends keyof PostulerFormData>(key: K, value: PostulerFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const toggleAddon = (id: string) => {
    setFormData((prev) => {
      const has = prev.selectedAddonIds.includes(id);
      return {
        ...prev,
        selectedAddonIds: has
          ? prev.selectedAddonIds.filter((x) => x !== id)
          : [...prev.selectedAddonIds, id],
      };
    });
    setError(null);
  };

  const goStep2 = useCallback(() => {
    const err = validatePostulerStep1(formData);
    if (err) {
      showError(err);
      return;
    }
    setError(null);
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [formData, showError]);

  const submitApplication = useCallback(async () => {
    const validationError = validatePostulerStep2(formData);
    if (validationError) {
      showError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const selectedAddons = getSelectedAddons(addons, formData.selectedAddonIds);

    try {
      const response = await fetch("/api/postuler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parcours: parcoursTitre,
          parcoursSlug,
          parcoursTitre,
          cohorte: EDGE_COHORTE_LABEL,
          parcoursPrix,
          selectedAddons,
          addonsTotal,
          totalEstime: grandTotal,
        }),
      });

      let data: { success?: boolean; error?: string } = {};
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text) as { success?: boolean; error?: string };
        } catch {
          throw new Error("Réponse serveur invalide. Réessaie dans un instant.");
        }
      }

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      try {
        sessionStorage.setItem(
          POSTULER_CONFIRMATION_STORAGE_KEY,
          JSON.stringify({ email: formData.email.trim(), parcoursTitre, prenom: formData.prenom.trim() }),
        );
      } catch {
        /* ignore */
      }

      router.push(EDGE_HREFS.postulerConfirmation(parcoursSlug));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Une erreur est survenue");
      console.error("Erreur soumission:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [addons, formData, grandTotal, parcoursPrix, parcoursSlug, parcoursTitre, router, showError]);

  const goStep3OrSubmit = useCallback(() => {
    const err = validatePostulerStep2(formData);
    if (err) {
      showError(err);
      return;
    }
    setError(null);
    if (addons.length > 0) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      void submitApplication();
    }
  }, [addons.length, formData, showError, submitApplication]);

  const primaryCtaClass =
    "rounded-full bg-edge-red px-8 py-3.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div ref={errorRef}>{error ? <FormErrorBanner message={error} /> : null}</div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="rounded-3xl border border-black/[0.04] bg-white px-6 py-8 sm:px-10 sm:py-10">
          <StepIndicator current={currentStep} total={totalSteps} />

          {currentStep === 1 ? (
            <div>
              <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-tight text-edge-black">
                Enchanté — on fait connaissance ?
              </h1>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-black/45">
                Quelques infos pour te rappeler dans les 48h. Moins de 3 minutes, promis — et toujours sans engagement.
              </p>

              <div className="mt-10 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="prenom">
                      Prénom
                    </label>
                    <input
                      id="prenom"
                      type="text"
                      className={fieldClass}
                      placeholder="Marie"
                      value={formData.prenom}
                      onChange={(e) => update("prenom", e.target.value)}
                      autoComplete="given-name"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="nom">
                      Nom
                    </label>
                    <input
                      id="nom"
                      type="text"
                      className={fieldClass}
                      placeholder="Dupont"
                      value={formData.nom}
                      onChange={(e) => update("nom", e.target.value)}
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={fieldClass}
                    placeholder="marie@exemple.fr"
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="telephone">
                    Téléphone
                  </label>
                  <input
                    id="telephone"
                    type="tel"
                    className={fieldClass}
                    placeholder="06 12 34 56 78"
                    value={formData.telephone}
                    onChange={(e) => update("telephone", e.target.value)}
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="situation">
                    Ta situation aujourd&apos;hui
                  </label>
                  <select
                    id="situation"
                    className={fieldClass}
                    value={formData.situation}
                    onChange={(e) => update("situation", e.target.value)}
                  >
                    <option value="">Choisir…</option>
                    {POSTULER_SITUATIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass} htmlFor="source">
                    Comment as-tu entendu parler d&apos;EDGE ?
                  </label>
                  <select
                    id="source"
                    className={fieldClass}
                    value={formData.source}
                    onChange={(e) => update("source", e.target.value)}
                  >
                    <option value="">Choisir…</option>
                    {POSTULER_SOURCES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f5f5f7] p-4">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded accent-edge-red"
                    checked={formData.acceptContact}
                    onChange={(e) => update("acceptContact", e.target.checked)}
                  />
                  <span className="text-[13px] leading-relaxed text-black/50">
                    J&apos;accepte d&apos;être recontacté par EDGE pour cet échange — rien d&apos;autre.
                  </span>
                </label>
              </div>

              <button type="button" onClick={goStep2} className={cn(primaryCtaClass, "mt-10")}>
                Continuer
              </button>
            </div>
          ) : currentStep === 2 ? (
            <div>
              <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-tight text-edge-black">
                Parle-nous de ton projet
              </h1>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-black/45">
                Ce que tu nous partages ici nous aide à préparer un échange utile — pas un pitch commercial.
              </p>

              <div className="mt-10 space-y-6">
                <div>
                  <label className={labelClass} htmlFor="objectif">
                    Ton objectif principal
                  </label>
                  <select
                    id="objectif"
                    className={fieldClass}
                    value={formData.objectif}
                    onChange={(e) => update("objectif", e.target.value)}
                  >
                    <option value="">Choisir…</option>
                    {POSTULER_OBJECTIFS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <fieldset>
                  <legend className={labelClass}>Un accompagnement financement ?</legend>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {(["oui", "non"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => update("financement", v)}
                        className={cn(
                          "rounded-full px-5 py-2.5 text-[14px] transition-colors",
                          formData.financement === v
                            ? "bg-edge-black text-white"
                            : "bg-[#f5f5f7] text-black/55 hover:bg-[#ebebed]",
                        )}
                      >
                        {v === "oui" ? "Oui, j'en aurais besoin" : "Non, pas pour l'instant"}
                      </button>
                    ))}
                  </div>
                  {formData.financement === "oui" ? (
                    <p className="mt-3 text-[13px] text-black/40">On t&apos;accompagne dans les démarches OPCO si besoin.</p>
                  ) : null}
                </fieldset>

                <div>
                  <label className={labelClass} htmlFor="motivation">
                    En quelques mots — pourquoi maintenant ?
                  </label>
                  <textarea
                    id="motivation"
                    className={cn(fieldClass, "min-h-[128px] resize-y")}
                    placeholder="Ce que tu veux changer, ce qui t'a fait franchir le pas…"
                    value={formData.motivation}
                    onChange={(e) => update("motivation", e.target.value)}
                  />
                </div>
              </div>

              <button type="button" onClick={goStep3OrSubmit} className={cn(primaryCtaClass, "mt-10 w-full sm:w-auto")}>
                {addons.length > 0 ? "Continuer" : `${EDGE_CTA_LABELS.apply} →`}
              </button>
            </div>
          ) : (
            <div>
              <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-tight text-edge-black">
                Modules complémentaires
              </h1>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-black/45">
                Optionnel — sélectionne ce qui t&apos;intéresse pour qu&apos;on en parle lors de l&apos;appel. Tu pourras
                ajuster ensuite.
              </p>

              <div className="mt-8 space-y-3">
                {addons.map((addon) => {
                  const selected = formData.selectedAddonIds.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon.id)}
                      className={cn(
                        "flex w-full items-start justify-between gap-4 rounded-2xl border-2 p-5 text-left transition-all",
                        selected
                          ? "border-edge-red bg-edge-red/[0.03]"
                          : "border-transparent bg-[#f5f5f7] hover:bg-[#efefef]",
                      )}
                    >
                      <div>
                        <p className="text-[15px] font-medium text-edge-black">{addon.titre}</p>
                        <p className="mt-1 text-[13px] text-black/40">{addon.thematique}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[15px] font-medium text-edge-red">+{addon.prix}€</p>
                        <p className="mt-1 text-[11px] text-black/35">{selected ? "Ajouté" : "Ajouter"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 rounded-2xl bg-[#f5f5f7] px-5 py-4">
                <div className="flex justify-between text-[13px] text-black/45">
                  <span>Parcours {parcoursTitre}</span>
                  <span>{parcoursPrix}€</span>
                </div>
                {addonsTotal > 0 ? (
                  <div className="mt-2 flex justify-between text-[13px] text-black/45">
                    <span>Modules sélectionnés</span>
                    <span>+{addonsTotal}€</span>
                  </div>
                ) : null}
                <div className="mt-3 flex justify-between border-t border-black/[0.06] pt-3 text-[15px] font-medium text-edge-black">
                  <span>Total indicatif</span>
                  <span>{grandTotal}€</span>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void submitApplication()}
                  className={cn(primaryCtaClass, "w-full sm:flex-1")}
                >
                  {isSubmitting ? "Envoi en cours…" : `${EDGE_CTA_LABELS.apply} →`}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void submitApplication()}
                  className="rounded-full px-6 py-3.5 text-[14px] text-black/45 transition-colors hover:text-edge-black"
                >
                  Passer cette étape
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="lg:pt-4">
          {currentStep === 1 ? (
            <ReassuranceSidebar />
          ) : (
            <RecapSidebar
              formData={formData}
              parcoursTitre={parcoursTitre}
              parcoursPrix={parcoursPrix}
              addons={addons}
              currentStep={currentStep}
              totalSteps={totalSteps}
              onEditStep1={() => setCurrentStep(1)}
              onEditStep2={() => setCurrentStep(2)}
              onEditStep3={() => setCurrentStep(3)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
