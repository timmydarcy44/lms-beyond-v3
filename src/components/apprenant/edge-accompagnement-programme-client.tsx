"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { APPRENANT_CARD_KICKER } from "@/lib/apprenant/connect-nav";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[13px] font-semibold text-[#0c0c10] transition duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50";

const CARD = "rounded-2xl border border-white/[0.06] bg-[#17171F]";

type Props = {
  defaultName: string;
  defaultEmail: string;
};

export function EdgeAccompagnementProgrammeClient({ defaultName, defaultEmail }: Props) {
  const [objectif, setObjectif] = useState("");
  const [besoin, setBesoin] = useState("");
  const [disponibilite, setDisponibilite] = useState("");
  const [message, setMessage] = useState("");
  const [userName, setUserName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/edge/accompagnement/programme-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectif, besoin, disponibilite, message, userName }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Impossible d'envoyer la demande.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400/80" />
        <h1 className="text-2xl font-semibold text-white">Demande envoyée</h1>
        <p className="text-sm leading-relaxed text-white/50">
          Un expert EDGE vous recontactera sous 48 h ouvrées pour construire votre programme personnalisé.
        </p>
        <Link href="/dashboard/apprenant/coaching" className={BTN_PRIMARY}>
          Retour à Mon accompagnement
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl space-y-8 pb-12 pt-2">
      <Link
        href="/dashboard/apprenant/coaching"
        className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white/70"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>

      <header className="space-y-3">
        <p className={APPRENANT_CARD_KICKER}>Programme sur mesure</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          Programme Progression EDGE
        </h1>
        <p className="text-sm leading-relaxed text-white/50">
          Décrivez votre objectif. Nous vous proposerons un accompagnement adapté — paiement après échange.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={cn(CARD, "space-y-5 p-6 md:p-8")}>
        <label className="block space-y-1.5">
          <span className="text-xs text-white/40">Nom complet</span>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-white/40">Email</span>
          <input
            value={defaultEmail}
            readOnly
            className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/50"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-white/40">Votre objectif professionnel</span>
          <textarea
            value={objectif}
            onChange={(e) => setObjectif(e.target.value)}
            required
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-white/40">Votre besoin principal</span>
          <textarea
            value={besoin}
            onChange={(e) => setBesoin(e.target.value)}
            required
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-white/40">Vos disponibilités</span>
          <input
            value={disponibilite}
            onChange={(e) => setDisponibilite(e.target.value)}
            required
            placeholder="Ex. mardis et jeudis après 18h"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-white/40">Message libre (optionnel)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-white/20"
          />
        </label>

        <button type="submit" disabled={loading} className={cn(BTN_PRIMARY, "w-full sm:w-auto")}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Demander un programme personnalisé
        </button>

        {error ? <p className="text-sm text-red-300/90">{error}</p> : null}
      </form>
    </div>
  );
}
