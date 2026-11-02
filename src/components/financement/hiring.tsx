import Link from "next/link";
import { AIDE_EMBAUCHE, AIDE_HANDICAP } from "@/lib/financement";
import { Band, H2, focusRing } from "@/components/financement/ui";

export function FinancementHiring({ entreprisesHref }: { entreprisesHref: string }) {
  return (
    <Band id="recruter">
      <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <H2>Recruter un alternant, c&apos;est aidé.</H2>
          <p className="mt-5 max-w-md text-[18px] leading-relaxed text-[#4A4F5C]">
            L&apos;aide à l&apos;embauche dépend du niveau préparé et de la taille de votre entreprise.
          </p>
          <Link href={entreprisesHref} className={`mt-8 inline-flex h-14 items-center rounded-full bg-[#0B0D14] px-6 text-[15px] font-extrabold text-white no-underline ${focusRing}`}>
            Recruter un alternant Byound
          </Link>
        </div>
        <div>
          <table className="hidden w-full border-separate border-spacing-y-2 text-left md:table">
            <caption className="sr-only">{AIDE_EMBAUCHE.caption}</caption>
            <thead>
              <tr className="text-[13px] text-[#4A4F5C]">
                <th scope="col" className="px-4 py-2 font-bold">Diplôme préparé</th>
                {AIDE_EMBAUCHE.columns.map((column) => (
                  <th key={column} scope="col" className="px-4 py-2 font-bold">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AIDE_EMBAUCHE.rows.map((row) => (
                <tr key={row.diploma} className="bg-white">
                  <th scope="row" className="rounded-l-[20px] px-4 py-4 text-[15px] font-extrabold">{row.diploma}</th>
                  <td className="px-4 py-4 text-[18px] font-extrabold">{row.small.label}</td>
                  <td className="rounded-r-[20px] px-4 py-4 text-[18px] font-extrabold">{row.large.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid gap-3 md:hidden">
            {AIDE_EMBAUCHE.rows.map((row) => (
              <article key={row.diploma} className="rounded-[28px] bg-white p-5">
                <h3 className="text-[16px] font-extrabold">{row.diploma}</h3>
                <dl className="mt-4 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[13px] text-[#4A4F5C]">{AIDE_EMBAUCHE.columns[0]}</dt>
                    <dd className="font-extrabold">{row.small.label}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[13px] text-[#4A4F5C]">{AIDE_EMBAUCHE.columns[1]}</dt>
                    <dd className="font-extrabold">{row.large.label}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <p className="mt-4 rounded-[24px] bg-[#EEEBFF] px-5 py-4 text-[15px] font-bold leading-relaxed text-[#0B0D14]">
            {AIDE_HANDICAP.label} pour un apprenti reconnu travailleur handicapé, quelle que soit la taille de l&apos;entreprise.
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-[#4A4F5C]">{AIDE_EMBAUCHE.mention}</p>
        </div>
      </div>
    </Band>
  );
}
