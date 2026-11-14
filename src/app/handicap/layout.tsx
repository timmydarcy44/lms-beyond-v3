import { redirect } from "next/navigation";
import { HandicapShell } from "@/components/handicap/handicap-shell";
import { requireDisabilityStaff } from "@/lib/handicap/staff";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function loadNavCounts() {
  const service = getServiceRoleClient();
  if (!service) return { people: 0, meetings: 0, requests: 0 };
  const [{ count: people }, { count: requests }, { data: meetings }] = await Promise.all([
    service
      .from("disability_cases")
      .select("*", { count: "exact", head: true })
      .neq("status", "closed"),
    service
      .from("disability_cases")
      .select("*", { count: "exact", head: true })
      .eq("status", "request"),
    service
      .from("disability_meetings")
      .select("id, scheduled_at, status")
      .eq("status", "open")
      .gte("scheduled_at", new Date().toISOString())
      .limit(50),
  ]);
  return {
    people: people ?? 0,
    requests: requests ?? 0,
    meetings: (meetings ?? []).length,
  };
}

export default async function HandicapLayout({ children }: { children: React.ReactNode }) {
  const gate = await requireDisabilityStaff();
  if (!gate.ok) {
    redirect(gate.status === 401 ? "/login" : "/unauthorized");
  }

  const counts = await loadNavCounts();
  const first = gate.firstName || "Référente";
  const initials =
    first
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "RH";

  return (
    <HandicapShell
      userLabel={first}
      userInitials={initials}
      counts={counts}
    >
      {children}
    </HandicapShell>
  );
}
