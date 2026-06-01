"use client";

import { useState } from "react";
import { CreditCard, Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePraticien } from "@/components/praticien/praticien-context";
import { Card, PageWrap } from "@/components/praticien/praticien-ui";
import { startStripeOnboarding } from "@/lib/marketplace/praticien-utils";
import { createClient } from "@/lib/supabase/client";

export function PraticienParametresPage() {
  const { praticien } = usePraticien();
  const router = useRouter();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [emailRdV, setEmailRdV] = useState(true);

  const configureStripe = async () => {
    setStripeLoading(true);
    try {
      await startStripeOnboarding();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setStripeLoading(false);
    }
  };

  const stripeDashboard = async () => {
    try {
      const res = await fetch("/api/marketplace/praticien/stripe-login", { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Lien indisponible");
      window.location.href = json.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <PageWrap title="Paramètres">
      <section className="space-y-4">
        <Card>
          <h2 className="font-semibold">Stripe Connect</h2>
          <p className="mt-2 text-sm text-slate-400">
            Statut :{" "}
            {praticien?.stripe_onboarding_complete ? (
              <span className="text-emerald-400">Compte actif</span>
            ) : (
              <span className="text-amber-300">Configuration requise</span>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={stripeLoading}
              className="bg-violet-600"
              onClick={() => void configureStripe()}
            >
              {stripeLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {praticien?.stripe_onboarding_complete ? "Reconfigurer Stripe" : "Configurer Stripe"}
            </Button>
            {praticien?.stripe_onboarding_complete && (
              <Button type="button" variant="outline" className="border-white/20" onClick={() => void stripeDashboard()}>
                Tableau de bord Stripe
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Notifications</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <Label htmlFor="email-rdv" className="text-sm text-slate-300">
              E-mail lors d&apos;un nouveau rendez-vous
            </Label>
            <Switch id="email-rdv" checked={emailRdV} onCheckedChange={setEmailRdV} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Préférence locale (synchronisation serveur à venir).</p>
        </Card>

        <Card>
          <h2 className="font-semibold">Compte</h2>
          <p className="mt-2 text-sm text-slate-400">
            Pour changer votre mot de passe, utilisez le lien « Mot de passe oublié » sur la page de connexion Beyond.
          </p>
          <Button type="button" variant="outline" className="mt-4 border-white/20" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </Card>
      </section>
    </PageWrap>
  );
}
