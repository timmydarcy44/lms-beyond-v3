"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import SidebarSalarie from "@/components/SidebarSalarie";
import { LearnerSnapshotProvider } from "@/components/learner/learner-snapshot-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SalarieConnectShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const bareTest = pathname.startsWith("/dashboard/salarie/test-");
  const inPlayer = /\/dashboard\/salarie\/formations\/[^/]+\/play(?:\/|$)/.test(pathname);
  const inStudio =
    pathname.startsWith("/dashboard/salarie/formations/") &&
    !pathname.startsWith("/dashboard/salarie/formations/positionnement") &&
    !inPlayer;

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

  if (bareTest || inPlayer || inStudio) {
    return (
      <LearnerSnapshotProvider>
        <div
          className={
            bareTest
              ? "min-h-screen bg-white text-[#111111]"
              : inStudio
                ? "min-h-screen bg-[#07080b] text-white"
                : "min-h-screen bg-[#F7F4EE] text-[#07080B]"
          }
        >
          {children}
        </div>
      </LearnerSnapshotProvider>
    );
  }

  return (
    <LearnerSnapshotProvider>
      <div className="min-h-screen bg-[#07080B] text-[#F4F5F7]">
        <SidebarSalarie />
        <main className="min-h-screen lg:pl-[88px]">{children}</main>
      </div>
    </LearnerSnapshotProvider>
  );
}
