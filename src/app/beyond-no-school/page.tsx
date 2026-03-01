import { type Metadata } from "next";
import { LandingShell } from "@/components/beyond-no-school/landing-shell";

export const metadata: Metadata = {
  title: "Alternance Rouen — Formation Commerciale Rouen | Beyond",
  description:
    "Alternance Rouen et Formation Commerciale Rouen : Diplôme d'État NTC (RNCP Bac+2), Open Badges France et école de commerce innovante.",
  keywords: [
    "Alternance Rouen",
    "Formation Commerciale Rouen",
    "Diplôme d'État NTC",
    "Open Badges France",
    "École de commerce innovante",
  ],
};

export default function NoSchoolPage() {
  return (
    <LandingShell>
      <section id="ecole" className="hero">
        <div className="container hero-content">
          <div className="hero-tag">École de commerce innovante · Alternance Rouen</div>
          <h1 className="hero-title">
            UN DIPLÔME RECONNU PAR L&apos;ÉTAT.
            <br />
            <span className="accent-gradient">DES COMPÉTENCES VALIDÉES PAR LE TERRAIN.</span>
          </h1>
          <p className="hero-subtitle">
            L&apos;assurance d&apos;un Diplôme d&apos;État NTC (RNCP Bac+2) alliée à des soft skills validées par le
            terrain. Une école de commerce innovante pour devenir expert du développement commercial.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 28 }}>
            <a href="/login" className="cta">
              Connexion
            </a>
            <a href="/signup" className="cta cta-outline">
              S&apos;inscrire
            </a>
          </div>
        </div>
      </section>

      <section id="formation" className="section slider-section">
        <div className="container">
          <h2 className="section-title">Les 3 piliers du socle de réussite</h2>
        </div>
        <div className="slider-outer">
          <div className="slider">
            <div className="slider-card">
              <div
                className="slider-image"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80')",
                }}
              />
              <div className="slider-overlay" />
              <div className="slider-content">
                <p className="section-note">NTC (Bac+2)</p>
                <h3>La sécurité d&apos;un diplôme d&apos;État reconnu.</h3>
                <p className="section-note">
                  Une base académique solide pour une efficacité professionnelle immédiate.
                </p>
              </div>
            </div>
            <div className="slider-card">
              <div
                className="slider-image"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=1200&q=80')",
                }}
              />
              <div className="slider-overlay" />
              <div className="slider-content">
                <p className="section-note">Open Badges</p>
                <h3>Vos soft skills certifiées par le terrain et uniques en France.</h3>
                <p className="section-note">La maîtrise des soft skills validée par la réalité du terrain.</p>
              </div>
            </div>
            <div className="slider-card">
              <div
                className="slider-image"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=1200&q=80')",
                }}
              />
              <div className="slider-overlay" />
              <div className="slider-content">
                <p className="section-note">Performance</p>
                <h3>Coaching mental et stratégies d&apos;apprentissage pour tous (incluant profils DYS).</h3>
                <p className="section-note">
                  Le levier mental qui sécurise la stabilité et la progression en entreprise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="comparaison">
        <div className="container centered">
          <h2 className="section-title">Nous redéfinissons l&apos;apprentissage</h2>
          <div className="comparison">
            <div className="comparison-card comparison-classic">
              <h3>Le modèle traditionnel</h3>
              <div className="comparison-row">
                <span />
                <span>Standardisation</span>
              </div>
              <div className="comparison-row">
                <span />
                <span>Notes théoriques</span>
              </div>
              <div className="comparison-row">
                <span />
                <span>Salles de classe</span>
              </div>
              <div className="comparison-row">
                <span />
                <span>Suivi limité</span>
              </div>
            </div>
            <div className="comparison-card comparison-beyond">
              <h3>L’expérience Beyond</h3>
              <div className="comparison-row">
                <span className="check-icon">✓</span>
                <span>Sélection sur dossier</span>
              </div>
              <div className="comparison-row">
                <span className="check-icon">✓</span>
                <span>Open Badges certifiés</span>
              </div>
              <div className="comparison-row">
                <span className="check-icon">✓</span>
                <span>Cadre professionnel (Boardroom)</span>
              </div>
              <div className="comparison-row">
                <span className="check-icon">✓</span>
                <span>Accompagnement DYS &amp; Mental</span>
              </div>
              <button className="cta" style={{ marginTop: 24 }}>
                DÉPOSER MON DOSSIER
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="alternance" className="section psycho-section">
        <div className="psycho">
          <img
            className="psycho-image"
            src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80"
            alt="Accompagnement psychopédagogique"
          />
          <div className="psycho-content">
            <div className="psycho-content-inner">
              <h2 className="section-title">Psychopédagogie et performance scolaire &amp; professionnelle</h2>
              <p className="section-note">
                Nous travaillons avec une psychopédagogue dédiée à la performance mentale et professionnelle de nos
                alternants. Cette expertise unique nous permet de garantir une progression optimale pour chaque
                profil, et nous permet d&apos;être la première structure capable d&apos;accompagner avec autant de
                précision les jeunes ayant des troubles du neurodéveloppement (DYS, TDAH...). Chez Beyond, leur
                singularité devient un levier de performance inédit.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="entreprises" className="section">
        <div className="container centered">
          <div className="recruteur-banner">
            <h2 className="section-title">Espace Entreprises</h2>
            <p className="section-note">
              Nos alternants sont préparés mentalement à l&apos;exigence du terrain, ce qui sécurise leur intégration
              et leur stabilité en entreprise.
            </p>
            <a href="/beyond-no-school/entreprises" className="cta" style={{ marginTop: 24 }}>
              Recruter un profil Beyond
            </a>
          </div>
        </div>
      </section>

      <section id="open-badge" className="section">
        <div className="container centered">
          <h2 className="section-title">Open Badges France</h2>
          <p className="section-note">
            Bien plus qu&apos;un diplôme, une preuve de savoir-faire exportable partout. Les Open Badges certifient des
            soft skills concrètes co-construites avec des experts de la performance, offrant une garantie
            supplémentaire au diplôme d&apos;État.
          </p>
          <div className="badge-grid" style={{ marginTop: 24 }}>
            <div className="badge">
              <div className="badge-icon" />
              <h3>Négociation d&apos;affaires</h3>
              <p className="section-note">Soft Skills validées par le terrain.</p>
            </div>
            <div className="badge">
              <div className="badge-icon" />
              <h3>Anglais</h3>
              <p className="section-note">Soft Skills validées par le terrain.</p>
            </div>
            <div className="badge">
              <div className="badge-icon" />
              <h3>Marketing sportif</h3>
              <p className="section-note">Soft Skills validées par le terrain.</p>
            </div>
            <div className="badge">
              <div className="badge-icon" />
              <h3>Étude comportementale</h3>
              <p className="section-note">Soft Skills validées par le terrain.</p>
            </div>
            <div className="badge">
              <div className="badge-icon" />
              <h3>Intelligence artificielle</h3>
              <p className="section-note">Soft Skills validées par le terrain.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="financement" className="section">
        <div className="container centered">
          <h2 className="section-title">Financement</h2>
          <div className="financement-bar" />
          <div className="financement-grid">
            <div className="financement-card">
              <h3>Alternance</h3>
              <p className="section-note">
                0€ de reste à charge. Formation 100% financée par l’OPCO de votre entreprise. Vous êtes salarié et
                rémunéré.
              </p>
            </div>
            <div className="financement-card alt">
              <h3>Initial</h3>
              <p>
                Investissement personnel. Pour ceux qui choisissent de financer leur propre ascension. Facilités de
                paiement disponibles.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        Le premier centre de haute performance en Normandie pour les futurs experts du développement commercial.
      </footer>
    </LandingShell>
  );
}
