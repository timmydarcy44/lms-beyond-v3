"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ReclamationAudience = "entreprise" | "expert" | "apprenant" | "salarie";

type Props = {
  audience: ReclamationAudience;
  className?: string;
  /** Light dashboards (entreprise) vs dark (apprenant/salarie/expert). */
  tone?: "light" | "dark";
};

const COPY: Record<ReclamationAudience, { title: string; lead: string }> = {
  entreprise: {
    title: "Signaler un problème",
    lead: "Réclamation liée à une formation, un parcours ou le service Byound. L’équipe qualité traite chaque demande.",
  },
  expert: {
    title: "Signaler un problème",
    lead: "Réclamation relative à une intervention, une formation ou l’espace expert. Traçabilité Qualiopi.",
  },
  apprenant: {
    title: "Signaler un problème",
    lead: "Un souci sur votre formation, un contenu ou l’accompagnement ? Déposez une réclamation — réponse sous 15 jours ouvrés.",
  },
  salarie: {
    title: "Signaler un problème",
    lead: "Problème sur une formation ou votre parcours salarié ? Votre signalement est enregistré dans le registre qualité.",
  },
};

export function DashboardReclamationForm({ audience, className, tone = "dark" }: Props) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const light = tone === "light";
  const inputClass = light
    ? "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-400"
    : "w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]";

  const submit = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/reclamations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          subject,
          description,
          requester_name: name.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      setSent(true);
      setSubject("");
      setDescription("");
      toast.success("Réclamation enregistrée — nous vous répondrons sous 15 jours ouvrés.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSending(false);
    }
  };

  const copy = COPY[audience];

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 sm:p-6",
        light ? "border-gray-100 bg-white shadow-sm" : "border-white/10 bg-white/[0.03]",
        className,
      )}
    >
      <h1 className={cn("text-xl font-bold sm:text-2xl", light ? "text-gray-900" : "text-white")}>
        {copy.title}
      </h1>
      <p className={cn("mt-2 text-sm", light ? "text-gray-500" : "text-white/55")}>{copy.lead}</p>

      {sent ? (
        <div className={cn("mt-6 rounded-xl border px-4 py-3 text-sm", light ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100")}>
          Merci. Votre réclamation est au registre qualité. Vous pouvez en déposer une autre si besoin.
          <Button
            type="button"
            variant="outline"
            className={cn("mt-3", light ? "" : "border-white/15 bg-transparent text-white")}
            onClick={() => setSent(false)}
          >
            Nouvelle réclamation
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom (optionnel)"
            className={inputClass}
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet *"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez le problème, la formation concernée, les dates… *"
            className={cn(inputClass, "min-h-32")}
          />
          <Button
            type="button"
            disabled={sending}
            onClick={() => void submit()}
            className={light ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-[#6E5BFF] text-white hover:bg-[#5a49e6]"}
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Envoyer la réclamation
          </Button>
          <p className={cn("text-xs", light ? "text-gray-400" : "text-white/40")}>
            Accusé sous 5 jours ouvrés · réponse sous 15 jours ouvrés (procédure Qualiopi).
          </p>
        </div>
      )}
    </div>
  );
}
