"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PainCard from "@/components/landing/pain-card";

const ACCENT = "#50DC64";
const ACCENT_LIGHT = "rgba(80,220,100,0.08)";
const ACCENT_BORDER = "rgba(80,220,100,0.22)";

const pains = [
  {
    icon: "📊",
    before: "Vos partenaires sont gérés sur un fichier Excel que personne ne tient à jour",
    after:
      "Un CRM kanban visuel. Chaque partenaire avance dans votre pipeline. Le CA prévisionnel se met à jour automatiquement.",
  },
  {
    icon: "🗓️",
    before: "Vous oubliez de relancer vos partenaires en fin de saison",
    after:
      "Les alertes de renouvellement sont automatiques. Aucun contrat ne passe entre les mailles du filet.",
  },
  {
    icon: "🛡️",
    before: "Vous préparez votre dossier DNCG en urgence chaque printemps",
    after:
      "Le rapport DNCG se construit tout au long de l'année. Score de préparation en temps réel. Zéro stress le jour J.",
  },
  {
    icon: "🧮",
    before: "Vous ne savez pas vraiment combien vaut votre visibilité pour vos partenaires",
    after:
      "La valorisation IREP est calculée automatiquement pour chaque activation. Panneau, réseaux, billetterie — tout est valorisé.",
  },
  {
    icon: "🎯",
    before: "Vos partenaires ne savent plus vraiment pourquoi ils vous sponsorisent",
    after:
      "Chaque partenaire a son espace dédié : actualités du club, classement live FFF, et son ROI personnel visible à tout moment.",
  },
  {
    icon: "📈",
    before: "Vous prospectez sans méthode et sans savoir où vous en êtes",
    after:
      "Pipeline de prospection visuel. Vous voyez en un coup d'œil qui relancer, qui closer, et combien ça représente.",
  },
];

const features = [
  {
    icon: "💼",
    title: "CRM Partenaires",
    desc:
      "Du premier contact à la signature, chaque étape est tracée. Glissez les partenaires dans votre pipeline. Générez les contrats en PDF directement depuis Beyond.",
  },
  {
    icon: "🛡️",
    title: "Rapport DNCG assisté",
    desc:
      "Renseignez votre bilan financier, vos effectifs et vos conventions tout au long de l'année. Beyond calcule votre score de préparation DNCG en temps réel et génère le dossier complet.",
  },
  {
    icon: "🌐",
    title: "Espace partenaire white-label",
    desc:
      "Chaque partenaire reçoit un accès personnalisé : fil d'actu du club, classement N3 en temps réel, ROI calculé. Ils voient la valeur — ils renouvellent.",
  },
];

export default function ForClub() {
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
            For Club
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
            Beyond for Club
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
            Vos partenaires
            <br />
            méritent mieux
            <br />
            qu&apos;un tableau Excel.
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
            CRM partenaires, calcul ROI automatique et préparation DNCG pour les clubs
            sportifs qui veulent professionnaliser leur modèle économique.
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
            {["ROI IREP calculé", "Rapport DNCG", "Espace partenaire"].map((tag) => (
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
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=90"
            alt="Beyond for Club"
            style={{
              width: "100%",
              height: 500,
              objectFit: "cover",
              borderRadius: 20,
              filter: "brightness(1.0) saturate(1.6) contrast(1.1)",
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
          3 000€
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
          c&apos;est ce que rapporte en moyenne le premier nouveau partenariat signé grâce
          au CRM Beyond Network
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
          Prêt à professionnaliser votre club ?
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
          Demandez une démo de 30 minutes. On vous montre le CRM et le ROI partenaire
          en live.
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
