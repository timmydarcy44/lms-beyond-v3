import { Manrope } from "next/font/google";
import { notFound, redirect } from "next/navigation";
import { AccountFile } from "@/components/control/account-file";
import { findCompanyBySource } from "@/lib/control/companies";
import { loadAccountDetail } from "@/lib/control/load";

const manrope = Manrope({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export default async function CompteClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; dealId?: string }>;
}) {
  const { id } = await params;
  const { tab, dealId } = await searchParams;
  const companyId = await findCompanyBySource("organization", id);
  if (companyId) {
    const qs = new URLSearchParams({ partie: "business" });
    if (tab) qs.set("tab", tab);
    if (dealId) qs.set("dealId", dealId);
    redirect(`/super/entreprises/${companyId}?${qs.toString()}`);
  }
  const detail = await loadAccountDetail(id);
  if (!detail.account) notFound();
  return (
    <div className={manrope.className} style={{ background: "#0A0F1E", color: "#F4F7FF", minHeight: "100vh" }}>
      <AccountFile detail={detail} initialTab={tab} initialDealId={dealId} />
    </div>
  );
}
