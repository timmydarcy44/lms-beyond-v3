import type { SupabaseClient } from "@supabase/supabase-js";
import { sendAccessCode } from "@/lib/cfa/access-code";
import { grantUserRole } from "@/lib/auth/user-roles";
import { syncTutorAssignment } from "@/lib/cfa/sync-tutor-assignment";

export async function recordCfaAudit(
  db: SupabaseClient,
  input: { actorId: string | null; applicationId: string; action: string; oldValue?: string | null; newValue?: string | null },
) {
  const write = await db.from("cfa_audit_events").insert({
    actor_id: input.actorId,
    application_id: input.applicationId,
    action: input.action,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
  });
  if (write.error && !/cfa_audit_events|schema cache/i.test(write.error.message)) {
    console.error("[cfa-audit]", write.error.message);
  }
}

/** Crée ou relie le compte apprenant au passage à admitted, puis prévient la personne. */
export async function admitCfaApplication(
  db: SupabaseClient,
  application: { id: string; email?: string | null; first_name?: string | null; last_name?: string | null; profile_id?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = String(application.email ?? "").trim().toLowerCase();
  const firstName = String(application.first_name ?? "").trim();
  const lastName = String(application.last_name ?? "").trim();
  if (!email) return { ok: false, error: "E-mail manquant." };

  let profileId = String(application.profile_id ?? "").trim();
  if (!profileId) {
    const found = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
    profileId = String((found.data as { id?: string } | null)?.id ?? "").trim();
  }

  if (!profileId) {
    const sent = await sendAccessCode(db, {
      email,
      role: "apprenant",
      context: "apprenant_admitted_new",
      firstName,
      lastName,
    });
    if (!sent.ok) return sent;
    const created = await db.from("profiles").select("id").ilike("email", email).maybeSingle();
    profileId = String((created.data as { id?: string } | null)?.id ?? "").trim();
    if (profileId) {
      const linked = await db.from("cfa_applications").update({ profile_id: profileId, origin: "direct" }).eq("id", application.id);
      if (linked.error && !/profile_id|origin|schema cache/i.test(linked.error.message)) {
        return { ok: false, error: linked.error.message };
      }
    }
  } else {
    await grantUserRole(db, profileId, "apprenant");
    const linked = await db.from("cfa_applications").update({ profile_id: profileId }).eq("id", application.id);
    if (linked.error && !/profile_id|schema cache/i.test(linked.error.message)) {
      return { ok: false, error: linked.error.message };
    }
    const sent = await sendAccessCode(db, {
      email,
      role: "apprenant",
      context: "apprenant_admitted_existing",
      firstName,
      lastName,
    });
    if (!sent.ok) return sent;
  }

  await syncTutorAssignment(db, application.id);
  return { ok: true };
}
