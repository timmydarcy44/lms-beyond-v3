"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Upload } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { COMPANY_SIZE_BANDS } from "@/lib/entreprise/company-size-bands";

type Prefill = {
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  company_size_band: string;
  logo_url: string | null;
};

type SignupStatusResponse = {
  needs_profile_completion?: boolean;
  organization_id?: string;
  prefill?: Prefill;
};

const SIGNUP_CACHE_KEY = "entreprise_signup_status_v1";
const SIGNUP_CACHE_MS = 5 * 60 * 1000;

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

  const canSubmit = useMemo(
    () =>
      form.company_name.trim() &&
      form.first_name.trim() &&
      form.last_name.trim() &&
      form.email.trim() &&
      form.job_title.trim() &&
      form.company_size_band,
    [form],
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
      const response = await fetch("/api/entreprises/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo_url: logoUrl }),
      });
      const data = (await response.json()) as { error?: string; redirect_to?: string };
      if (!response.ok) {
        throw new Error(data.error || "Enregistrement impossible.");
      }
      onCompleted(data.redirect_to ?? `/onboarding/${organizationId}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0a0a]/80 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E63329]/10 text-[#E63329]">
            <Building2 className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">EDGE Entreprise</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-black">Complétez votre espace RH</h2>
            <p className="mt-1 text-sm text-black/55">
              Diagnostic offert et utilisation pendant 30 jours. Ces informations personnalisent votre dashboard.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="company_name"
            required
            value={form.company_name}
            onChange={handleChange}
            placeholder="Nom de l'entreprise"
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] outline-none focus:border-black/25"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="first_name"
              required
              value={form.first_name}
              onChange={handleChange}
              placeholder="Prénom"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] outline-none focus:border-black/25"
            />
            <input
              name="last_name"
              required
              value={form.last_name}
              onChange={handleChange}
              placeholder="Nom"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] outline-none focus:border-black/25"
            />
          </div>
          <input
            name="job_title"
            required
            value={form.job_title}
            onChange={handleChange}
            placeholder="Poste (ex. DRH, CEO, Responsable formation)"
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] outline-none focus:border-black/25"
          />
          <input
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="Email professionnel"
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] outline-none focus:border-black/25"
          />
          <select
            name="company_size_band"
            required
            value={form.company_size_band}
            onChange={handleChange}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-[15px] text-black/80 outline-none focus:border-black/25"
          >
            {COMPANY_SIZE_BANDS.map((band) => (
              <option key={band.value} value={band.value}>
                {band.label}
              </option>
            ))}
          </select>

          <div className="rounded-2xl border border-dashed border-black/15 p-4">
            <div className="flex items-center gap-4">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/[0.04] text-black/30">
                  <Upload className="h-5 w-5" aria-hidden />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-black">Logo de l&apos;entreprise</p>
                <p className="text-xs text-black/45">Optionnel — PNG ou JPG, affiché dans votre dashboard.</p>
                <label className="mt-2 inline-flex cursor-pointer text-sm font-semibold text-[#E63329]">
                  Choisir un fichier
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E63329] px-6 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              "Continuer vers la configuration"
            )}
          </button>
        </form>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
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
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
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
