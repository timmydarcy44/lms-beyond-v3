"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Plan = "nevo" | "nevo-care";

export default function LandingSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [plan, setPlan] = useState<Plan>("nevo-care");

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email) {
        setError("Merci de compléter tous les champs requis.");
        return;
      }
      if (!hasSession) {
        setError("Merci de confirmer votre email avant de continuer.");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!hasSession) {
        setError("Merci de confirmer votre email avant de continuer.");
        return;
      }
      await supabase.auth.updateUser({
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
        },
      });
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          source: "app-landing",
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError("Impossible de lancer le paiement.");
    } catch {
      setError("Erreur lors du paiement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!hasSession) {
        setError("Merci de confirmer votre email avant de continuer.");
        return;
      }
      await supabase.auth.updateUser({
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
        },
      });
      router.push("/beyond-note-app?view=library");
    } catch {
      setError("Erreur lors de la création du compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam && !form.email) {
      setForm((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams, form.email]);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email) {
        setHasSession(true);
        setForm((prev) => ({ ...prev, email: data.session?.user?.email || prev.email }));
      } else {
        setHasSession(false);
      }
      setSessionChecked(true);
    };
    loadSession();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 py-12">
      <img
        src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
        alt="Nevo"
        className="h-10 mb-10"
      />
      <div className="w-full max-w-2xl rounded-3xl border border-[#E8E9F0] bg-white shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-[#0F1117]">Créer un compte</h1>
          <span className="text-xs text-[#9CA3AF]">Étape {step} / 3</span>
        </div>
        {sessionChecked && !hasSession && (
          <div className="mb-6 rounded-2xl border border-[#E8E9F0] bg-[#F8F9FC] p-4 text-sm text-[#6B7280]">
            Merci de confirmer votre email. Vérifiez votre boîte mail pour activer votre compte.
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateForm("firstName", e.target.value)}
                placeholder="Prénom"
                className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
                required
              />
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => updateForm("lastName", e.target.value)}
                placeholder="Nom"
                className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
                required
              />
            </div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              placeholder="Email"
              disabled={hasSession}
              className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
              required
            />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              placeholder="Téléphone"
              className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            />
          </div>
        )}

        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPlan("nevo")}
              className={`rounded-3xl border p-6 text-left transition-all ${
                plan === "nevo" ? "border-[#be1354] bg-[#fff5f7]" : "border-[#E8E9F0] bg-white"
              }`}
            >
              <p className="text-xs uppercase tracking-widest text-[#be1354]">Nevo.</p>
              <p className="text-2xl font-semibold mt-2">14,90€/mois</p>
              <p className="text-sm text-[#6B7280] mt-3">Transformations illimitées + Neo IA.</p>
            </button>
            <button
              type="button"
              onClick={() => setPlan("nevo-care")}
              className={`rounded-3xl border p-6 text-left transition-all ${
                plan === "nevo-care" ? "border-[#be1354] bg-[#fff5f7]" : "border-[#E8E9F0] bg-white"
              }`}
            >
              <p className="text-xs uppercase tracking-widest text-[#be1354]">Nevo. + Care</p>
              <p className="text-2xl font-semibold mt-2">19,90€/mois</p>
              <p className="text-sm text-[#6B7280] mt-3">Suivi bien-être et tableau émotionnel.</p>
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-[#6B7280]">
              Tu vas être redirigé vers Stripe pour finaliser ton abonnement.
            </p>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full rounded-full px-6 py-3 text-white font-semibold"
              style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
            >
              {isSubmitting ? "Redirection..." : "Continuer vers Stripe"}
            </button>
            <button
              type="button"
              onClick={handleCreateAccount}
              disabled={isSubmitting}
              className="w-full rounded-full border border-[#E8E9F0] px-6 py-3 text-sm font-semibold text-[#0F1117] hover:bg-[#F8F9FC]"
            >
              Je n'ai pas encore payé
            </button>
          </div>
        )}

        {error ? <p className="text-xs text-red-500 mt-4">{error}</p> : null}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
            className="text-sm text-[#6B7280] hover:text-[#0F1117]"
          >
            Retour
          </button>
          {step < 3 && (
            <button
              type="button"
              onClick={handleNext}
              className="text-sm font-semibold text-[#be1354]"
            >
              Continuer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
