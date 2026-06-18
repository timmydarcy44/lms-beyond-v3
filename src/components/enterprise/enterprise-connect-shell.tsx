"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EnterpriseOverviewProvider } from "@/components/enterprise/enterprise-overview-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function EnterpriseConnectShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        router.replace("/login?from=entreprise");
      }
    })();
  }, [router]);

  return <EnterpriseOverviewProvider>{children}</EnterpriseOverviewProvider>;
}
