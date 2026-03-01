import { LandingShell } from "@/components/beyond-no-school/landing-shell";

export default function EcolePage() {
  return (
    <LandingShell>
      <section className="section">
        <div className="container">
          <h1 className="section-title">École</h1>
          <p className="section-note">
            Un campus pensé comme un centre d&apos;entraînement : exigence, posture professionnelle et culture du
            résultat.
          </p>
          <div className="financement-grid" style={{ marginTop: 32 }}>
            <div className="financement-card">
              <h3>Notre positionnement</h3>
              <p className="section-note">
                Beyond combine exigence académique, mental de performance et immersion terrain pour former des profils
                prêts à performer dès le premier jour.
              </p>
            </div>
            <div className="financement-card alt">
              <h3>Ce que vous vivez</h3>
              <p>
                Rythme intensif, culture du feedback, environnement professionnel et accompagnement individualisé pour
                transformer votre potentiel en résultats concrets.
              </p>
            </div>
          </div>
          <div className="comparison" style={{ marginTop: 32 }}>
            {[
              "Boardroom training et mises en situation réelles",
              "Coaching mental pour stabilité et confiance",
              "Exigence commerciale et posture client",
            ].map((item) => (
              <div key={item} className="comparison-card comparison-classic">
                {item}
              </div>
            ))}
          </div>
          <a href="/beyond-no-school/checkout" className="cta" style={{ display: "inline-block", marginTop: 28 }}>
            CANDIDATER
          </a>
        </div>
      </section>
    </LandingShell>
  );
}
