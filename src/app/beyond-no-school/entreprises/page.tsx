import { LandingShell } from "@/components/beyond-no-school/landing-shell";

export default function EntreprisesPage() {
  return (
    <LandingShell>
      <div className="premium-scope">
        <section className="enterprise-hero" aria-label="Header entreprises">
          <div className="enterprise-hero-text">
            <div className="enterprise-hero-text-inner enterprise-hero-glow">
              <h1 className="section-title">Recrutez des profils préparés à l&apos;exigence du terrain.</h1>
              <p className="section-note" style={{ marginTop: 16 }}>
                Sécurisez vos recrutements avec des alternants dont les soft skills sont validées par le terrain et la
                performance mentale optimisée par nos experts.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
                <a href="/beyond-no-school/checkout" className="cta">
                  Prendre contact avec un conseiller
                </a>
                <a href="/beyond-connect/creer-espace" className="cta cta-outline">
                  Déposer une offre sur Beyond Connect
                </a>
              </div>
            </div>
          </div>
          <div className="enterprise-hero-media">
            <img
              className="enterprise-hero-image"
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Center/header_entreprise%20(2).png"
              alt="Beyond No School - Entreprises"
            />
          </div>
        </section>
        <section className="section">
          <div className="container">
            <p className="section-note">
              Des alternants préparés mentalement à l&apos;exigence du terrain pour sécuriser intégration, performance et
              stabilité en entreprise.
            </p>
          <div className="comparison" style={{ marginTop: 32 }}>
            {[
              "Profils orientés résultats",
              "Soft skills opérationnelles",
              "Stabilité et posture pro",
            ].map((item) => (
              <div key={item} className="comparison-card comparison-classic">
                {item}
              </div>
            ))}
          </div>
          <div className="financement-grid" style={{ marginTop: 32 }}>
            <div className="financement-card">
              <h3>Être rappelé par un consultant</h3>
              <p className="section-note">
                Un échange rapide pour cadrer votre besoin, le rythme d&apos;alternance et le profil recherché.
              </p>
              <a href="/beyond-no-school/checkout" className="cta" style={{ marginTop: 18 }}>
                ÊTRE RAPPELÉ
              </a>
            </div>
            <div className="financement-card alt">
              <h3>Créer mon offre</h3>
              <p>
                Créez votre offre et détaillez vos attentes : missions, objectifs, soft skills prioritaires, culture
                d&apos;équipe et critères de réussite pour l&apos;alternant.
              </p>
              <p className="section-note" style={{ marginTop: 12 }}>
                Après création du compte, vous serez redirigé vers Beyond Connect.
              </p>
              <a href="/beyond-connect" className="cta" style={{ marginTop: 18 }}>
                CRÉER MON OFFRE
              </a>
            </div>
          </div>
          <div style={{ marginTop: 40 }}>
            <h2 className="section-title">Processus de recrutement Beyond</h2>
            <div className="process" style={{ marginTop: 24 }}>
              {[
                "Réception des dossiers",
                "Entretien",
                "Décision sur l'intégration de l'apprenant",
                "Test des soft skills",
                "Matching de compatibilité via Beyond Connect",
                "Proposition",
              ].map((item, index) => (
                <div key={item} className="process-card">
                  <div className="process-step">{String(index + 1).padStart(2, "0")}</div>
                  <p className="section-note">{item}</p>
                </div>
              ))}
            </div>
          </div>
          </div>
        </section>
      </div>
    </LandingShell>
  );
}
