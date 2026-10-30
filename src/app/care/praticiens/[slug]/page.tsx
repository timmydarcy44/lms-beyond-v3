import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Manrope } from "next/font/google";
import { CareLink } from "@/components/care/care-host";
import { CareProfileBook } from "@/components/care/care-profile-book";
import { formatCarePrice } from "@/lib/care/care.config";
import { carePlaceLine, carePriceLine, carePublicServices } from "@/lib/care/publication";
import {
  CARE_LANGUAGE_LABELS,
  careDomainLabel,
  formatCareDuration,
  formatCareFormats,
  hasCarePublicText,
  loadPublishedCareProfile,
  loadPublishedCareSlugs,
} from "@/lib/care/profile";
import { careAbsoluteUrl } from "@/lib/care/host";
import { carePageMetadata } from "@/lib/care/seo";
import { personInitials } from "@/lib/care/person-name";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export const revalidate = 600;
export const dynamicParams = true;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await loadPublishedCareSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const profile = await loadPublishedCareProfile(slug);
  if (!profile) return { title: "Praticien", robots: { index: false, follow: false } };
  const place = profile.city || (profile.offers_visio ? "en visio" : "");
  const title = [profile.display_name, profile.title, place].filter(Boolean).join(" · ");
  return carePageMetadata({
    title,
    description: hasCarePublicText(profile.tagline) ? profile.tagline : profile.title,
    internalPath: `/care/praticiens/${profile.slug}`,
    image: profile.avatar_url,
  });
}

export default async function CarePraticienPage({ params }: Params) {
  const { slug } = await params;
  const profile = await loadPublishedCareProfile(slug);
  if (!profile) notFound();
  const services = carePublicServices(profile.services.map((item) => ({ ...item, active: item.active })));
  const visibleServices = profile.services.filter((item) => services.some((row) => row.name === item.name));
  const price = carePriceLine(profile.services);
  const place = carePlaceLine(profile);
  const firstName = profile.display_name.split(" ")[0] || profile.display_name;
  const sessionPrice = visibleServices.find((item) => item.price_cents > 0);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: profile.display_name,
        jobTitle: hasCarePublicText(profile.title) ? profile.title : undefined,
        description: hasCarePublicText(profile.tagline) ? profile.tagline : undefined,
        image: profile.avatar_url || undefined,
        address: profile.city ? { "@type": "PostalAddress", addressLocality: profile.city, addressCountry: "FR" } : undefined,
        url: careAbsoluteUrl(`/care/praticiens/${profile.slug}`),
      },
      {
        "@type": "ProfessionalService",
        name: "Byound Care",
        provider: { "@type": "Person", name: profile.display_name },
        areaServed: profile.city || "France",
        url: careAbsoluteUrl(`/care/praticiens/${profile.slug}`),
      },
    ],
  };

  return (
    <div className={`${manrope.className} cf-page cf-profile`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="care-wrap">
        <CareLink href="/care/praticiens" className="cf-back">
          ‹ Tous les praticiens
        </CareLink>
        <div className="cf-profile-grid">
          <div>
            <header className="cf-hero">
              <div className="cf-portrait">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={`Photo de ${profile.display_name}`} fill sizes="168px" className="cf-photo-img" />
                ) : (
                  <span>{personInitials(firstName, profile.display_name.split(" ").slice(1).join(" "))}</span>
                )}
                {profile.badges.length ? <i aria-hidden>✓</i> : null}
              </div>
              <div>
                <h1>{profile.display_name}</h1>
                <p>
                  {[profile.title, profile.city || (profile.offers_visio ? "Visio" : "")].filter(hasCarePublicText).join(" · ")}
                </p>
                <div className="cf-hero-pills">
                  {profile.badges.length ? <span>✓ Certifié Byound</span> : null}
                  {profile.offers_cabinet ? <span>Cabinet</span> : null}
                  {profile.offers_visio ? <span>Visio</span> : null}
                </div>
              </div>
              <div className="cf-hero-stats">
                <p>
                  <strong>{price.main}</strong>
                  <span>{price.hint}</span>
                </p>
                <p>
                  <strong>{sessionPrice ? formatCarePrice(sessionPrice.price_cents) : price.main}</strong>
                  <span>la séance</span>
                </p>
                <p>
                  <strong>{profile.badges.length}</strong>
                  <span>Open Badges</span>
                </p>
              </div>
            </header>
            <nav className="cf-anchors" aria-label="Sections">
              <a href="#a-propos">À propos</a>
              <a href="#prestations">Prestations</a>
              <a href="#badges">Open Badges</a>
              <a href="#parcours">Parcours</a>
              <a href="#infos">Infos pratiques</a>
            </nav>
            <section id="a-propos" className="cf-block">
              <h2>À propos</h2>
              {hasCarePublicText(profile.bio) ? <p>{profile.bio}</p> : null}
              {hasCarePublicText(profile.approach) ? <p>{profile.approach}</p> : null}
              <div className="cf-pills">
                {profile.domains.map((id) => (
                  <span key={id} className="cf-pill">
                    {careDomainLabel(id)}
                  </span>
                ))}
              </div>
            </section>
            <section id="prestations" className="cf-block">
              <h2>Prestations</h2>
              <ul className="cf-services">
                {visibleServices.map((service) => (
                  <li key={service.id}>
                    <span aria-hidden>{service.name.slice(0, 1)}</span>
                    <div>
                      <strong>{service.name}</strong>
                      <p>
                        {formatCareDuration(service.duration_min)} · {formatCareFormats(service.formats)}
                      </p>
                    </div>
                    <em>{formatCarePrice(service.price_cents)}</em>
                    <a href={`#reserver`}>Choisir</a>
                  </li>
                ))}
              </ul>
            </section>
            <section id="badges" className="cf-block">
              <h2>Open Badges</h2>
              {profile.badges.length ? (
                <ul className="cf-badges">
                  {profile.badges.map((badge) => (
                    <li key={badge.badge_id}>
                      {badge.image_url ? <Image src={badge.image_url} alt="" width={56} height={56} /> : <span>OB</span>}
                      <div>
                        <strong>{badge.name}</strong>
                        <p>Délivré par Byound · vérifiable</p>
                        {hasCarePublicText(badge.verification_url) ? (
                          <a href={badge.verification_url}>Vérifier le badge</a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Aucun Open Badge pour le moment.</p>
              )}
            </section>
            <section id="parcours" className="cf-block">
              <h2>Parcours</h2>
              <ol className="cf-timeline">
                {profile.trainings.filter((item) => hasCarePublicText(item.title)).map((item) => (
                  <li key={item.id}>
                    <strong>{item.title}</strong>
                    <p>{[item.year, item.organization].filter(hasCarePublicText).join(" · ")}</p>
                  </li>
                ))}
                {profile.experiences.filter((item) => hasCarePublicText(item.role)).map((item) => (
                  <li key={item.id}>
                    <strong>{item.role}</strong>
                    <p>{[item.period_label, item.organization].filter(hasCarePublicText).join(" · ")}</p>
                  </li>
                ))}
              </ol>
            </section>
            <section id="infos" className="cf-block">
              <h2>Infos pratiques</h2>
              <p>{[profile.offers_cabinet ? "Cabinet" : null, profile.offers_visio ? "Visio" : null].filter(Boolean).join(" · ")}</p>
              {profile.city ? <p>{profile.city}</p> : null}
              <p className="cf-place-note">{place.main === "Visio" ? "En visio uniquement. Aucune adresse n'est affichée." : `Cabinet à ${profile.city ?? place.main}. L'adresse exacte est envoyée après la réservation.`}</p>
              {profile.languages.length ? <p>{profile.languages.map((code) => CARE_LANGUAGE_LABELS[code] ?? code).join(" · ")}</p> : null}
            </section>
          </div>
          <CareProfileBook
            slug={profile.slug}
            expertId={profile.expert_id}
            firstName={firstName}
            fullName={profile.display_name}
            services={visibleServices}
            cancellationHours={profile.cancellation_hours}
            city={profile.city}
          />
        </div>
      </div>
      <a className="cf-mobile-bar" href="#reserver">
        Réserver · {price.main}
      </a>
    </div>
  );
}
