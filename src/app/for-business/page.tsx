"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PainCard from "@/components/landing/pain-card";

const ACCENT = "#FF9B20";
const ACCENT_LIGHT = "rgba(255,155,32,0.08)";
const ACCENT_BORDER = "rgba(255,155,32,0.22)";

const pains = [
  {
    icon: "🎲",
    before: "Vous recrutez à l'instinct et vous le regrettez parfois",
    after:
      "Le matching DISC compare chaque candidat au profil réel de votre équipe. Fini les erreurs de casting coûteuses.",
  },
  {
    icon: "👋",
    before: "Vos nouvelles recrues partent dans les 6 premiers mois",
    after:
      "L'onboarding est personnalisé selon le profil cognitif de chaque recrue. L'intégration culturelle se fait naturellement.",
  },
  {
    icon: "😶",
    before: "Vous découvrez le burnout après la démission",
    after:
      "Les signaux faibles de désengagement sont détectés automatiquement. Alerte RH confidentielle avant la rupture.",
  },
  {
    icon: "📝",
    before: "Les soft skills sur un CV, vous n'y croyez plus vraiment",
    after:
      "Chaque collaborateur obtient un score certifié Open Badge, vérifiable par n'importe quel recruteur.",
  },
  {
    icon: "🔭",
    before: "Vous ne savez pas qui dans votre équipe peut vraiment évoluer",
    after:
      "Le Talent Radar visualise les forces et potentiels cachés de chaque collaborateur. Décidez avec des données.",
  },
  {
    icon: "🎓",
    before: "Vos budgets formation partent dans des sessions qui ne changent rien",
    after:
      "Les recommandations de formation sont basées sur les gaps détectés dans les profils. Chaque euro est ciblé.",
  },
];

const features = [
  {
    icon: "🎯",
    title: "Matching comportemental DISC",
    desc:
      "En 15 minutes, votre candidat complète le profil DISC Beyond. Notre algorithme le compare instantanément aux profils de votre équipe et génère un score de compatibilité culturelle. Pas une opinion — une mesure.",
  },
  {
    icon: "📊",
    title: "Talent Radar",
    desc:
      "Visualisez votre capital humain en un coup d'œil. Forces collectives, angles morts, potentiels sous-exploités — tout est là, en temps réel. Prenez des décisions de mobilité interne avec des données.",
  },
  {
    icon: "🏅",
    title: "Open Badge certifié",
    desc:
      "Chaque soft skill évalué génère un badge numérique certifié IMS Global. Vos collaborateurs peuvent le partager sur LinkedIn. Vous pouvez le vérifier en un clic. La preuve de compétence, enfin fiable.",
  },
];

export default function ForBusiness() {
  const router = useRouter();

  return (
    <div
      style={{
        background: "#060608",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(6,6,8,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
        }}
      >
        <Link
          href="/landing"
          style={{
            textDecoration: "none",
            fontSize: 18,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.02em",
          }}
        >
          Beyond
        </Link>
        <Link
          href="/landing"
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
        >
          ← Tous les produits
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#000",
              background: ACCENT,
              borderRadius: 50,
              padding: "4px 12px",
              letterSpacing: "0.05em",
            }}
          >
            For Business
          </span>
          <button
            onClick={() => router.push("/demo")}
            style={{
              background: ACCENT,
              color: "#000",
              border: "none",
              borderRadius: 50,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Demander une démo →
          </button>
        </div>
      </nav>

      <section
        style={{
          minHeight: "85vh",
          display: "flex",
          alignItems: "center",
          padding: "80px 40px",
          maxWidth: 1200,
          margin: "0 auto",
          gap: 64,
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.35em",
              color: ACCENT,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            Beyond for Business
          </p>
          <h1
            style={{
              fontSize: "clamp(44px, 6vw, 80px)",
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              margin: "0 0 24px",
            }}
          >
            Recrutez juste.
            <br />
            Développez mieux.
            <br />
            <span style={{ color: "rgba(255,255,255,0.25)" }}>
              Retenez longtemps.
            </span>
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.45)",
              fontWeight: 300,
              lineHeight: 1.7,
              maxWidth: 440,
              marginBottom: 40,
            }}
          >
            Le matching comportemental et la certification des soft skills pour des
            décisions RH qui ne doivent plus rien au hasard.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
            <button
              onClick={() => router.push("/demo")}
              style={{
                background: ACCENT,
                color: "#000",
                border: "none",
                borderRadius: 50,
                padding: "14px 32px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: `0 8px 32px ${ACCENT}45`,
              }}
            >
              Demander une démo →
            </button>
            <a
              href="#features"
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 14,
                alignSelf: "center",
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              Voir les fonctionnalités ↓
            </a>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["DISC + 16 profils", "Open Badge certifié", "Détection burnout"].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 50,
                    padding: "6px 14px",
                  }}
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 520 }}>
          <img
            src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=900&q=90"
            alt="Beyond for Business"
            style={{
              width: "100%",
              height: 500,
              objectFit: "cover",
              borderRadius: 20,
              filter: "brightness(1.05) saturate(1.3)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          />
        </div>
      </section>

      <section
        style={{
          background: "#080808",
          padding: "96px 40px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 900,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            Vous reconnaissez-vous ?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 15, marginBottom: 52 }}>
            Cliquez sur chaque situation pour voir comment Beyond la résout.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            {pains.map((p, i) => (
              <PainCard
                key={i}
                {...p}
                accentColor={ACCENT}
                accentLight={ACCENT_LIGHT}
                accentBorder={ACCENT_BORDER}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        style={{ padding: "96px 40px", borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 3.5vw, 44px)",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: 56,
              letterSpacing: "-0.02em",
            }}
          >
            Ce que Beyond fait concrètement
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 20,
                  padding: "32px",
                  display: "flex",
                  gap: 28,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    background: ACCENT_LIGHT,
                    border: `1px solid ${ACCENT_BORDER}`,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 15,
                      lineHeight: 1.7,
                      fontWeight: 300,
                    }}
                  >
                    {f.desc}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 14,
                      fontSize: 11,
                      fontWeight: 700,
                      color: ACCENT,
                      background: ACCENT_LIGHT,
                      border: `1px solid ${ACCENT_BORDER}`,
                      borderRadius: 50,
                      padding: "4px 12px",
                    }}
                  >
                    Disponible maintenant
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          background: "#080808",
          padding: "80px 40px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            fontSize: "clamp(72px, 12vw, 120px)",
            fontWeight: 900,
            color: ACCENT,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          −42%
        </div>
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 17,
            maxWidth: 420,
            margin: "20px auto 0",
            lineHeight: 1.6,
            fontWeight: 300,
          }}
        >
          de turnover observé chez les entreprises qui recrutent avec le matching
          DISC Beyond
        </p>
      </section>

      <section style={{ padding: "96px 40px", textAlign: "center" }}>
        <h2
          style={{
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 900,
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          Prêt à recruter autrement ?
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 16,
            maxWidth: 420,
            margin: "0 auto 40px",
            lineHeight: 1.6,
            fontWeight: 300,
          }}
        >
          Demandez une démo de 30 minutes. On vous montre le matching en live avec
          vos propres critères.
        </p>
        <button
          onClick={() => router.push("/demo")}
          style={{
            background: ACCENT,
            color: "#000",
            border: "none",
            borderRadius: 50,
            padding: "16px 40px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 8px 40px ${ACCENT}45`,
          }}
        >
          Demander une démo →
        </button>
        <div style={{ marginTop: 20, fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
          contact@beyondcenter.fr
        </div>
      </section>

      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { label: "For Business", href: "/for-business" },
            { label: "For Education", href: "/for-education" },
            { label: "For Club", href: "/for-club" },
            { label: "Accueil", href: "/landing" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>
          © 2026 Beyond · contact@beyondcenter.fr
        </div>
      </footer>
    </div>
  );
}
