"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useState } from "react";

export function LoadingRedirect() {
  const router = useRouter();
  const supabase = useSupabase();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const determineRedirect = async () => {
      if (!supabase || !isMounted) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        const [profileResult, superAdminResult, membershipResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single(),
          supabase
            .from("super_admins")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("org_memberships")
            .select("role")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle(),
        ]);

        const role = profileResult.data?.role || membershipResult.data?.role;
        const isSuperAdmin = superAdminResult.data || profileResult.data?.role === "super_admin";

        if (!isMounted) return;

        if (isSuperAdmin) {
          setRedirectPath("/super");
          return;
        }

        let path = "/dashboard";

        switch (role) {
          case "admin":
            path = "/admin";
            break;
          case "instructor":
            path = "/dashboard/formateur";
            break;
          case "tutor":
            path = "/dashboard/tuteur";
            break;
          case "learner":
          case "student":
            path = "/dashboard/apprenant";
            break;
          default:
            path = "/dashboard";
        }

        setRedirectPath(path);
      } catch (error) {
        console.error("[loading] Error determining redirect:", error);
        if (isMounted) {
          setRedirectPath("/dashboard");
        }
      }
    };

    determineRedirect();

    return () => {
      isMounted = false;
    };
  }, [supabase, router]);

  useEffect(() => {
    if (redirectPath) {
      router.replace(redirectPath);
    }
  }, [redirectPath, router]);

  return null;
}

