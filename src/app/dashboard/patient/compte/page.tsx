import Link from "next/link";
import { PatientSignOut } from "@/app/dashboard/patient/_ui/sign-out";
import { getSession } from "@/lib/auth/session";
import { formatPersonName } from "@/lib/care/person-name";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PatientAccountPage() {
  const session = await getSession();
  const db = getServiceRoleClient();
  const { data: profile } = session?.id && db
    ? await db.from("profiles").select("first_name, last_name, email, full_name").eq("id", session.id).maybeSingle()
    : { data: null };
  const name = [formatPersonName(profile?.first_name), formatPersonName(profile?.last_name)].filter(Boolean).join(" ")
    || formatPersonName(profile?.full_name)
    || "Patient";

  return (
    <section>
      <h1 className="patient-page-title">Compte</h1>
      <article className="patient-card" style={{ marginTop: 18 }}>
        <h2>{name}</h2>
        <p className="patient-muted">{profile?.email || session?.email}</p>
        <div className="patient-row-actions" style={{ marginTop: 18 }}>
          <PatientSignOut />
          <Link href="/care/praticiens" className="patient-pill patient-pill--soft">
            Voir les praticiens
          </Link>
        </div>
      </article>
    </section>
  );
}
