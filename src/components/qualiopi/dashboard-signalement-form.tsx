"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  SIGNALEMENT_CATEGORIES,
  SIGNALEMENT_CATEGORY_LABELS,
  type SignalementCategory,
} from "@/lib/qualiopi/signalements";
import { cn } from "@/lib/utils";

export type SignalementAudience = "entreprise" | "expert" | "apprenant" | "salarie";

type Props = {
  audience: SignalementAudience;
  className?: string;
  tone?: "light" | "dark";
};

export function DashboardSignalementForm({ audience, className, tone = "dark" }: Props) {
  const [category, setCategory] = useState<SignalementCategory | "">("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const light = tone === "light";
  const inputClass = light
    ? "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-400"
    : "w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]";

  const submit = async () => {
    if (!category) {
      toast.error("Choisissez une catégorie");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/signalements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          category,
          subject,
          description,
          is_anonymous: isAnonymous,
          requester_name: isAnonymous ? undefined : name.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      setSent(true);
      setSubject("");
      setDescription("");
      setCategory("");
      setName("");
      toast.success("Signalement enregistré — traité de façon confidentielle.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 sm:p-6",
        light ? "border-gray-100 bg-white shadow-sm" : "border-white/10 bg-white/[0.03]",
        className,
      )}
    >
      <h2 className={cn("text-xl font-bold sm:text-2xl", light ? "text-gray-900" : "text-white")}>
        Signalement sensible
      </h2>
      <p className={cn("mt-2 text-sm", light ? "text-gray-500" : "text-white/55")}>
        Violences, harcèlement ou discriminations liés à une formation. Registre séparé des
        réclamations qualité. Anonymat possible.
      </p>

      {sent ? (
        <div
          className={cn(
            "mt-6 rounded-xl border px-4 py-3 text-sm",
            light
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
          )}
        >
          Merci. Votre signalement est enregistré auprès du référent dédié.
          <Button
            type="button"
            variant="outline"
            className={cn("mt-3", light ? "" : "border-white/15 bg-transparent text-white")}
            onClick={() => setSent(false)}
          >
            Nouveau signalement
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <div>
            <label className={cn("mb-1 block text-xs font-medium", light ? "text-gray-600" : "text-white/60")}>
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SignalementCategory | "")}
              className={inputClass}
            >
              <option value="">Choisir…</option>
              {SIGNALEMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {SIGNALEMENT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={cn("mb-1 block text-xs font-medium", light ? "text-gray-600" : "text-white/60")}>
              Objet
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
              placeholder="Résumé court"
            />
          </div>
          <div>
            <label className={cn("mb-1 block text-xs font-medium", light ? "text-gray-600" : "text-white/60")}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className={inputClass}
              placeholder="Faits, contexte, dates si possible…"
            />
          </div>
          <label
            className={cn(
              "flex items-center gap-2 text-sm",
              light ? "text-gray-700" : "text-white/80",
            )}
          >
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            Déposer anonymement
          </label>
          {!isAnonymous ? (
            <div>
              <label className={cn("mb-1 block text-xs font-medium", light ? "text-gray-600" : "text-white/60")}>
                Votre nom (optionnel)
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Prénom Nom"
              />
            </div>
          ) : null}
          <Button
            type="button"
            disabled={sending}
            onClick={() => void submit()}
            className={light ? "bg-violet-600 text-white" : "bg-[#6E5BFF] text-white"}
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Envoyer le signalement
          </Button>
        </div>
      )}
    </div>
  );
}
