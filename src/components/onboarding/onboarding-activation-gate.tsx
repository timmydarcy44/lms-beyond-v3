"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  children: React.ReactNode;
};

function pickOtpType(raw: string | null): EmailOtpType | null {
  const t = String(raw ?? "").trim().toLowerCase();
  if (
    t === "invite" ||
    t === "recovery" ||
    t === "email" ||
    t === "magiclink"
  ) {
    return t as EmailOtpType;
  }
  return null;
}

export function OnboardingActivationGate({ children }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        if (!supabase) {
          setError("Supabase non configuré côté client (NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY).");
          return;
        }

        const code = search.get("code");
        const tokenHash = search.get("token_hash");
        const type = pickOtpType(search.get("type"));

        if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            throw new Error(`Activation impossible (exchangeCodeForSession): ${exchangeErr.message}`);
          }
          router.replace(pathname);
        } else if (tokenHash && type) {
          const { error: otpErr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (otpErr) {
            throw new Error(`Activation impossible (verifyOtp): ${otpErr.message}`);
          }
          router.replace(pathname);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Activation impossible");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [supabase, router, pathname, search]);

  if (!ready) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-6 py-16 text-center">
        <div>
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-600">Activation de votre compte…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-6 py-16 text-center">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm font-semibold text-rose-900">Activation impossible</p>
          <p className="mt-2 text-sm text-rose-800">{error}</p>
          <p className="mt-4 text-xs text-rose-700/80">
            Réessayez via le lien reçu par e-mail, ou contactez le support Beyond.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

