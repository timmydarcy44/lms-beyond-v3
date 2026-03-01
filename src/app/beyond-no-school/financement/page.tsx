import { LandingShell } from "@/components/beyond-no-school/landing-shell";

export default function FinancementPage() {
  return (
    <LandingShell>
      <section className="section">
        <div className="container">
          <h1 className="section-title">Financement</h1>
          <p className="section-note">
            Alternance 100% financée ou parcours initial avec facilités : vous choisissez le rythme de votre ascension.
          </p>
          <div className="financement-grid" style={{ marginTop: 32 }}>
            <div className="financement-card">
              <h3>Alternance (OPCO)</h3>
              <p className="section-note">
                Formation financée par l&apos;entreprise, rémunération mensuelle et immersion terrain immédiate.
              </p>
            </div>
            <div className="financement-card alt">
              <h3>Parcours initial</h3>
              <p>
                Un investissement personnel pour ceux qui accélèrent leur ascension, avec options de paiement.
              </p>
            </div>
          </div>
          <div className="comparison" style={{ marginTop: 32 }}>
            {["Conseils sur mesure", "Accompagnement administratif", "Mise en relation entreprises"].map((item) => (
              <div key={item} className="comparison-card comparison-classic">
                {item}
              </div>
            ))}
          </div>
          <a href="/beyond-no-school/checkout" className="cta" style={{ display: "inline-block", marginTop: 28 }}>
            ÉTUDIER LES OPTIONS
          </a>
        </div>
      </section>
    </LandingShell>
  );
}
