import { redirect } from "next/navigation";
import { CarePatientShell } from "@/components/care/care-patient-shell";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";
import "../../care/care.css";

export const dynamic = "force-dynamic";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.id) redirect("/login?next=/dashboard/patient");
  const db = getServiceRoleClient();
  const { data: profile } = db
    ? await db.from("profiles").select("first_name, full_name").eq("id", session.id).maybeSingle()
    : { data: null };
  const name = String(profile?.first_name || profile?.full_name || session.fullName || "").trim();
  return <CarePatientShell name={name}>{children}</CarePatientShell>;
}
