import { LandingShell } from "@/components/beyond-no-school/landing-shell";

export default function OpenBadgePage() {
  return (
    <LandingShell>
      <section className="section">
        <div className="container">
          <h1 className="section-title">Open Badge</h1>
          <p className="section-note">
            Des preuves de soft skills co-construites avec des experts de la performance, partageables et valorisables
            partout.
          </p>
          <div className="badge-grid" style={{ marginTop: 32 }}>
            {[
              "Négociation d&apos;affaires",
              "Posture professionnelle",
              "Gestion de projet",
              "Marketing sportif",
              "Analyse comportementale",
              "Intelligence artificielle",
            ].map((item) => (
              <div key={item} className="badge">
                <div className="badge-icon" />
                <h3>{item}</h3>
                <p className="section-note">Compétence validée par la réalité du terrain.</p>
              </div>
            ))}
          </div>
          <div className="financement-grid" style={{ marginTop: 32 }}>
            <div className="financement-card">
              <h3>Valeur immédiate</h3>
              <p className="section-note">
                Un badge = une preuve lisible pour les recruteurs, partageable sur LinkedIn et vos CV.
              </p>
            </div>
            <div className="financement-card alt">
              <h3>Différenciation</h3>
              <p>
                Au-delà du diplôme, un portefeuille de soft skills concrètes qui crédibilise votre profil.
              </p>
            </div>
          </div>
          <a href="/beyond-no-school/open-badges" className="cta" style={{ display: "inline-block", marginTop: 28 }}>
            DÉCOUVRIR LES BADGES
          </a>
        </div>
      </section>
    </LandingShell>
  );
}
