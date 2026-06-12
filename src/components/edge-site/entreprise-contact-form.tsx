"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { EdgeButton } from "@/components/edge-site/edge-button";

const BESOIN_OPTIONS = [
  { value: "diagnostic", label: "Diagnostic" },
  { value: "formation-collective", label: "Formation collective" },
  { value: "coaching-individuel", label: "Coaching individuel" },
  { value: "programme-complet", label: "Programme complet" },
] as const;

type Props = {
  variant?: "light" | "onRed";
};

export function EntrepriseContactForm({ variant = "light" }: Props) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onRed = variant === "onRed";

  if (sent) {
    return (
      <p className={cn("mt-8 text-[15px]", onRed ? "text-white/85" : "text-black/40")}>
        Merci — un conseiller EDGE vous recontacte sous 48h ouvrées.
      </p>
    );
  }

  const labelClass = cn(
    "text-[10px] uppercase tracking-[0.2em]",
    onRed ? "text-white/70" : "text-black/40",
  );

  const fieldClass = cn(
    "mt-2 w-full px-4 py-3 text-[14px] outline-none transition-colors",
    onRed
      ? "border border-white/25 bg-white/10 text-white placeholder:text-white/40 focus:border-white focus:bg-white/15"
      : "border border-black/15 bg-white text-edge-black focus:border-edge-red",
  );

  return (
    <form
      className="mt-10 space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const form = e.currentTarget;
        const data = new FormData(form);

        try {
          const res = await fetch("/api/edge-entreprise-lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nom: data.get("nom"),
              email: data.get("email"),
              entreprise: data.get("entreprise"),
              taille: data.get("taille"),
              besoin: data.get("besoin"),
              message: data.get("message"),
            }),
          });

          if (!res.ok) {
            const json = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(json.error ?? "Envoi impossible");
          }

          setSent(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Envoi impossible");
        } finally {
          setLoading(false);
        }
      }}
    >
      <label className="block">
        <span className={labelClass}>Nom</span>
        <input required name="nom" className={fieldClass} disabled={loading} />
      </label>
      <label className="block">
        <span className={labelClass}>Email professionnel</span>
        <input required type="email" name="email" className={fieldClass} disabled={loading} />
      </label>
      <label className="block">
        <span className={labelClass}>Entreprise</span>
        <input required name="entreprise" className={fieldClass} disabled={loading} />
      </label>
      <label className="block">
        <span className={labelClass}>Taille équipe</span>
        <select required name="taille" className={fieldClass} defaultValue="" disabled={loading}>
          <option value="" disabled className="text-edge-black">
            Sélectionner
          </option>
          <option value="1-10" className="text-edge-black">
            1–10
          </option>
          <option value="11-50" className="text-edge-black">
            11–50
          </option>
          <option value="51-200" className="text-edge-black">
            51–200
          </option>
          <option value="200+" className="text-edge-black">
            200+
          </option>
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>Besoin principal</span>
        <select required name="besoin" className={fieldClass} defaultValue="" disabled={loading}>
          <option value="" disabled className="text-edge-black">
            Sélectionner
          </option>
          {BESOIN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-edge-black">
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelClass}>Message</span>
        <textarea required name="message" rows={4} className={cn(fieldClass, "resize-y")} disabled={loading} />
      </label>
      {error ? <p className={cn("text-sm", onRed ? "text-white" : "text-edge-red")}>{error}</p> : null}
      <EdgeButton
        type="submit"
        variant={onRed ? "inverted" : "primary"}
        className={cn("w-full sm:w-auto", onRed && "!text-[#E63329] font-semibold")}
        ariaLabel="Envoyer la demande"
      >
        {loading ? "Envoi…" : "Envoyer la demande"}
      </EdgeButton>
    </form>
  );
}
