import { Suspense } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OfferBuilder } from "@/components/enterprise/offer-builder";

export const dynamic = "force-dynamic";

export default async function EditionOffrePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex min-h-screen bg-[#F4F4F1] text-[#07080B]">
      <EnterpriseSidebar />
      <main className="min-h-screen min-w-0 flex-1 lg:pl-[104px]">
        <Suspense>
          <OfferBuilder offerId={id} />
        </Suspense>
      </main>
    </div>
  );
}
