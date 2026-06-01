"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { formatEurosFromCents } from "@/lib/marketplace/commission";
import { toast } from "sonner";

type Props = {
  praticienId: string;
  praticienName: string;
  creneauId: string;
  dateLabel: string;
  tarifCents: number;
  dureeMinutes: number;
};

export function BookingWizard({
  praticienId,
  praticienName,
  creneauId,
  dateLabel,
  tarifCents,
  dureeMinutes,
}: Props) {
  const [step, setStep] = useState(1);
  const [motif, setMotif] = useState("");
  const [consent, setConsent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const pay = async () => {
    if (!consent) {
      toast.error("Choisissez une option de partage de données");
      return;
    }
    if (!pk) {
      toast.error("Stripe non configuré (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          praticienId,
          creneauId,
          motif: motif || null,
          consentementDonnees: consent === "yes",
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        clientSecret?: string;
        sessionId?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Réservation impossible");

      const stripe = await loadStripe(pk);
      if (!stripe || !json.clientSecret) throw new Error("Stripe indisponible");

      const { error } = await stripe.confirmPayment({
        clientSecret: json.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/entreprise/marketplace/confirmation?session=${json.sessionId}`,
        },
      });
      if (error) throw new Error(error.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Paiement impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">
        Étape {step}/3 — {dateLabel} avec {praticienName}
      </p>

      {step === 1 && (
        <>
          <h2 className="text-lg font-semibold">Motif de consultation (optionnel)</h2>
          <Textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder='Ex. "Gestion du stress au travail"'
            rows={4}
          />
          <p className="text-xs text-slate-500">Ce motif est uniquement visible par le praticien.</p>
          <Button onClick={() => setStep(2)}>Continuer →</Button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-lg font-semibold">🔒 Partage de vos données Beyond</h2>
          <p className="text-sm text-slate-600">
            Souhaitez-vous autoriser {praticienName} à consulter votre profil cognitif Beyond (DISC, IDMC,
            stress, points de vigilance) ? Ces données ne sont jamais transmises à votre employeur.
          </p>
          <RadioGroup value={consent} onValueChange={setConsent} className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
              <RadioGroupItem value="yes" id="consent-yes" />
              <Label htmlFor="consent-yes" className="cursor-pointer font-normal">
                Oui, j&apos;autorise l&apos;accès à mon profil Beyond
              </Label>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
              <RadioGroupItem value="no" id="consent-no" />
              <Label htmlFor="consent-no" className="cursor-pointer font-normal">
                Non, je préfère garder mes données privées
              </Label>
            </div>
          </RadioGroup>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              ← Retour
            </Button>
            <Button onClick={() => setStep(3)} disabled={!consent}>
              Continuer →
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-lg font-semibold">Récapitulatif & paiement</h2>
          <ul className="text-sm text-slate-700">
            <li>Session avec {praticienName}</li>
            <li>{dateLabel}</li>
            <li>{dureeMinutes} minutes</li>
            <li className="font-semibold">Montant : {formatEurosFromCents(tarifCents)}</li>
          </ul>
          <p className="text-xs text-slate-500">
            🔒 Paiement sécurisé par Stripe. Annulation gratuite jusqu&apos;à 24h avant la session.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              ← Retour
            </Button>
            <Button onClick={() => void pay()} disabled={loading}>
              {loading ? "Redirection…" : `Payer ${formatEurosFromCents(tarifCents)} →`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
