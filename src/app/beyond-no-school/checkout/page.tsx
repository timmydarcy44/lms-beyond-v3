"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  competencies,
  type CompetenceData,
} from "@/components/beyond-no-school/competences-data";
import { getTrajectory } from "@/lib/bns/trajectory";
import { useSupabase } from "@/components/providers/supabase-provider";

type BillingMode = "mock" | "stripe";
type SubscriptionStatus = {
  isActive: boolean;
  status: "active" | "inactive" | "canceled" | null;
  plan: string | null;
  currentPeriodEnd: string | null;
};

export default function BeyondNoSchoolCheckoutPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [isChecking, setIsChecking] = useState(true);
  const [draftItems, setDraftItems] = useState<
    { slug: string; name: string; proof: string }[]
  >([]);
  const [billingMode, setBillingMode] = useState<BillingMode>("mock");
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const activationHref =
    "/beyond-no-school/activation?next=/beyond-no-school/checkout";

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (isMounted) {
          setIsChecking(false);
        }
        return;
      }

      timeoutId = setTimeout(async () => {
        const { data: delayedData } = await supabase.auth.getSession();
        if (!delayedData.session) {
          router.replace(activationHref);
          return;
        }
        if (isMounted) {
          setIsChecking(false);
        }
      }, 600);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && isMounted) {
        setIsChecking(false);
      }
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      authListener.subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    if (isChecking) return;
    let isMounted = true;

    const loadBillingData = async () => {
      try {
        const modeResponse = await fetch("/api/bns/billing/mode");
        const modeJson = await modeResponse.json();
        if (isMounted && modeJson?.mode) {
          setBillingMode(modeJson.mode);
        }
      } catch {
        /* ignore */
      }

      try {
        const statusResponse = await fetch("/api/bns/billing/status");
        if (statusResponse.status === 401) {
          router.replace(activationHref);
          return;
        }
        const statusJson = await statusResponse.json();
        if (statusJson?.ok === false) {
          if (isMounted) {
            setBillingError(
              "Erreur billing. As-tu appliqué la migration bns_subscriptions ?",
            );
            setSubscriptionStatus(null);
          }
          return;
        }
        if (isMounted) {
          setBillingError(null);
          setSubscriptionStatus(statusJson.status ?? null);
        }
      } catch {
        if (isMounted) {
          setBillingError("Erreur billing. Réessaie ou vérifie la migration.");
          setSubscriptionStatus(null);
        }
      }
    };

    loadBillingData();

    return () => {
      isMounted = false;
    };
  }, [activationHref, isChecking, router]);

  const handleMockConfirm = async () => {
    setIsConfirming(true);
    setConfirmError(null);
    try {
      const response = await fetch("/api/bns/billing/mock/confirm", {
        method: "POST",
      });
      const responseJson = await response.json();
      if (!response.ok) {
        setConfirmError(
          responseJson.error || "Impossible de simuler le paiement.",
        );
        setIsConfirming(false);
        return;
      }
      if (responseJson?.ok === false) {
        setConfirmError(
          responseJson.error ||
            "Erreur billing. As-tu appliqué la migration bns_subscriptions ?",
        );
        setIsConfirming(false);
        return;
      }
      const statusResponse = await fetch("/api/bns/billing/status");
      const statusJson = await statusResponse.json();
      if (statusJson?.ok === false) {
        setConfirmError(
          statusJson.error ||
            "Erreur billing. As-tu appliqué la migration bns_subscriptions ?",
        );
        setSubscriptionStatus(null);
      } else {
        setSubscriptionStatus(statusJson.status ?? null);
      }
      router.push("/beyond-no-school/reprendre");
      router.refresh();
    } catch (error) {
      setConfirmError(
        error instanceof Error ? error.message : "Erreur lors de la simulation.",
      );
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    const trajectory = getTrajectory();
    if (!trajectory.items.length) {
      setDraftItems([]);
      return;
    }
    const items = trajectory.items
      .map((slug) => competencies.find((competence) => competence.slug === slug))
      .filter((competence): competence is CompetenceData => Boolean(competence))
      .map((competence) => ({
        slug: competence.slug,
        name: competence.name,
        proof: competence.proof.type,
      }));
    setDraftItems(items);
  }, []);

  if (isChecking) {
    return (
      <main className="relative min-h-screen bg-[#0b0b10] px-6 py-24 text-white sm:px-12 lg:px-24">
        <div className="mx-auto max-w-3xl text-sm text-white/60">
          Vérification de la session...
        </div>
      </main>
    );
  }

  const hasActiveSubscription = subscriptionStatus?.isActive ?? false;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] px-6 pb-32 pt-24 text-white sm:px-12 lg:px-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,88,61,0.18),transparent_55%)]" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl space-y-8"
      >
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Beyond No School</p>
        <h1 className="text-pretty text-4xl font-semibold sm:text-5xl">
          Finaliser l’engagement
        </h1>
        <p className="text-lg text-white/70">
          Paiement immédiat pour accéder aux formations.
        </p>
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Paiement — 30 € / mois
          </p>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold text-white">30 €</span>
            <span className="text-sm text-white/60">/ mois</span>
          </div>
          <p className="mt-3 text-sm text-white/60">
            Accès aux formations en ligne. Open Badges après validation.
          </p>
          <p className="mt-4 text-sm text-white/70">
            Paiement aujourd’hui pour accéder aux formations.
          </p>
          <p className="mt-2 text-sm text-white/60">
            Les Open Badges sont obtenus après validation de tes preuves.
          </p>
          <p className="mt-2 text-sm text-white/60">
            Formations neuro-adaptées, contenus multi-formats : schémas, cartes mentales,
            vidéos, textes synthétiques.
          </p>
          <div className="mt-6 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Récap de tes preuves
            </p>
            {draftItems.length ? (
              <div className="grid gap-3">
                {draftItems.map((item) => (
                  <div
                    key={item.slug}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      Badge
                    </p>
                    <p className="mt-2 text-sm text-white/80">{item.name}</p>
                    <p className="mt-2 text-xs text-white/60">{item.proof}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-4 text-sm text-white/60">
                Aucune preuve sélectionnée pour l’instant.
              </div>
            )}
          </div>
          <div className="mt-6">
            {hasActiveSubscription ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                <p>Accès activé ✅</p>
                <div className="mt-3">
                  <Button
                    type="button"
                    className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                    onClick={() => router.push("/beyond-no-school/reprendre")}
                  >
                    Accéder à Reprendre
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {billingMode === "mock" ? (
                  <Button
                    type="button"
                    onClick={handleMockConfirm}
                    className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                    disabled={isConfirming}
                  >
                    {isConfirming ? "Simulation en cours..." : "Simuler le paiement (DEV)"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
                  >
                    Payer et accéder aux formations
                  </Button>
                )}
                {confirmError ? (
                  <p className="text-sm text-red-300">{confirmError}</p>
                ) : null}
                {billingError ? (
                  <p className="text-sm text-red-300">{billingError}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </motion.div>
      {!hasActiveSubscription ? (
        <div className="fixed bottom-4 left-0 right-0 z-[90] px-4">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4 rounded-full border border-white/15 bg-black/80 px-5 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="text-xs uppercase tracking-[0.32em] text-white/70">
              Paiement — 30 € / mois
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              {billingMode === "mock" ? (
                <Button
                  type="button"
                  onClick={handleMockConfirm}
                  className="w-full rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90 sm:w-auto"
                  disabled={isConfirming}
                >
                  {isConfirming ? "Simulation en cours..." : "Simuler le paiement (DEV)"}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90 sm:w-auto"
                >
                  Payer et accéder aux formations
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

