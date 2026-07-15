import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaCrmContacts } from "@/lib/queries/jessica-crm-contacts";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import {
  JessicaFacturesClient,
  type JessicaInvoiceClientOption,
} from "@/components/jessica-contentin/jessica-factures-client";

export const revalidate = 0;

export default async function JessicaFacturesPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== JESSICA_CONTENTIN_EMAIL) redirect("/super");

  const contacts = await getJessicaCrmContacts();
  const clients: JessicaInvoiceClientOption[] = contacts.map((c) => {
    const first = c.firstName?.trim() || null;
    const last = c.lastName?.trim() || null;
    let label = formatClientName(first, last, c.fullName ?? c.email);
    if (last) {
      label = first ? `${first} ${last.toUpperCase()}` : last.toUpperCase();
    }
    return {
      id: c.id ? `user:${c.id}` : `email:${(c.email || label).toLowerCase()}`,
      label,
      email: c.email,
    };
  });

  const service = getServiceRoleClient();
  let initialInvoices: Array<{
    id: string;
    invoice_number: string;
    client_label: string;
    client_email: string | null;
    amount_cents: number;
    designation: string;
    payment_method: string;
    invoice_date: string;
    consultation_date: string | null;
    created_at: string;
  }> = [];

  if (service) {
    const { data, error } = await service
      .from("jessica_invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      initialInvoices = data as typeof initialInvoices;
    }
  }

  return <JessicaFacturesClient clients={clients} initialInvoices={initialInvoices} />;
}
