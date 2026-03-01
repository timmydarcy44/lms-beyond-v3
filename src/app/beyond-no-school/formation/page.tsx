import { LandingShell } from "@/components/beyond-no-school/landing-shell";

export default function FormationPage() {
  return (
    <LandingShell>
      <section className="section">
        <div className="container">
          <h1 className="section-title">Formation</h1>
          <p className="section-note">
            Trois piliers, un seul objectif : l&apos;efficacité professionnelle immédiate et la maîtrise des soft
            skills.
          </p>
          <div className="comparison" style={{ marginTop: 32 }}>
            <div className="comparison-card comparison-classic">
              <h3>Diplôme d&apos;État NTC</h3>
              <p className="section-note">
                Une base académique solide pour sécuriser votre progression et valoriser votre niveau.
              </p>
            </div>
            <div className="comparison-card comparison-classic">
              <h3>Open Badges</h3>
              <p className="section-note">
                Des soft skills réelles, co-construites avec des experts de la performance et validées par le terrain.
              </p>
            </div>
            <div className="comparison-card comparison-classic">
              <h3>Performance mentale</h3>
              <p className="section-note">
                Coaching mental, discipline et routines pour transformer l&apos;ambition en résultats.
              </p>
            </div>
          </div>
          <div className="financement-grid" style={{ marginTop: 32 }}>
            <div className="financement-card">
              <h3>Approche pédagogique</h3>
              <p className="section-note">
                Cours intensifs, cas réels, pitchs commerciaux, posture pro et feedback continu.
              </p>
            </div>
            <div className="financement-card alt">
              <h3>Soft skills ciblées</h3>
              <p>
                Négociation, communication, gestion du temps, leadership et résilience.
              </p>
            </div>
          </div>
          <a href="/beyond-no-school/checkout" className="cta" style={{ display: "inline-block", marginTop: 28 }}>
            DÉPOSER MON DOSSIER
          </a>
        </div>
      </section>
    </LandingShell>
  );
}
