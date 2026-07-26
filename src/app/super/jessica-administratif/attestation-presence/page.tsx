import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaCrmContacts } from "@/lib/queries/jessica-crm-contacts";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import { JessicaAttestationClient } from "@/components/jessica-contentin/jessica-attestation-client";

export const revalidate = 0;

export default async function JessicaAttestationPresencePage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  const contacts = await getJessicaCrmContacts();
  const attestationContacts = contacts
    .filter((c) => c.email?.includes("@"))
    .map((c) => {
      const first = c.firstName?.trim() || null;
      const last = c.lastName?.trim() || null;
      let label = formatClientName(first, last, c.fullName ?? c.email);
      if (last) {
        label = first ? `${first} ${last.toUpperCase()}` : last.toUpperCase();
      }
      return {
        id: c.id ? `user:${c.id}` : `email:${c.email.toLowerCase()}`,
        label,
        email: c.email,
        firstName: first,
      };
    });

  return <JessicaAttestationClient contacts={attestationContacts} />;
}
