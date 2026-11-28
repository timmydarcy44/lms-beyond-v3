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

      <div className="relative m-4 min-h-[calc(100svh-32px)] overflow-hidden rounded-[24px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:rounded-[36px]">
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

        <div className="relative z-10 flex min-h-[calc(100svh-32px)] flex-col justify-end p-6 pb-3 md:p-14 md:pb-4">
          <div className="max-w-[640px]">
            <h1 className="home-hero-in text-[44px] font-bold leading-[0.95] tracking-[-0.05em] text-white md:text-[clamp(48px,6.4vw,96px)]">
              La compétence, prouvée.
            </h1>
            <p className="home-hero-in home-hero-in-delay-1 mt-5 max-w-[520px] text-[19px] leading-[1.5] text-white/[0.82]">
              On mesure ce que vous savez faire, on vous fait progresser, on le rend visible.
            </p>
            <div className="home-hero-in home-hero-in-delay-2 mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href={schoolHref}
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-[26px] py-4 text-[16px] font-semibold text-[#060D28] transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                Découvrir l&apos;école
              </Link>
              <Link
                href={businessHref}
                className="inline-flex w-full items-center justify-center rounded-full bg-white/16 px-[26px] py-4 text-[16px] font-semibold text-white backdrop-blur-md transition hover:bg-white/24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
              >
                Entreprises
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
