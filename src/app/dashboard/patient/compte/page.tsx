import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PatientAccountPage() {
  const session = await getSession();
  const db = getServiceRoleClient();
  const { data: profile } = session?.id && db
    ? await db.from("profiles").select("first_name, last_name, email, full_name").eq("id", session.id).maybeSingle()
    : { data: null };
  return (
    <section className="care-section" style={{ paddingTop: 12 }}>
      <h1 className="care-h1" style={{ fontSize: 32 }}>Compte</h1>
      <article className="care-patient-card" style={{ marginTop: 20 }}>
        <p>
          <strong>{[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.full_name || "Patient"}</strong>
        </p>
        <p className="care-muted">{profile?.email || session?.email}</p>
      </article>
      <p className="care-muted" style={{ marginTop: 18 }}>
        Besoin d’un nouveau rendez-vous ?{" "}
        <Link href="/care/praticiens">Parcourir les praticiens</Link>
      </p>
    </section>
  );
}