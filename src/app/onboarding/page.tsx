"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Legacy route — redirige vers le test DISC unifié (30 questions, ipsatif). */
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const run = async () => {
      if (!supabase) {
        router.replace("/dashboard/apprenant/test-comportemental-intro");
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        router.replace("/login?from=connect");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role_type, school_id")
        .eq("id", userData.user.id)
        .maybeSingle();
      const normalizedRole = String(profile?.role_type ?? "").trim().toLowerCase();
      const isSchoolRole = ["ecole", "school", "cfa", "admin_ecole", "admin_school"].includes(
        normalizedRole,
      );
      const isEnterpriseRole = ["entreprise", "enterprise"].includes(normalizedRole);
      const hasSchoolScope = Boolean(profile?.school_id);
      if (isSchoolRole || hasSchoolScope) {
        router.replace("/dashboard/ecole");
        return;
      }
      if (isEnterpriseRole) {
        router.replace("/dashboard/entreprise");
        return;
      }
      router.replace("/dashboard/apprenant/test-comportemental-intro");
    };
    void run();
  }, [router, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0d] text-white/60">
      Redirection vers le test comportemental…
    </div>
  );
}
