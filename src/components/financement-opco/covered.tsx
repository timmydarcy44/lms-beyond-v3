import { COVERED_INTRO, COVERED_ROWS, OPCO_FLAGS, SUBROGATION_LINE } from "@/lib/financement-opco";
import { Band, H2, Pill } from "@/components/site/ui";

export function OpcoCovered() {
  return (
    <Band dark>
      <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <H2 light>Ce qui peut être pris en charge.</H2>
          <p className="mt-4 max-w-xl text-[18px] leading-relaxed text-white/75">{COVERED_INTRO}</p>
          {OPCO_FLAGS.qualiopi ? (
            <p className="mt-6 inline-flex flex-wrap items-center gap-2 rounded-full bg-[#EEEBFF] px-4 py-2 text-[13px] font-extrabold text-[#0B0D14]">
              Organisme certifié Qualiopi
              {OPCO_FLAGS.qualiopiCertificat ? <span>Certificat {OPCO_FLAGS.qualiopiCertificat}</span> : null}
            </p>
          ) : null}
        </div>
        <ul className="space-y-3">
          {COVERED_ROWS.map((row) => (
            <li key={row.title} className="flex items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.06] px-5 py-5">
              <div>
                <p className="text-[17px] font-extrabold">{row.title}</p>
                <p className="mt-1 text-[15px] text-white/65">{row.text}</p>
              </div>
              <Pill tone={row.tone}>{row.pill}</Pill>
            </li>
          ))}
          {OPCO_FLAGS.subrogation ? (
            <li className="rounded-[28px] border border-white/10 bg-white/[0.06] px-5 py-5 text-[16px] font-extrabold">
              {SUBROGATION_LINE}
            </li>
          ) : null}
        </ul>
      </div>
    </Band>
  );
}
