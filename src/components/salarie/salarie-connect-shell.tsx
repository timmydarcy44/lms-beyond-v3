"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import SidebarSalarie from "@/components/SidebarSalarie";
import { LearnerSnapshotProvider } from "@/components/learner/learner-snapshot-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SalarieConnectShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user) {
        router.replace("/login?from=salarie");
        return;
      }
      const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
      if (meta.needs_password_setup === true) {
        router.replace(`/auth/set-password?next=${encodeURIComponent("/dashboard/salarie")}&flow=invite`);
      }
    })();
  }, [router]);

  return (
    <LearnerSnapshotProvider>
      <div className="min-h-screen bg-[#07080B] text-[#F4F5F7]">
        <SidebarSalarie />
        <main className="min-h-screen lg:pl-[240px]">{children}</main>
      </div>
    </LearnerSnapshotProvider>
  );
}
