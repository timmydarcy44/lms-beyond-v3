import type { Metadata } from "next";
import Link from "next/link";
import path from "path";
import { readFile } from "fs/promises";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProgrammeHeroBanner } from "@/components/jessica-contentin/programme-hero-banner";
import { ProgrammeMarkdownBody } from "@/components/jessica-contentin/programme-markdown-body";
import { getProgramme, programmeSlugs } from "@/lib/jessica-contentin/programmes-catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return programmeSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const raw = resolved?.slug;
  const slug = typeof raw === "string" ? decodeURIComponent(raw).trim() : "";
  const p = getProgramme(slug);
  if (!p) return { title: "Programme" };
  return {
    title: `${p.headline} | Jessica Contentin`,
    description: p.tag,
    openGraph: {
      title: p.headline,
      description: p.tag,
      images: [{ url: p.promoPosterUrl ?? p.heroImageUrl }],
    },
  };
}

const BOOKING_PERFACTIVE = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export default async function ProgrammePresentationPage({ params }: Props) {
  const resolved = await params;
  const raw = resolved?.slug;
  const slug = typeof raw === "string" ? decodeURIComponent(raw).trim() : "";
  if (!slug) notFound();
  const p = getProgramme(slug);
  if (!p) notFound();

  const specialityHref = `/specialites/${p.specialitySlug}`;
  const heroTitle = p.heroTitle ?? p.headline;
  const heroSubtitle = p.heroSubtitle ?? p.tag;

  let apaiserMarkdown: string | null = null;
  if (slug === "apaiser-le-mental") {
    try {
      const mdPath = path.join(process.cwd(), "src/lib/jessica-contentin/apaiser-le-mental-programme.md");
      apaiserMarkdown = await readFile(mdPath, "utf8");
    } catch {
      apaiserMarkdown = null;
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-20">
      <ProgrammeHeroBanner
        imageUrl={p.heroImageUrl}
        imageAlt={p.headline}
        backgroundVideoUrl={p.promoVideoUrl}
        videoPosterUrl={p.promoPosterUrl}
        kicker={p.heroKicker}
        title={heroTitle}
        subtitle={heroSubtitle}
        specialityHref={specialityHref}
      />

      {apaiserMarkdown ? (
        <>
          <ProgrammeMarkdownBody content={apaiserMarkdown} />
          <section className="mx-auto max-w-3xl px-4 pb-12 md:px-8" aria-labelledby="rejoindre-titre">
            <h2 id="rejoindre-titre" className="sr-only">
              Rejoindre le programme
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild className="rounded-full bg-[#C6A664] px-8 py-6 text-base text-white hover:bg-[#B88A44]">
                <Link href="#programme-detail">Je découvre le programme</Link>
              </Button>
              <Button asChild className="rounded-full bg-[#2F2A25] px-8 py-6 text-base text-white hover:bg-[#1a1614]">
                <a href={BOOKING_PERFACTIVE} target="_blank" rel="noopener noreferrer">
                  Prendre rendez-vous
                </a>
              </Button>
            </div>
          </section>
        </>
      ) : null}

      <section className="mx-auto max-w-3xl space-y-8 px-4 md:px-8">
        {!apaiserMarkdown ? (
          <>
            <div className="space-y-4 text-[#2F2A25]">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Pourquoi ce parcours&nbsp;?</h2>
              <p className="text-lg leading-relaxed text-[#4A4339]">{p.intro}</p>
              <p className="text-base leading-relaxed text-[#5C5348]">
                Les séances se déroulent au cabinet (Bretteville-sur-Odon) ou à distance selon les besoins. Chaque
                accompagnement est ajusté à votre situation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-[#C6A664] px-8 text-white hover:bg-[#B88A44]">
                <a href={BOOKING_PERFACTIVE} target="_blank" rel="noopener noreferrer">
                  Prendre rendez-vous
                </a>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-[#2F2A25]/20 text-[#2F2A25] hover:bg-white/80">
                <Link href={specialityHref}>Lire la fiche accompagnement</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-3 border-t border-[#E6D9C6] pt-10">
            <Button asChild variant="outline" className="rounded-full border-[#2F2A25]/20 text-[#2F2A25] hover:bg-white/80">
              <Link href={specialityHref}>Lire la fiche accompagnement</Link>
            </Button>
          </div>
        )}

        <Link href="/" className="inline-flex text-sm font-semibold text-[#8B6914] underline-offset-4 hover:underline">
          ← Retour à l&apos;accueil
        </Link>
      </section>
    </div>
  );
}
