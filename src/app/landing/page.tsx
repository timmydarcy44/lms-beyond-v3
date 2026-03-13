"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ProductKey = "education" | "business" | "club";

export default function LandingPage() {
  const [hoveredProduct, setHoveredProduct] = useState<ProductKey>("business");
  const [activeProduct, setActiveProduct] = useState(0);
  const [manualSelect, setManualSelect] = useState(false);
  const router = useRouter();
  const imgFilters = [
    "brightness(1.05) saturate(1.4) contrast(1.05)",
    "brightness(1.1) saturate(1.3) contrast(1.0)",
    "brightness(1.0) saturate(1.6) contrast(1.1)",
  ];
  const productTints = [
    "rgba(255, 140, 50, 0.08)",
    "rgba(50, 180, 255, 0.08)",
    "rgba(80, 200, 100, 0.10)",
  ];
  const productAccents = [
    { border: "rgba(255,160,50,0.25)", dot: "#FF9B20" },
    { border: "rgba(50,180,255,0.25)", dot: "#32B4FF" },
    { border: "rgba(80,220,100,0.25)", dot: "#50DC64" },
  ];
  const heroProducts = [
    {
      id: "business",
      label: "For Business",
      desc: "Matching RH · Soft Skills · Talent Radar",
      tags: ["Matching DISC", "Certification", "Talent Radar", "Détection burnout"],
      image:
        "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1200&q=90",
      cta: "/for-business",
    },
    {
      id: "education",
      label: "For Education",
      desc: "DISC · Alternance · DYS · LMS",
      tags: ["Profiling DISC", "Suivi alternance", "Module DYS", "LMS adaptatif"],
      image:
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=90",
      cta: "/for-education",
    },
    {
      id: "club",
      label: "For Club",
      desc: "CRM · ROI · DNCG · Partenaires",
      tags: ["CRM partenaires", "ROI automatique", "Rapport DNCG", "Espace partenaire"],
      image:
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=90",
      cta: "/for-club",
    },
  ];
  const heroWords = [
    { word: "l'intuition.", color: "text-white" },
    { word: "l'approximatif.", color: "text-white" },
    { word: "le hasard.", color: "text-white" },
  ];
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % heroWords.length);
        setFade(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, [heroWords.length]);

  useEffect(() => {
    if (manualSelect) return undefined;
    const t = setInterval(() => {
      setActiveProduct((i) => (i + 1) % 3);
    }, 4000);
    return () => clearInterval(t);
  }, [manualSelect]);

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}
    >
      <div className="bg-black px-6 py-1 text-right text-xs text-white/30">
        <Link href="/dashboard/apprenant" className="transition hover:text-white/60">
          Je suis un particulier →
        </Link>
      </div>

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/10 px-6 lg:px-12 h-14 flex items-center justify-between">
        <span
          style={{
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          }}
        >
          <span className="text-xl font-bold text-white">B</span>
          <span className="text-xl font-light text-white">eyond</span>
        </span>

        <nav className="hidden items-center text-sm text-white/70 md:flex">
          <Link href="/for-business" className="hover:text-white">
            For Business
          </Link>
          <span className="mx-3 text-white/20">|</span>
          <Link href="/for-education" className="hover:text-white">
            For Education
          </Link>
          <span className="mx-3 text-white/20">|</span>
          <Link href="/for-club" className="hover:text-white">
            For Club
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-white/70 hover:text-white">
            Se connecter
          </Link>
          <Link
            href="/demo"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Demander une démo →
          </Link>
        </div>
      </header>

      <section className="relative h-screen min-h-[600px] flex overflow-hidden bg-black">
        <div className="relative z-10 w-full lg:w-[45%] flex-shrink-0 flex flex-col justify-center px-8 lg:px-16 py-20">
          <p
            className="text-[11px] uppercase tracking-[0.35em] text-white/30 mb-10"
            style={{ fontFamily: "-apple-system, 'SF Pro Display', sans-serif" }}
          >
            Beyond — Suite psychométrique
          </p>
          <h1
            className="text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.02] tracking-tight mb-8"
            style={{ fontFamily: "-apple-system, 'SF Pro Display', sans-serif" }}
          >
            Allons au-delà
            <br />
            de l'intuition.
          </h1>
          <p className="text-white/45 text-base lg:text-lg font-light leading-relaxed max-w-sm mb-12">
            Prendre les meilleures décisions n'a jamais été aussi simple.
          </p>

          <div className="flex flex-col gap-1 mb-12">
            {heroProducts.map((p, i) => (
              <button
                key={p.id}
                onClick={() => {
                  setActiveProduct(i);
                  setManualSelect(true);
                }}
                className="group text-left transition-all duration-300 rounded-xl px-4 py-3 border-l-2"
                style={{
                  borderLeftColor: activeProduct === i ? "#fff" : "transparent",
                  background: activeProduct === i ? "rgba(255,255,255,0.07)" : "transparent",
                }}
              >
                <div
                  className="flex items-center gap-3 transition-all duration-300"
                  style={{
                    color: activeProduct === i ? "#fff" : "rgba(255,255,255,0.28)",
                    fontWeight: activeProduct === i ? 700 : 400,
                    fontSize: 17,
                    fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
                  }}
                >
                  {p.label}
                  {activeProduct === i && (
                    <span className="text-white/30 text-xs font-normal animate-fadeIn">
                      →
                    </span>
                  )}
                </div>

                <div
                  className="overflow-hidden transition-all duration-500"
                  style={{
                    maxHeight: activeProduct === i ? 60 : 0,
                    opacity: activeProduct === i ? 1 : 0,
                    marginTop: activeProduct === i ? 8 : 0,
                  }}
                >
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] bg-white/10 text-white/60 rounded-full px-2.5 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => router.push("/demo")}
              className="bg-white text-black font-semibold text-sm px-7 py-3.5 rounded-full hover:bg-white/90 transition-all duration-200 shadow-lg shadow-black/30"
            >
              Demander une démo →
            </button>
            <button className="text-white/50 hover:text-white text-sm border border-white/15 hover:border-white/30 px-7 py-3.5 rounded-full transition-all duration-200 backdrop-blur-sm bg-white/5">
              Voir les produits
            </button>
          </div>

          {!manualSelect && (
            <div className="mt-8 flex gap-2">
              {heroProducts.map((_, i) => (
                <div key={i} className="h-0.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/50 rounded-full"
                    style={{
                      width: activeProduct === i ? "100%" : "0%",
                      transition: activeProduct === i ? "width 4s linear" : "none",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[58%]">
          <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-black to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-40 z-10 bg-gradient-to-t from-black/60 to-transparent" />

          {heroProducts.map((p, i) => (
            <img
              key={p.id}
              src={p.image}
              alt={p.label}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: activeProduct === i ? 1 : 0,
                transition: "opacity 0.9s ease",
                filter: imgFilters[i],
              }}
            />
          ))}

          <div
            className="absolute inset-0 z-[5] transition-all duration-700 pointer-events-none"
            style={{ background: productTints[activeProduct] }}
          />

          <div
            className="absolute bottom-10 right-10 z-20 bg-black/60 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-2xl"
            style={{ border: `1px solid ${productAccents[activeProduct].border}` }}
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/35 mb-1.5">
              Sélectionné
            </div>
            <div
              className="text-white font-bold text-base flex items-center"
              style={{ fontFamily: "-apple-system, 'SF Pro Display', sans-serif" }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mr-2"
                style={{
                  background: productAccents[activeProduct].dot,
                  boxShadow: `0 0 8px ${productAccents[activeProduct].dot}`,
                }}
              />
              {heroProducts[activeProduct].label}
            </div>
            <div className="text-white/40 text-xs mt-1">
              {heroProducts[activeProduct].desc}
            </div>
          </div>
        </div>

        <div className="lg:hidden absolute inset-0 -z-0">
          {heroProducts.map((p, i) => (
            <img
              key={p.id}
              src={p.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                opacity: activeProduct === i ? 0.25 : 0,
                transition: "opacity 0.9s ease",
              }}
            />
          ))}
          <div className="absolute inset-0 bg-black/70" />
        </div>
      </section>

      <section className="bg-white px-6 py-32 text-center lg:px-24 lg:py-40">
        <div className="w-12 h-0.5 bg-black mx-auto mb-8" />
        <h2 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-black lg:text-6xl">
          La data au service de l'humain,
          <br />
          des connexions
          <br />
          et du développement.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base font-light text-black/50">
          Beyond transforme les données comportementales en décisions concrètes —
          pour former, recruter et développer avec précision.
        </p>
      </section>

      <section className="bg-black px-6 py-24 lg:px-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/30">
              Formation & Développement
            </div>
            <h2 className="text-4xl font-bold leading-tight text-white lg:text-6xl">
              Développer
              <br />
              les compétences.
            </h2>
            <p className="mt-3 text-xl font-light text-white/40">
              Augmenter votre croissance.
            </p>
            <p className="mt-6 max-w-md text-base text-white/60 leading-relaxed">
              Identifiez les besoins réels de vos équipes grâce au profiling
              psychométrique. Construisez des parcours qui correspondent aux profils
              cognitifs de chacun.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-block text-sm text-white/60 underline underline-offset-4 hover:text-white"
            >
              En savoir plus →
            </Link>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=90"
              alt="Formation équipe"
              className="h-full w-full object-cover"
              style={{
                filter: "brightness(1.05) saturate(1.3)",
                borderRadius: "16px",
              }}
            />
          </div>
        </div>
      </section>

      <div className="h-px bg-white/8 mx-12 lg:mx-24" />

      <section className="border-t border-white/5 bg-[#0a0a0a] px-6 py-24 lg:px-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/header_entreprise%20(2).png"
              alt="Beyond for Business"
              className="w-full h-full object-cover"
              style={{ maxHeight: "440px", objectPosition: "center" }}
            />
          </div>
          <div>
            <div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/30">
              Club · École · Entreprise
            </div>
            <h2 className="text-4xl font-bold leading-tight text-white lg:text-6xl">
              Certifier
              <br />
              les compétences.
            </h2>
            <p className="mt-3 text-xl font-light text-white/40">
              Avec l'Open Badge.
            </p>
            <p className="mt-6 max-w-md text-base text-white/60 leading-relaxed">
              Délivrez des certifications numériques reconnues et vérifiables. Chaque
              badge atteste d'une compétence réelle, validée par Beyond.
            </p>
            <p className="mt-6 max-w-md text-base text-white/60 leading-relaxed">
              Standard mondial IMS Global — accepté par LinkedIn, Indeed et tous les
              grands ATS.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-block text-sm text-white/60 underline underline-offset-4 hover:text-white"
            >
              Découvrir les badges →
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-32 px-6 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <p className="text-xs uppercase tracking-[0.4em] text-black/30 mb-4">
              La suite Beyond
            </p>
            <h2 className="text-5xl lg:text-7xl font-black text-black leading-none tracking-tight">
              Une plateforme.
              <br />
              <span className="text-black/20">Trois univers.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-[40%_60%]">
            <div className="flex flex-col justify-center">
              {[
                {
                  key: "business",
                  label: "For Business",
                  index: "01",
                  description: "Pour les équipes RH et managers",
                  tags: [
                    "Matching DISC",
                    "Certification soft skills",
                    "Talent Radar",
                    "Détection burnout",
                  ],
                  ctaLabel: "Explorer Beyond for Business →",
                  ctaHref: "/for-business",
                },
                {
                  key: "education",
                  label: "For Education",
                  index: "02",
                  description: "Pour les CFAs et organismes de formation",
                  tags: [
                    "Profiling DISC",
                    "Suivi alternance",
                    "Module DYS",
                    "LMS adaptatif",
                  ],
                  ctaLabel: "Explorer Beyond for Education →",
                  ctaHref: "/for-education",
                },
                {
                  key: "club",
                  label: "For Club",
                  index: "03",
                  description: "Pour les clubs sportifs",
                  tags: [
                    "CRM partenaires",
                    "ROI automatique",
                    "Rapport DNCG",
                    "Espace partenaire",
                  ],
                  ctaLabel: "Explorer Beyond Network →",
                  ctaHref: "/for-club",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  id={item.key}
                  onMouseEnter={() => setHoveredProduct(item.key as ProductKey)}
                  className="cursor-pointer py-7 border-b border-black/10 transition-all duration-300"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="text-xs text-black/20 tracking-widest w-6 flex-shrink-0">
                      {item.index}
                    </span>
                    <div className="flex-1">
                      <span
                        className={`text-5xl lg:text-6xl tracking-tight leading-none transition-all duration-300 ${
                          hoveredProduct === item.key
                            ? "font-black text-black"
                            : "font-light text-black/25"
                        }`}
                      >
                        {item.label}
                      </span>
                      <div
                        className={`overflow-hidden transition-all duration-500 ${
                          hoveredProduct === item.key
                            ? "max-h-32 opacity-100 mt-4"
                            : "max-h-0 opacity-0 mt-0"
                        }`}
                      >
                        <p className="text-sm text-black/50 mb-3">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-black text-white px-3 py-1.5 rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={item.ctaHref}
                          className="mt-4 inline-block text-sm text-black font-semibold underline underline-offset-4 hover:opacity-60 transition-all"
                        >
                          {item.ctaLabel}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky top-0 h-screen flex items-center">
              <div className="relative w-full h-[600px] rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&q=90"
                  alt="Business"
                  className={`w-full h-[600px] object-cover rounded-2xl absolute inset-0 transition-opacity duration-500 ${
                    hoveredProduct === "business" ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    filter: "brightness(1.05) saturate(1.4) contrast(1.05)",
                  }}
                />
                <img
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&q=90"
                  alt="Education"
                  className={`w-full h-[600px] object-cover rounded-2xl absolute inset-0 transition-opacity duration-500 ${
                    hoveredProduct === "education" ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    filter: "brightness(1.1) saturate(1.3)",
                  }}
                />
                <img
                  src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=90"
                  alt="Club"
                  className={`w-full h-[600px] object-cover rounded-2xl absolute inset-0 transition-opacity duration-500 ${
                    hoveredProduct === "club" ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    filter: "brightness(1.0) saturate(1.6) contrast(1.1)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black px-6 py-16 text-center">
        <div className="mb-8 text-xs uppercase tracking-[0.3em] text-white/20">
          Ils nous font confiance
        </div>
        <div className="text-white/20 font-light italic text-base">
          Soyez parmi les premiers.
        </div>
      </section>

      <section className="border-t border-white/10 bg-black px-6 py-24 text-center">
        <h2 className="mb-6 text-4xl font-bold text-white lg:text-6xl">
          Prêt à aller
          <br />
          au-delà ?
        </h2>
        <p className="mb-12 text-lg font-light text-white/40">
          Rejoignez les organisations qui décident avec Beyond.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => router.push("/demo")}
            className="rounded-full bg-white px-8 py-4 font-semibold text-black hover:bg-white/90"
          >
            Demander une démo
          </button>
          <button className="rounded-full border border-white/20 px-8 py-4 text-white/70 transition-all hover:border-white/40 hover:text-white">
            Nous écrire
          </button>
        </div>
        <div className="mt-8 text-sm text-white/20">contact@beyondcenter.fr</div>
      </section>

      <footer className="border-t border-white/10 bg-black px-6 py-24 lg:px-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-4">
          <div>
            <span
              style={{
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
              }}
            >
              <span className="text-xl font-bold text-white">B</span>
              <span className="text-xl font-light text-white">eyond</span>
            </span>
            <p className="mt-3 text-sm text-white/40">
              La suite data-driven pour
              <br />
              piloter les talents.
            </p>
            <div className="mt-8 text-xs text-white/20">
              Mentions légales · CGU · RGPD
            </div>
          </div>
          <div>
            <div className="mb-4 text-xs uppercase tracking-widest text-white/30">
              Produits
            </div>
            <div className="space-y-3 text-sm text-white/50">
              <div className="hover:text-white">Beyond for Business</div>
              <div className="hover:text-white">Beyond for Education</div>
              <div className="hover:text-white">Beyond Network</div>
              <div className="hover:text-white">Particuliers</div>
            </div>
          </div>
          <div>
            <div className="mb-4 text-xs uppercase tracking-widest text-white/30">
              Ressources
            </div>
            <div className="space-y-3 text-sm text-white/50">
              <div className="hover:text-white">Documentation</div>
              <div className="hover:text-white">Blog</div>
              <div className="hover:text-white">Cas clients</div>
              <div className="hover:text-white">API</div>
            </div>
          </div>
          <div>
            <div className="mb-4 text-xs uppercase tracking-widest text-white/30">
              Contact
            </div>
            <div className="space-y-3 text-sm text-white/50">
              <div>contact@beyondcenter.fr</div>
              <div>getbeyond.fr</div>
              <div>LinkedIn</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/8 mt-16 pt-8 text-center text-white/20 text-xs">
          © 2026 Beyond · Fait avec ❤️ en Normandie
        </div>
      </footer>
    </div>
  );
}
