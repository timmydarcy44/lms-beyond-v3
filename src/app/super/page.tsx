import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { loadTodayHome } from "@/lib/control/today";
import { CONTENTIN_EMAIL, SUPER_SPACE_COOKIE } from "@/lib/utils/contentin-theme";
import { TodayHome } from "./today-home";

export const dynamic = "force-dynamic";

export default async function SuperDashboard({
  searchParams,
}: {
  searchParams: Promise<{ space?: string }>;
}) {
  const supabase = await getServerClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  const sp = await searchParams;
  const jar = await cookies();
  const wantsByound =
    sp.space === "byound" || jar.get(SUPER_SPACE_COOKIE)?.value === "byound";
  // Cabinet Jessica par défaut ; Byound Control via CTA « Byound » (?space=byound / cookie).
  if (user?.email === CONTENTIN_EMAIL && !wantsByound) {
    redirect("/super/jessica-dashboard");
  }
  const data = await loadTodayHome({
    email: user?.email,
    user_metadata: (user?.user_metadata ?? {}) as Record<string, unknown>,
  });
  return <TodayHome data={data} />;
}
