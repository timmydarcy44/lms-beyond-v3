"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { EnterpriseTestKind } from "@/lib/entreprise/enterprise-share-consent";

const TEST_LABELS: Record<EnterpriseTestKind, string> = {
  disc: "test DISC",
  idmc: "test IDMC",
  soft_skills: "test soft skills",
};

function PartageEntrepriseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const test = (searchParams.get("test") ?? "disc") as EnterpriseTestKind;
  const nextPath = searchParams.get("next") || "/dashboard/apprenant/profil";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasOrganisation, setHasOrganisation] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/apprenant/org-context");
        const org = (await res.json()) as { has_organisation?: boolean };
        if (!org.has_organisation) {
          router.replace(nextPath);
          return;
        }
        setHasOrganisation(true);
      } catch {
        router.replace(nextPath);
      } finally {
        setLoading(false);
      }
    })();
  }, [nextPath, router]);

  const submit = async (consent: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/apprenant/entreprise-share-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent, test }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      toast.success(
        consent
          ? "Vos résultats seront partagés avec votre entreprise."
          : "Vos résultats restent privés vis-à-vis de votre entreprise.",
      );
      router.replace(nextPath);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!hasOrganisation) return null;

  const testLabel = TEST_LABELS[test] ?? "résultats";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-2xl">
        <div className="border-b border-black/[0.06] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">
                Confidentialité · RGPD
              </p>
              <h1 className="text-lg font-bold text-gray-950">
                Souhaitez-vous partager vos résultats avec votre entreprise ?
              </h1>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5 text-sm leading-relaxed text-gray-600">
          <p>
            Vous venez de terminer votre {testLabel}. Votre employeur (RH / manager) ne peut accéder à
            vos résultats <strong>qu&apos;avec votre accord explicite</strong>.
          </p>
          <p>
            Le partage est important pour pouvoir proposer les meilleures formations, les meilleurs
            coaching et le meilleur plan de développement de vos compétences.
          </p>
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Vous pourrez retirer ce consentement à tout moment depuis votre espace apprenant. Sans
            accord, vos résultats restent visibles uniquement par vous.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/[0.06] px-6 py-5 sm:flex-row-reverse">
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit(true)}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Oui, partager avec mon entreprise"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit(false)}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            Non, garder mes résultats privés
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PartageEntreprisePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        </div>
      }
    >
      <PartageEntrepriseForm />
    </Suspense>
  );
}
