"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Upload } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { COMPANY_SIZE_BANDS } from "@/lib/entreprise/company-size-bands";
import { cn } from "@/lib/utils";

type Prefill = {
  company_name: string;
  siret: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  company_size_band: string;
  logo_url: string | null;
  address_line?: string;
  address_zip?: string;
  address_city?: string;
};

type SignupStatusResponse = {
  needs_profile_completion?: boolean;
  organization_id?: string;
  prefill?: Prefill;
};

const SIGNUP_CACHE_KEY = "entreprise_signup_status_v1";
const SIGNUP_CACHE_MS = 5 * 60 * 1000;

const fieldClass =
  "mt-1.5 w-full rounded-2xl border border-[#050505]/12 bg-[#F7F7F5] px-4 py-3 text-[15px] text-[#050505] outline-none transition placeholder:text-[#050505]/35 focus:border-[#050505]/35 focus:bg-white";

function readCachedSignupStatus(): SignupStatusResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SIGNUP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; status: SignupStatusResponse };
    if (Date.now() - parsed.at > SIGNUP_CACHE_MS) return null;
    return parsed.status;
  } catch {
    return null;
  }
}

function writeCachedSignupStatus(status: SignupStatusResponse) {
  try {
    sessionStorage.setItem(
      SIGNUP_CACHE_KEY,
      JSON.stringify({ at: Date.now(), status }),
    );
  } catch {
    /* ignore quota */
  }
}

export function EnterpriseSignupProfileOverlay({
  organizationId,
  prefill,
  onCompleted,
}: {
  organizationId: string;
  prefill: Prefill;
  onCompleted: (redirectTo: string) => void;
}) {
  const supabase = useSupabase();
  const [form, setForm] = useState({
    company_name: prefill.company_name,
    siret: prefill.siret ?? "",
    address_line: prefill.address_line ?? "",
    address_zip: prefill.address_zip ?? "",
    address_city: prefill.address_city ?? "",
    first_name: prefill.first_name,
    last_name: prefill.last_name,
    email: prefill.email,
    job_title: prefill.job_title,
    company_size_band: prefill.company_size_band || COMPANY_SIZE_BANDS[0].value,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(prefill.logo_url);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const siretDigits = form.siret.replace(/\D/g, "");

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.company_name.trim() &&
          siretDigits.length === 14 &&
          form.address_line.trim() &&
          form.address_zip.trim() &&
          form.address_city.trim() &&
          form.first_name.trim() &&
          form.last_name.trim() &&
          form.email.trim() &&
          form.job_title.trim() &&
          form.company_size_band,
      ),
    [form, siretDigits.length],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !supabase) return logoPreview;
    const extension = logoFile.name.split(".").pop() || "png";
    const path = `org-logos/${organizationId}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(path, logoFile, { upsert: true });
    if (error) {
      console.warn("[enterprise-signup] logo upload:", error.message);
      return logoPreview;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data?.publicUrl ?? logoPreview;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const logoUrl = await uploadLogo();
      let formationOnly = false;
      try {
        const { readFormationIntent } = await import("@/lib/entreprise/formation-intent");
        formationOnly = Boolean(readFormationIntent()?.courseId);
      } catch {
        formationOnly = false;
      }
      const response = await fetch("/api/entreprises/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          siret: siretDigits,
          logo_url: logoUrl,
          formation_only: formationOnly,
          intent: formationOnly ? "formation" : undefined,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        redirect_to?: string;
        formation_only?: boolean;
      };
      if (!response.ok) {
        throw new Error(data.error || "Enregistrement impossible.");
      }
      if (formationOnly || data.formation_only) {
        try {
          const { markFormationOnlySession } = await import("@/lib/entreprise/formation-intent");
          markFormationOnlySession();
        } catch {
          /* ignore */
        }
      }
      onCompleted(data.redirect_to ?? `/onboarding/${organizationId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[#050505]/55 p-0 backdrop-blur-md sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="entreprise-profile-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white text-[#050505] shadow-[0_24px_80px_rgba(5,5,5,0.28)] sm:rounded-[28px]"
      >
        <div className="border-b border-[#050505]/08 px-6 pb-5 pt-6 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#050505] text-white">
              <Building2 className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#050505]/40">
                Byound Entreprise
              </p>
              <h2
                id="entreprise-profile-title"
                className="mt-1 text-[1.35rem] font-semibold tracking-[-0.03em] sm:text-[1.5rem]"
              >
                Complétez votre espace
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#050505]/55">
                SIRET et adresse postale sont requis pour devis et convention. Diagnostic offert ·
                30 jours d&apos;essai.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6 sm:px-8">
          <section className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#050505]/40">
              Entreprise
            </p>
            <label className="block text-sm font-medium text-[#050505]/70">
              Raison sociale
              <input
                name="company_name"
                required
                value={form.company_name}
                onChange={handleChange}
                placeholder="Nom de l'entreprise"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-medium text-[#050505]/70">
              SIRET
              <input
                name="siret"
                required
                inputMode="numeric"
                value={form.siret}
                onChange={handleChange}
                placeholder="14 chiffres"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-medium text-[#050505]/70">
              Adresse postale
              <input
                name="address_line"
                required
                value={form.address_line}
                onChange={handleChange}
                placeholder="N° et rue"
                autoComplete="street-address"
                className={fieldClass}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
              <label className="block text-sm font-medium text-[#050505]/70">
                Code postal
                <input
                  name="address_zip"
                  required
                  value={form.address_zip}
                  onChange={handleChange}
                  placeholder="14000"
                  autoComplete="postal-code"
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-medium text-[#050505]/70">
                Ville
                <input
                  name="address_city"
                  required
                  value={form.address_city}
                  onChange={handleChange}
                  placeholder="Caen"
                  autoComplete="address-level2"
                  className={fieldClass}
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-[#050505]/70">
              Effectif
              <select
                name="company_size_band"
                required
                value={form.company_size_band}
                onChange={handleChange}
                className={cn(fieldClass, "appearance-none")}
              >
                {COMPANY_SIZE_BANDS.map((band) => (
                  <option key={band.value} value={band.value}>
                    {band.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#050505]/40">
              Votre contact
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#050505]/70">
                Prénom
                <input
                  name="first_name"
                  required
                  value={form.first_name}
                  onChange={handleChange}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-medium text-[#050505]/70">
                Nom
                <input
                  name="last_name"
                  required
                  value={form.last_name}
                  onChange={handleChange}
                  className={fieldClass}
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-[#050505]/70">
              Poste
              <input
                name="job_title"
                required
                value={form.job_title}
                onChange={handleChange}
                placeholder="ex. DRH, CEO, Responsable formation"
                className={fieldClass}
              />
            </label>
            <label className="block text-sm font-medium text-[#050505]/70">
              E-mail professionnel
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className={fieldClass}
              />
            </label>
          </section>

          <div className="rounded-2xl border border-dashed border-[#050505]/12 bg-[#F7F7F5] p-4">
            <div className="flex items-center gap-4">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="" className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#050505]/30">
                  <Upload className="h-5 w-5" aria-hidden />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-[#050505]">Logo</p>
                <p className="text-xs text-[#050505]/45">Optionnel — PNG ou JPG</p>
                <label className="mt-2 inline-flex cursor-pointer text-sm font-semibold text-[#050505] underline-offset-2 hover:underline">
                  Choisir un fichier
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#050505] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Continuer"
            )}
          </button>
        </form>

        {errorMessage ? (
          <div className="mx-6 mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-8">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function EnterpriseSignupProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const cachedOnMount = readCachedSignupStatus();
  const [loading, setLoading] = useState(() => cachedOnMount === null);
  const [status, setStatus] = useState<SignupStatusResponse | null>(cachedOnMount);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/entreprises/signup-status", { cache: "no-store" });
        const json = (await res.json()) as SignupStatusResponse;
        if (!cancelled) {
          setStatus(json);
          writeCachedSignupStatus(json);
        }
      } catch {
        if (!cancelled) {
          const fallback = { needs_profile_completion: false };
          setStatus(fallback);
          writeCachedSignupStatus(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !status) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#050505]/40" />
      </div>
    );
  }

  if (status?.needs_profile_completion && status.organization_id && status.prefill) {
    return (
      <>
        <div className="pointer-events-none opacity-40">{children}</div>
        <EnterpriseSignupProfileOverlay
          organizationId={status.organization_id}
          prefill={status.prefill}
          onCompleted={(redirectTo) => router.replace(redirectTo)}
        />
      </>
    );
  }

  return <>{children}</>;
}
