import { CareExpertTabs } from "@/components/expert/care-expert-tabs";
import { requireCarePage } from "@/lib/expert/care-page";

export default async function CareExpertLayout({ children }: { children: React.ReactNode }) {
  await requireCarePage();
  return (
    <div className="px-4 py-6 md:px-8">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#9096A3]">Byound Care</p>
      <h1 className="mb-4 text-2xl font-extrabold">Espace praticien</h1>
      <CareExpertTabs />
      {children}
    </div>
  );
}
