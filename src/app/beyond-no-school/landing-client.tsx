"use client";

import Link from "next/link";
import { useRef } from "react";
import { CheckCircle2, Link2, ArrowLeft, ArrowRight } from "lucide-react";

const accentGold = "text-[#C5A059]";
const premiumText = "text-[#EAEAEA]";

export function BeyondNoSchoolLanding() {
  const instructorsRef = useRef<HTMLDivElement | null>(null);

  const scrollInstructors = (direction: "left" | "right") => {
    const node = instructorsRef.current;
    if (!node) return;
    const amount = direction === "left" ? -360 : 360;
    node.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <main className={`min-h-screen bg-[#000000] ${premiumText} font-['SF_Pro_Display',Montserrat,system-ui,sans-serif]`}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#000000]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/beyond-no-school" className="text-lg font-semibold tracking-tight text-white">
            BEYOND
          </Link>
          <nav className="hidden items-center gap-6 text-sm tracking-tight text-white md:flex">
            <a href="#faculty">Corps enseignant</a>
            <a href="#programme">Programme</a>
            <a href="#open-badge">Open badge</a>
            <a href="#cours-gratuit">Cours gratuit</a>
            <Link href="/beyond-no-school/login">Connexion</Link>
          </nav>
          <Link
            href="/beyond-no-school/abonnement"
            className="hidden items-center justify-center rounded-2xl border border-[#C5A059] bg-black px-6 py-2 text-sm font-semibold tracking-tight text-white transition-all duration-200 hover:border-transparent hover:text-white hover:bg-[linear-gradient(135deg,#C5A059_0%,#8E6D31_100%)] md:inline-flex"
          >
            Adhérez maintenant
          </Link>
        </div>
      </header>

      <section className="relative min-h-[70vh] overflow-hidden px-6 pb-28 pt-20 sm:px-12 lg:px-24" id="cours-gratuit">
        <div className="absolute inset-0">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/video_header.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.7)_45%,rgba(0,0,0,0.15)_75%,rgba(0,0,0,0)_100%)]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <h1 className="text-pretty text-4xl font-semibold tracking-tighter sm:text-5xl lg:text-6xl font-sans">
              L'élite ne naît pas,
              <span className="block">elle se forge.</span>
            </h1>
            <p className="text-lg text-[#EAEAEA]">
              Accédez à l'héritage des plus grands leaders.
              <span className="block">Ne vous contentez pas d'apprendre, devenez l'exception.</span>
            </p>
            <ul className="space-y-2 text-sm tracking-tight text-[#EAEAEA]">
              {[
                "En ligne & Immédiat",
                "Leçons en petits morceaux",
                "Open badge reconnu par les professionnels",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${accentGold}`} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/beyond-no-school/abonnement"
                className="inline-flex items-center justify-center rounded-2xl border border-[#C5A059] bg-black px-8 py-4 text-sm font-semibold tracking-tight text-white transition-all duration-200 hover:border-transparent hover:text-white hover:bg-[linear-gradient(135deg,#C5A059_0%,#8E6D31_100%)]"
              >
                S'inscrire - 30€/mois
              </Link>
              <Link
                href="/beyond-no-school/competences/marketing-sportif"
                className="inline-flex items-center justify-center rounded-2xl border border-[#C5A059] bg-black px-8 py-4 text-sm font-semibold tracking-tight text-white transition-all duration-200 hover:border-transparent hover:text-white hover:bg-[linear-gradient(135deg,#C5A059_0%,#8E6D31_100%)]"
              >
                Regarder un cours gratuit
              </Link>
            </div>
          </div>
          <div aria-hidden className="hidden lg:block" />
        </div>
      </section>

      <section className="relative bg-[#000000] px-6 pb-28 sm:px-12 lg:px-24" id="faculty">
        <div className="relative mx-auto max-w-6xl space-y-10">
          <h2 className="text-center text-2xl font-semibold tracking-tighter font-sans">
            Rencontrez vos intervenants
          </h2>
          <div className="relative">
            <button
              type="button"
              aria-label="Précédent"
              onClick={() => scrollInstructors("left")}
              className="absolute -left-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black text-white md:flex"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Suivant"
              onClick={() => scrollInstructors("right")}
              className="absolute -right-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black text-white md:flex"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
            <div
              ref={instructorsRef}
              className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory"
            >
            {[
              {
                name: "Philippe Corrot",
                role: "Ex directeur commercial",
                logo: "Nike",
                company: "NIKE",
                logoUrl:
                  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/png-clipart-angle-font-nike-angle-white-removebg-preview.png",
                logoClassName: "mix-blend-screen brightness-110",
                photoUrl:
                  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/PhilippeCorrot.jpg",
              },
              {
                name: "Antoine Verdier",
                role: "Community manager",
                logo: "FC Versailles",
                company: "FC VERSAILLES",
                logoUrl:
                  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/logo_fcv.png",
                photoUrl:
                  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/1738412961092.jpg",
              },
              {
                name: "Miguel Farina",
                role: "Head of sales",
                company: "OLYMPIQUE LYONNAIS",
                photoUrl:
                  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/Miguel%20OL.jpg",
                logoUrl:
                  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/stickers-ol.jpg",
                logoClassName: "grayscale brightness-0 invert",
                logo: "Olympique Lyonnais",
              },
              {
                name: "Richard Declaude",
                role: "Directeur commercial",
                company: "STADE RENNAIS FC",
                photoUrl:
                  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/Richard%20SR.jpg",
                logoUrl:
                  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/logo-srfc-blanc-v1.png",
                logo: "Stade Rennais Football Club",
              },
              {
                name: "Hugo Gilles",
                role: "Community Manager at Kerami",
                logo: "Kerami",
                company: "Kerami",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="group relative w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#121212] border border-[rgba(255,255,255,0.05)]"
              >
                <div className="relative h-[460px] w-full bg-[#121212]">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-cover object-center saturate-[0.8]"
                    />
                  ) : null}
                  <div
                    className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,1)_0%,rgba(0,0,0,0.7)_45%,rgba(0,0,0,0)_100%)]"
                  />
                  <div className="absolute bottom-5 left-5 right-5 z-10 space-y-2">
                    <div className="flex items-center gap-2">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.company ?? item.logo}
                          className={`h-12 w-12 object-contain ${item.logoClassName ?? ""}`}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-white/80" aria-hidden />
                      )}
                      <span className="text-xs font-semibold uppercase tracking-tighter text-white">
                        {item.company ?? item.logo}
                      </span>
                    </div>
                    <div className="h-px w-28 bg-white/30" />
                    <p className="text-2xl font-bold tracking-tighter text-white">{item.name}</p>
                    <p className="text-xs tracking-tighter text-gray-400">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-28 sm:px-12 lg:px-24" id="programme">
        <div className="mx-auto max-w-6xl space-y-12">
          <h2 className="text-2xl font-semibold tracking-tighter font-serif">Programme</h2>
          {[
            {
              title: "Insights du monde réel",
              copy: "Pas de théorie inutile. Des cas concrets, des décisions prises sur le terrain.",
            },
            {
              title: "Apprenez à votre rythme",
              copy: "Plateforme accessible 24/7, pensée pour avancer sans friction.",
            },
            {
              title: "Certifications digitales",
              copy: "Open Badges vérifiables et partageables sur LinkedIn.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className={`grid gap-8 rounded-3xl border border-[rgba(255,255,255,0.05)] bg-[#121212] p-8 lg:grid-cols-2 ${
                index % 2 === 0 ? "" : "lg:[direction:rtl]"
              }`}
            >
              <div className="h-52 rounded-2xl bg-[#121212]" />
              <div className="flex flex-col justify-center gap-4 lg:[direction:ltr]">
                <h3 className="text-xl font-semibold tracking-tighter">{item.title}</h3>
                <p className="text-sm text-[#EAEAEA]">{item.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-28 sm:px-12 lg:px-24" id="open-badge">
        <div className="mx-auto max-w-6xl space-y-6">
          <h2 className="text-2xl font-semibold tracking-tighter font-serif">Open badge</h2>
          <p className="max-w-2xl text-lg text-[#EAEAEA]">
            Chaque réussite est sécurisée par un badge numérique vérifiable, partageable et prêt à booster votre CV.
          </p>
        </div>
      </section>

      <section className="px-6 pb-28 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl space-y-8">
          <h2 className="text-2xl font-semibold tracking-tighter font-serif">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                question: "Est-ce que je peux annuler à tout moment ?",
                answer: "Oui, l'abonnement est sans engagement et annulable à tout moment.",
              },
              {
                question: "Les badges sont-ils reconnus ?",
                answer: "Chaque Open Badge est vérifiable et partageable sur LinkedIn.",
              },
              {
                question: "Combien de temps pour finir un asset ?",
                answer: "La plupart des assets se complètent en 4 à 8 semaines.",
              },
            ].map((item) => (
              <details key={item.question} className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#121212] p-6">
                <summary className="cursor-pointer text-sm font-semibold tracking-tight text-[#EAEAEA]">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-[#EAEAEA]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-28 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#C5A059]">
            <Link2 className={`h-5 w-5 ${accentGold}`} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tighter font-serif">
            Mettez votre savoir en valeur avec Beyond Connect
          </h2>
          <p className="mx-auto max-w-2xl text-[#EAEAEA]">
            Beyond Connect est le pont entre l'apprentissage et le réseau professionnel direct.
          </p>
        </div>
      </section>

      <section className="px-6 pb-28 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tighter font-serif">
              Vos soft skills visibles sur LinkedIn
            </h2>
            <p className="text-[#EAEAEA]">
              Ne vous contentez pas d'apprendre. Prouvez-le. Nos certifications sont nativement compatibles avec LinkedIn
              pour booster votre employabilité en un clic.
            </p>
          </div>
          <div className="rounded-3xl border border-[rgba(255,255,255,0.05)] bg-[#121212] p-6">
            <div className="space-y-4">
              <div className="h-6 w-32 rounded bg-white/10" />
              <div className="rounded-2xl border border-[rgba(255,255,255,0.05)] bg-[#121212] p-5 shadow-[0_0_60px_rgba(197,160,89,0.1)]">
                <p className="text-xs tracking-tight text-[#EAEAEA]">Licences et certifications</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded bg-white/10" />
                  <div>
                    <p className="text-sm font-semibold tracking-tight text-[#EAEAEA]">Open Badge Beyond</p>
                    <p className="text-xs tracking-tight text-[#EAEAEA]">BEYOND CENTER</p>
                  </div>
                </div>
              </div>
              <div className="h-4 w-48 rounded bg-white/10" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-40 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-6xl flex justify-center">
          <Link
            href="/beyond-no-school/abonnement"
            className="inline-flex items-center justify-center rounded-2xl border border-[#C5A059] bg-black px-10 py-4 text-base font-semibold tracking-tight text-white transition-all duration-200 hover:border-transparent hover:text-white hover:bg-[linear-gradient(135deg,#C5A059_0%,#8E6D31_100%)]"
          >
            Adhérez maintenant
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-xs tracking-tight text-[#EAEAEA] sm:px-12 lg:px-24">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <span>BEYOND CENTER - La Plateforme d'Élite</span>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-white">
              CGV
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
