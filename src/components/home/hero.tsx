import Image from "next/image";
import Link from "next/link";

export function HomeHero({
  schoolHref,
  businessHref,
  imageSrc = "/images/hero-formation.jpg",
}: {
  schoolHref: string;
  businessHref: string;
  imageSrc?: string;
}) {
  return (
    <section className="relative bg-[#060D28] text-white">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[50vh]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(80,120,255,0.18), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-4 mb-4 min-h-[640px] overflow-hidden rounded-[24px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:min-h-[780px] md:rounded-[36px]">
        <Image
          src={imageSrc}
          alt="Une formatrice anime une séance avec un petit groupe autour d'une table"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] md:object-[center_30%]"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(0deg, rgba(6,13,40,0.92) 0%, rgba(10,24,72,0.5) 38%, rgba(10,24,72,0.05) 65%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 flex min-h-[640px] flex-col justify-end p-6 md:min-h-[780px] md:p-14">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:flex-wrap md:items-end">
            <div className="max-w-[640px]">
              <h1 className="home-hero-in text-[44px] font-bold leading-[0.95] tracking-[-0.05em] text-white md:text-[clamp(48px,6.4vw,96px)]">
                La compétence, prouvée.
              </h1>
              <p className="home-hero-in home-hero-in-delay-1 mt-5 max-w-[520px] text-[19px] leading-[1.5] text-white/[0.82]">
                On mesure ce que vous savez faire, on vous fait progresser, on le rend visible.
              </p>
            </div>

            <div className="home-hero-in home-hero-in-delay-2 flex w-full flex-col items-start gap-4 md:w-auto md:items-end">
              <div className="flex items-center gap-3 rounded-[20px] border border-white/[0.28] bg-white/16 px-[18px] py-3.5 backdrop-blur-[24px]">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[#C9CDD6]"
                  style={{
                    background: "#0A0A0C",
                    boxShadow: "inset 0 0 0 3px #0A0A0C, inset 0 0 0 4px #7C5CFF",
                  }}
                  aria-hidden
                />
                <span>
                  <span className="block text-[12px] text-white/85">Open Badge obtenu</span>
                  <span className="block text-[15px] font-bold text-white">Négociation</span>
                </span>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto md:items-end">
                <Link
                  href={schoolHref}
                  className="inline-flex w-full items-center justify-center rounded-full bg-white px-[26px] py-4 text-[16px] font-semibold text-[#060D28] transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:w-auto"
                >
                  Découvrir l&apos;école
                </Link>
                <Link
                  href={businessHref}
                  className="inline-flex w-full items-center justify-center rounded-full bg-white/16 px-[26px] py-4 text-[16px] font-semibold text-white backdrop-blur-md transition hover:bg-white/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:w-auto"
                >
                  Entreprises
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
