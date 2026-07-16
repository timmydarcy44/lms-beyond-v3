import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getJessicaCrmContacts } from "@/lib/queries/jessica-crm-contacts";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import { fetchJessicaAssignableCatalogItems } from "@/lib/jessica-contentin/sync-jessica-catalog";
import {
  JessicaFacturesClient,
  type JessicaFormationOption,
  type JessicaInvoiceClientOption,
} from "@/components/jessica-contentin/jessica-factures-client";
import type { JessicaInvoiceLineItem } from "@/lib/jessica-contentin/jessica-invoice-shared";

export const revalidate = 0;

async function loadFormationPrices(
  service: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  ids: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;

  const { data } = await service
    .from("catalog_items")
    .select("id, price")
    .in("id", ids);

  for (const row of data ?? []) {
    const price = Number(row.price);
    if (Number.isFinite(price) && price > 0) map.set(String(row.id), price);
  }

  const courseIds = ids.filter((id) => !map.has(id));
  if (courseIds.length > 0) {
    const { data: courses } = await service.from("courses").select("id, price").in("id", courseIds);
    for (const row of courses ?? []) {
      const price = Number(row.price);
      if (Number.isFinite(price) && price > 0) map.set(String(row.id), price);
    }
  }

  return map;
}

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
  let formations: JessicaFormationOption[] = [];
  let initialInvoices: Array<{
    id: string;
    invoice_number: string;
    client_label: string;
    client_email: string | null;
    amount_cents: number;
    designation: string;
    section_title?: string | null;
    line_items?: JessicaInvoiceLineItem[] | null;
    payment_method: string;
    invoice_date: string;
    consultation_date: string | null;
    created_at: string;
  }> = [];

  if (service) {
    const catalogItems = await fetchJessicaAssignableCatalogItems(service);
    const priceMap = await loadFormationPrices(
      service,
      catalogItems.map((c) => c.id),
    );
    formations = catalogItems.map((item) => ({
      id: item.id,
      title: String(item.title ?? "Formation"),
      priceEuros: priceMap.get(item.id) ?? 0,
    }));

    const { data, error } = await service
      .from("jessica_invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      initialInvoices = data as typeof initialInvoices;
    }
  }

  return (
    <JessicaFacturesClient
      clients={clients}
      formations={formations}
      initialInvoices={initialInvoices}
    />
  );
}
