import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { loadTodayHome } from "@/lib/control/today";
import { TodayHome } from "./today-home";

export const dynamic = "force-dynamic";

export default async function SuperDashboard() {
  const supabase = await getServerClient();
  if (!supabase) redirect("/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email === "contentin.cabinet@gmail.com") redirect("/super/jessica-dashboard");
  const data = await loadTodayHome({
    email: user?.email,
    user_metadata: (user?.user_metadata ?? {}) as Record<string, unknown>,
  });
  return <TodayHome data={data} />;
}
