"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import {
  buildFormationSignupUrl,
  saveFormationIntent,
} from "@/lib/entreprise/formation-intent";
import { cn } from "@/lib/utils";

type Props = {
  courseId: string;
  courseTitle: string;
  intraPriceLabel?: string | null;
  className?: string;
  triggerLabel?: string;
  triggerVariant?: "white" | "outline-white" | "secondary-light";
  triggerShape?: "revolut" | "pill";
  fullWidth?: boolean;
};

export function PublicFormationRequestModal({
  courseId,
  courseTitle,
  intraPriceLabel,
  className,
  triggerLabel = "Demander un devis",
  triggerVariant = "outline-white",
  triggerShape = "revolut",
  fullWidth,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-[#050505]/12 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-edge-accent/50";

  return (
    <>
      <EdgePremiumButton
        type="button"
        variant={triggerVariant}
        shape={triggerShape}
        className={cn(fullWidth ? "w-full" : undefined, className)}
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
      >
        {triggerLabel}
      </EdgePremiumButton>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="formation-request-title"
            className="max-h-[92vh] w-full max-w-lg overflow-auto rounded-t-[28px] bg-white p-6 text-[#050505] shadow-2xl sm:rounded-[28px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#050505]/45">
                  Compte entreprise
                </p>
                <h2 id="formation-request-title" className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                  {courseTitle}
                </h2>
                {intraPriceLabel ? (
                  <p className="mt-1 text-sm text-[#050505]/55">À partir de {intraPriceLabel} HT (intra)</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-[#050505]/45 hover:bg-[#050505]/05"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="mt-6 space-y-3.5"
              onSubmit={(e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                const form = e.currentTarget;
                const data = new FormData(form);
                const companyName = String(data.get("company_name") || "").trim();
                const contactName = String(data.get("contact_name") || "").trim();
                const contactEmail = String(data.get("contact_email") || "")
                  .trim()
                  .toLowerCase();
                if (!companyName || !contactName || !contactEmail.includes("@")) {
                  setError("Entreprise, contact et e-mail professionnel sont requis.");
                  setLoading(false);
                  return;
                }

                saveFormationIntent({
                  courseId,
                  courseTitle,
                  companyName,
                  contactName,
                  contactEmail,
                  contactPhone: String(data.get("contact_phone") || "").trim() || undefined,
                  participants: String(data.get("participants") || "1").trim(),
                  preferredPeriod: String(data.get("preferred_period") || "").trim() || undefined,
                  preferredLocation: String(data.get("preferred_location") || "").trim() || undefined,
                  fundingType:
                    String(data.get("funding_type") || "direct") === "opco" ? "opco" : "direct",
                  notes: String(data.get("notes") || "").trim() || undefined,
                });

                const url = buildFormationSignupUrl({
                  courseId,
                  courseTitle,
                  companyName,
                  contactName,
                  contactEmail,
                });
                router.push(url);
              }}
            >
              <p className="text-sm text-[#050505]/55">
                Créez un compte entreprise gratuit pour recevoir un devis conforme (SIRET,
                adresse). Aucun abonnement SaaS requis. Ajouter vos collaborateurs reste
                optionnel.
              </p>
              <label className="block text-sm">
                <span className="font-medium">Entreprise</span>
                <input required name="company_name" className={fieldClass} disabled={loading} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Contact</span>
                  <input required name="contact_name" className={fieldClass} disabled={loading} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">E-mail pro</span>
                  <input
                    required
                    type="email"
                    name="contact_email"
                    className={fieldClass}
                    disabled={loading}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Téléphone</span>
                  <input name="contact_phone" className={fieldClass} disabled={loading} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Nb de participants (indicatif)</span>
                  <input
                    name="participants"
                    defaultValue="8"
                    inputMode="numeric"
                    className={fieldClass}
                    disabled={loading}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Période souhaitée</span>
                  <input
                    name="preferred_period"
                    placeholder="ex. mars 2027"
                    className={fieldClass}
                    disabled={loading}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Lieu</span>
                  <select
                    name="preferred_location"
                    className={fieldClass}
                    defaultValue="Au sein de nos locaux"
                    disabled={loading}
                  >
                    <option>Au sein de nos locaux</option>
                    <option>Au sein de vos locaux (Byound)</option>
                    <option>Distanciel / visio</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium">Financement</span>
                <select
                  name="funding_type"
                  className={fieldClass}
                  defaultValue="direct"
                  disabled={loading}
                >
                  <option value="direct">Fonds propres</option>
                  <option value="opco">OPCO</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Précisions</span>
                <textarea
                  name="notes"
                  rows={3}
                  className={fieldClass}
                  disabled={loading}
                  placeholder="Contexte, contraintes, OPCO…"
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-edge-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Créer mon compte et continuer
              </button>
              <p className="text-center text-xs text-[#050505]/45">
                Déjà un compte ?{" "}
                <a href="/entreprises/connexion?mode=login" className="font-semibold text-edge-accent underline-offset-2 hover:underline">
                  Se connecter
                </a>
              </p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
