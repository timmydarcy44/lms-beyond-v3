import Link from "next/link";
import { notFound } from "next/navigation";
import ReferentHandicapPage from "@/components/handicap/referent-handicap-certifie-page";
import { HANDICAP_FORMATIONS_CATALOG } from "@/components/handicap/handicap-formations-catalog";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function HandicapFormationDetailPage({ params }: Props) {
  const { slug } = await params;
  const card = HANDICAP_FORMATIONS_CATALOG.find((c) => c.slug === slug);
  if (!card) notFound();

  if (slug === "referent-handicap-certifie-beyond") {
    return <ReferentHandicapPage />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-12 text-[#1E293B] md:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D65151]">Formation handicap</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{card.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.subtitle}</p>
        <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Ce parcours sera disponible prochainement sur Beyond LMS.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/ecole/handicap/formations"
            className="inline-flex rounded-full bg-[#D65151] px-5 py-2 text-sm font-semibold text-white"
          >
            Retour aux formations
          </Link>
          <Link href="/dashboard/ecole/handicap" className="inline-flex rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700">
            Galerie handicap
          </Link>
        </div>
      </div>
    </div>
  );
}
