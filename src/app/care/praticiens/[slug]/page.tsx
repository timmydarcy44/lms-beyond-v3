import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CareBookingWidget } from "@/components/care/care-booking-widget";
import { CareLink } from "@/components/care/care-host";
import { formatCarePrice } from "@/lib/care/care.config";
import { CARE_DIRECTORY_COPY } from "@/lib/care/directory-copy";
import { careAvatarTone } from "@/lib/care/directory-search";
import {
  CARE_LANGUAGE_LABELS,
  CARE_PAYMENT_LABELS,
  careDomainLabel,
  formatCareDuration,
  formatCareFormats,
  hasCareText,
  loadCareProfileBySlug,
  loadPublishedCareProfile,
  loadPublishedCareSlugs,
} from "@/lib/care/profile";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { careAbsoluteUrl, isByoundCareHostname } from "@/lib/care/host";
import { carePageMetadata } from "@/lib/care/seo";

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
  if (!profile) return { title: "Praticien" };
  const title = [profile.display_name, profile.title].filter(hasCareText).join(" — ");
  const description = hasCareText(profile.tagline) ? profile.tagline : hasCareText(profile.headline) ? profile.headline : "";
  return carePageMetadata({
    title,
    description,
    internalPath: `/care/praticiens/${profile.slug}`,
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

async function loadOwnerPreview(slug: string) {
  try {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    if (isByoundCareHostname(host)) return null;
    const session = await getSession();
    if (!session?.id) return null;
    return loadCareProfileBySlug(slug, { viewerId: session.id });
  } catch {
    return null;
  }
}

export default async function CarePraticienPage({ params }: Params) {
  const { slug } = await params;
  const profile = (await loadPublishedCareProfile(slug)) ?? (await loadOwnerPreview(slug));
  if (!profile) notFound();
  const preview = !profile.published || !profile.is_care;
  const certified = profile.badges.length > 0;
  const showPresentation = hasCareText(profile.headline) || hasCareText(profile.bio) || hasCareText(profile.approach);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        name: profile.display_name,
        jobTitle: hasCareText(profile.title) ? profile.title : undefined,
        description: hasCareText(profile.tagline) ? profile.tagline : undefined,
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
    <>
      {preview ? null : <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <section className="care-hero care-profile-hero">
        <div className="care-halo" style={{ width: 380, height: 380, background: "var(--care-accent)", top: -140, left: -40 }} />
        <div className="care-wrap">
          {preview ? <p className="care-kicker">Aperçu — fiche non publiée</p> : null}
          <CareLink href="/care/praticiens" className="care-back">
            ← Tous les praticiens
          </CareLink>
          <div className="care-profile-hero-grid">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="care-avatar-lg" />
            ) : (
              <span className="care-avatar-lg" style={{ background: careAvatarTone(profile.expert_id) }}>
                {initials(profile.display_name)}
              </span>
            )}
            <div>
              <p className={`care-cert-pill${certified ? "" : " is-pending"}`}>
                {certified ? "Certifié·e Byound" : CARE_DIRECTORY_COPY.certInProgress}
              </p>
              <h1 className="care-h1">{profile.display_name}</h1>
              {hasCareText(profile.title) ? <p className="care-lead">{profile.title}</p> : null}
              {hasCareText(profile.tagline) ? <p className="care-lead">{profile.tagline}</p> : null}
              {profile.domains.length ? (
                <div className="care-quick">
                  {profile.domains.map((id) => (
                    <span key={id} className="care-chip-link care-chip-link--on-dark is-on">
                      {careDomainLabel(id)}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="care-quick">
                {hasCareText(profile.city) ? <span className="care-chip-link care-chip-link--on-dark">{profile.city}</span> : null}
                {profile.offers_cabinet ? <span className="care-chip-link care-chip-link--on-dark">Cabinet</span> : null}
                {profile.offers_visio ? <span className="care-chip-link care-chip-link--on-dark">Visio</span> : null}
                {certified ? (
                  <span className="care-chip-link care-chip-link--on-dark">
                    {profile.badges.length} Open Badge{profile.badges.length > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="care-section" style={{ paddingTop: 32 }}>
        <div className="care-wrap care-profile-grid">
          <div>
            {showPresentation ? (
              <section className="care-block">
                <h2>Présentation</h2>
                {hasCareText(profile.headline) ? <p className="care-headline">{profile.headline}</p> : null}
                {hasCareText(profile.bio)
                  ? profile.bio.split(/\n+/).map((para, index) => <p key={`${index}-${para.slice(0, 12)}`}>{para}</p>)
                  : null}
                {hasCareText(profile.approach) ? (
                  <aside className="care-approach">
                    <h3>Mon approche</h3>
                    <p>{profile.approach}</p>
                  </aside>
                ) : null}
              </section>
            ) : null}

            {profile.services.length ? (
              <section className="care-block">
                <h2>Prestations et tarifs</h2>
                <ul className="care-service-list">
                  {profile.services.map((service) => (
                    <li key={service.id}>
                      <div>
                        <strong>{service.name}</strong>
                        <span className="care-chip">{careDomainLabel(service.domain)}</span>
                      </div>
                      {hasCareText(service.description) ? <p>{service.description}</p> : null}
                      <p className="care-muted">
                        {formatCareFormats(service.formats)} · {formatCareDuration(service.duration_min)} · {formatCarePrice(service.price_cents)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="care-block">
              <h2>Open Badges</h2>
              {profile.badges.length ? (
                <div className="care-badge-grid">
                  {profile.badges.map((badge) => (
                    <article key={badge.badge_id} className="care-badge-card">
                      {badge.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={badge.image_url} alt="" />
                      ) : (
                        <span className="care-avatar" style={{ background: "#0B1533" }}>
                          OB
                        </span>
                      )}
                      <h3>{badge.name}</h3>
                      <p className="care-muted">{badge.issuer}</p>
                      {badge.awarded_at && !Number.isNaN(Date.parse(badge.awarded_at)) ? (
                        <p className="care-muted">
                          {new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "Europe/Paris" }).format(
                            new Date(badge.awarded_at),
                          )}
                        </p>
                      ) : null}
                      {hasCareText(badge.verification_url) ? (
                        <a href={badge.verification_url} target="_blank" rel="noreferrer">
                          Vérifier ↗
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="care-approach">Certification Byound en cours</p>
              )}
            </section>

            {profile.experiences.some((item) => hasCareText(item.role) || hasCareText(item.period_label)) ? (
              <section className="care-block">
                <h2>Expériences professionnelles</h2>
                <ol className="care-timeline">
                  {profile.experiences.map((item) => (
                    <li key={item.id}>
                      {hasCareText(item.period_label) ? <p className="care-muted">{item.period_label}</p> : null}
                      {hasCareText(item.role) ? <h3>{item.role}</h3> : null}
                      {hasCareText(item.organization) ? <p>{item.organization}</p> : null}
                      {hasCareText(item.description) ? <p className="care-muted">{item.description}</p> : null}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {profile.trainings.some((item) => hasCareText(item.title) || hasCareText(item.year)) ? (
              <section className="care-block">
                <h2>Diplômes et formations</h2>
                <div className="care-train-grid">
                  {profile.trainings.map((item) => (
                    <article key={item.id} className="care-train-card">
                      {hasCareText(item.year) ? <p className="care-muted">{item.year}</p> : null}
                      {hasCareText(item.title) ? <h3>{item.title}</h3> : null}
                      {hasCareText(item.organization) ? <p>{item.organization}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="care-profile-side">
            <CareBookingWidget
              slug={profile.slug}
              expertId={profile.expert_id}
              services={profile.services}
              cancellationHours={profile.cancellation_hours}
            />
            <aside className="care-side-card">
              <h2>Infos pratiques</h2>
              {profile.offers_cabinet && (hasCareText(profile.address) || hasCareText(profile.city)) ? (
                <p>
                  Cabinet
                  <br />
                  {[profile.address, profile.city].filter(hasCareText).join(", ")}
                </p>
              ) : null}
              {profile.offers_visio ? <p>Visio</p> : null}
              {profile.languages.length ? (
                <p>{profile.languages.map((code) => CARE_LANGUAGE_LABELS[code] ?? code).join(" · ")}</p>
              ) : null}
              {profile.payment_methods.length ? (
                <p>{profile.payment_methods.map((code) => CARE_PAYMENT_LABELS[code] ?? code).join(" · ")}</p>
              ) : null}
              <p>
                Référente handicap
                <br />
                <a href="mailto:inclusion@byound.fr">inclusion@byound.fr</a>
              </p>
            </aside>
            {profile.publics.filter(hasCareText).length ? (
              <aside className="care-side-card">
                <h2>Publics accompagnés</h2>
                <div className="care-prac-chips">
                  {profile.publics.filter(hasCareText).map((item) => (
                    <span key={item} className="care-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </aside>
            ) : null}
            <aside className="care-side-card care-side-card--navy">
              <h2>Une question avant de réserver ?</h2>
              <p>Écrivez-nous, on vous oriente vers le bon cadre.</p>
              <a className="care-pill care-pill--white" href="mailto:contact@byound.fr">
                Contacter Byound Care
              </a>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
