"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";

export const dynamic = "force-dynamic";

function safeNext(raw: string | null): string {
  const v = (raw ?? "").trim();
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  return "/dashboard/apprenant";
}

export default function HelloAfterLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => safeNext(searchParams.get("next")), [searchParams]);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
        const firstName = resolveLearnerDisplayFirstName({
          profileFirstName: null,
          metadataFirstName: typeof meta.first_name === "string" ? meta.first_name : null,
          metadataGivenName: typeof meta.given_name === "string" ? meta.given_name : null,
          metadataPrenom: typeof meta.prenom === "string" ? meta.prenom : null,
          email: user?.email ?? null,
        });
        if (!cancelled) setName(firstName);
      } catch {
        if (!cancelled) setName("Bonjour");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.replace(next);
      router.refresh();
    }, 2200);
    return () => window.clearTimeout(t);
  }, [router, next]);

  return (
    <div className="min-h-[calc(100vh-3rem)] bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-gray-500">Connexion réussie</p>
        <h1 className="mt-3 text-4xl font-bold text-gray-900">
          Bonjour{ name ? ` ${name}` : "" }
        </h1>
        <p className="mt-3 text-sm text-gray-600">On vous amène à votre espace…</p>
      </div>
    </div>
  );
}

