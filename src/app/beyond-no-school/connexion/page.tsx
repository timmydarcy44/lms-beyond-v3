import { LandingShell } from "@/components/beyond-no-school/landing-shell";

export default function ConnexionPage() {
  return (
    <LandingShell>
      <section className="section">
        <div className="container">
          <h1 className="section-title">Connexion</h1>
          <p className="section-note">
            Accédez à votre espace apprenant pour suivre vos soft skills, badges et progression.
          </p>
          <div className="financement-grid" style={{ marginTop: 32 }}>
            <div className="financement-card">
              <h3>Mon espace apprenant</h3>
              <p className="section-note">Suivi de progression, badges validés, parcours et prochaines étapes.</p>
            </div>
            <div className="financement-card alt">
              <h3>Accompagnement</h3>
              <p>Contacts, ressources pédagogiques et coaching mental à portée de main.</p>
            </div>
          </div>
          <a href="/beyond-no-school/login" className="cta" style={{ display: "inline-block", marginTop: 28 }}>
            SE CONNECTER
          </a>
        </div>
      </section>
    </LandingShell>
  );
}
