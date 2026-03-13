"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PainCard from "@/components/landing/pain-card";

const ACCENT = "#32B4FF";
const ACCENT_LIGHT = "rgba(50,180,255,0.08)";
const ACCENT_BORDER = "rgba(50,180,255,0.22)";

const pains = [
  {
    icon: "📋",
    before: "Vous suivez vos apprenants en alternance sur Excel",
    after:
      "Un dashboard unique connecte formateur, tuteur entreprise et apprenant. Tout est visible, rien ne se perd.",
  },
  {
    icon: "🔍",
    before: "Vous cherchez l'OPCO de chaque entreprise partenaire à la main",
    after:
      "L'OPCO est automatiquement identifié et intégré dès la création du dossier. Zéro recherche manuelle.",
  },
  {
    icon: "🎲",
    before: "Vous placez vos apprenants dans les entreprises un peu au hasard",
    after:
      "Le matching DISC aligne le profil de l'apprenant avec la culture de l'entreprise. Les binômes fonctionnent mieux.",
  },
  {
    icon: "🚨",
    before: "Vous découvrez le décrochage quand il est trop tard pour agir",
    after:
      "Les signaux faibles sont détectés automatiquement. Le formateur reçoit une alerte avant que la situation se dégrade.",
  },
  {
    icon: "📞",
    before: "Vous relancez manuellement chaque tuteur entreprise",
    after:
      "Chaque tuteur a son espace dédié avec ses missions, ses évaluations et ses rappels automatiques.",
  },
  {
    icon: "📄",
    before: "Préparer un bilan pédagogique vous prend une journée entière",
    after:
      "Export OPCO et bilan Qualiopi générés en un clic. Les données sont déjà là, propres et structurées.",
  },
];

const features = [
  {
    icon: "🧠",
    title: "Profiling DISC",
    desc:
      "En 15 minutes, chaque apprenant découvre son style comportemental. Le formateur reçoit une fiche de préconisations pédagogiques adaptée. Pas de jargon — des actions concrètes.",
  },
  {
    icon: "♿",
    title: "Module accessibilité DYS",
    desc:
      "Beyond détecte automatiquement les besoins spécifiques lors du profiling. L'interface s'adapte : police, espacement, couleurs, rythme. Conforme RGAA.",
  },
  {
    icon: "🤝",
    title: "Triptyque connecté",
    desc:
      "Apprenant, formateur, tuteur entreprise — les trois acteurs sur une seule plateforme. Chacun voit ce qui le concerne. Rien de plus, rien de moins.",
  },
];

export default function ForEducation() {
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
            For Education
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
            Beyond for Education
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
            Chaque apprenant
            <br />
            est unique.
            <br />
            Enfin un outil
            <br />
            qui le sait.
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
            Profiling psychométrique, suivi d'alternance et détection DYS — conçu pour
            les CFAs qui veulent aller plus loin que la conformité.
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
            {["DISC en 15 min", "Qualiopi ready", "Module DYS"].map((tag) => (
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
            ))}
          </div>
        </div>

        <div style={{ flex: 1, maxWidth: 520 }}>
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&q=90"
            alt="Beyond for Education"
            style={{
              width: "100%",
              height: 500,
              objectFit: "cover",
              borderRadius: 20,
              filter: "brightness(1.1) saturate(1.3)",
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
          +87%
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
          de taux de complétion des parcours de formation sur le LMS neuro-adaptatif
          Beyond
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
          Prêt à transformer votre CFA ?
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
          Demandez une démo de 30 minutes. On vous montre le profiling et le suivi
          alternance en direct.
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
