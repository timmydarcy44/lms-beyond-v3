import { LandingShell } from "@/components/beyond-no-school/landing-shell";

export default function AlternancePage() {
  return (
    <LandingShell>
      <section className="section">
        <div className="container">
          <h1 className="section-title">Alternance</h1>
          <p className="section-note">
            Une immersion terrain continue, soutenue par un coaching mental pour sécuriser la performance et la
            stabilité en entreprise.
          </p>
          <div className="financement-grid" style={{ marginTop: 32 }}>
            <div className="financement-card">
              <h3>Cadre professionnel</h3>
              <p className="section-note">
                Missions réelles, objectifs mesurables, accompagnement terrain et suivi d&apos;impact.
              </p>
            </div>
            <div className="financement-card alt">
              <h3>Performance mentale</h3>
              <p>
                Méthodes de concentration, gestion du stress, routines de progression et soft skills actionnables.
              </p>
            </div>
          </div>
          <div className="comparison" style={{ marginTop: 32 }}>
            {["Stabilité en entreprise", "Montée en soft skills rapide", "Posture commerciale forte"].map((item) => (
              <div key={item} className="comparison-card comparison-classic">
                {item}
              </div>
            ))}
          </div>
          <a href="/beyond-no-school/checkout" className="cta" style={{ display: "inline-block", marginTop: 28 }}>
            CANDIDATER EN ALTERNANCE
          </a>
        </div>
      </section>
    </LandingShell>
  );
}
