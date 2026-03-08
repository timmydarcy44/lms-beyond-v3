"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";

export function usePartenaireGuard() {
  const supabase = useSupabase();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    const checkAccess = async () => {
      const isDemoMode =
        typeof window !== "undefined" &&
        (document.cookie.includes("demo_mode=true") || window.location.search.includes("demo=true"));
      if (isDemoMode) {
        setStatus("allowed");
        return;
      }
      if (!supabase) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        setStatus("denied");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const role = String(profile?.role ?? "").trim().toLowerCase();
      if (role === "partenaire") {
        setStatus("allowed");
      } else {
        router.replace("/dashboard");
        setStatus("denied");
      }
    };
    checkAccess();
  }, [router, supabase]);

  return status;
}
