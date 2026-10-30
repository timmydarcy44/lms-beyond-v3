import Link from "next/link";
import { CalendarClock, Folder, MapPin, PenLine, Plus, Video } from "lucide-react";
import {
  appointmentHeadline,
  bookingPlace,
  bookingSubtitle,
  parisDayLabel,
  publicPractitionerLine,
  relativeWhenLabel,
  visioWindowOpen,
} from "@/app/dashboard/patient/_ui/format";
import { DocumentKindMark } from "@/app/dashboard/patient/_ui/document-kind";
import { PatientTaskList } from "@/app/dashboard/patient/_ui/task-list";
import { loadCareDirectoryPreview } from "@/lib/care/load-directory";
import { loadPatientCareHome } from "@/lib/care/patient-home";
import { loadPatientDocuments } from "@/lib/care/patient-documents";
import { activeSubjectId, loadPatientRelatives, sameSubject } from "@/lib/care/patient-relatives";
import { loadPatientInvoices, loadPatientJourneys } from "@/lib/care/patient-space";
import { formatPersonName, personInitials } from "@/lib/care/person-name";
import { isCarePlaceholderText } from "@/lib/care/profile-format";
import type { CareBookingRecord } from "@/lib/care/load-booking";

export const dynamic = "force-dynamic";

function Face({ name, url }: { name: string; url?: string | null }) {
  const parts = name.split(" ").filter(Boolean);
  const initials = personInitials(parts[0] ?? "", parts.slice(1).join(" "));
  if (url) return <img src={url} alt="" />;
  return <span className="patient-person-avatar">{initials || "?"}</span>;
}

function RoundLink({
  href,
  label,
  tone,
  children,
  external = false,
}: {
  href: string;
  label: string;
  tone: "primary" | "soft";
  children: React.ReactNode;
  external?: boolean;
}) {
  const className = `patient-round patient-round--${tone}`;
  const body = (
    <>
      <span className={className}>{children}</span>
      <span className="patient-round-label" aria-hidden>
        {label}
      </span>
    </>
  );
  if (external) {
    return (
      <a className="patient-round-link" href={href} target="_blank" rel="noreferrer" aria-label={label}>
        {body}
      </a>
    );
  }
  return (
    <Link className="patient-round-link" href={href} aria-label={label}>
      {body}
    </Link>
  );
}

function NextAppointment({ booking }: { booking: CareBookingRecord }) {
  const headline = appointmentHeadline(booking.starts_at);
  const name = formatPersonName(booking.practitioner_name) || "Votre praticien";
  const place = bookingPlace(booking);
  const reserveHref = booking.practitioner_slug ? `/care/reserver/${booking.practitioner_slug}` : "/care/praticiens";
  const ficheHref = booking.practitioner_slug ? `/care/praticiens/${booking.practitioner_slug}` : null;
  const maps = booking.format !== "visio" && booking.practitioner_address?.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.practitioner_address.trim())}`
    : null;
  const joinHint = visioWindowOpen(booking.starts_at, booking.duration_min)
    ? "Le lien de visio n'est pas encore disponible."
    : "Le lien s'active 15 minutes avant la séance.";

  return (
    <article className="patient-card">
      <div className="patient-hero-top">
        <div>
          <p className="patient-meta">
            <span className="patient-dot" aria-hidden />
            Prochain rendez-vous · {relativeWhenLabel(booking.starts_at)}
          </p>
          <p className="patient-when">
            {headline.dateLabel} <time dateTime={booking.starts_at}>{headline.time}</time>
          </p>
          {bookingSubtitle(booking) ? <p className="patient-sub">{bookingSubtitle(booking)}</p> : null}
        </div>
        {ficheHref ? (
          <Link href={ficheHref} className="patient-pro-chip">
            <Face name={name} url={booking.practitioner_avatar_url} />
            {name}
          </Link>
        ) : (
          <span className="patient-pro-chip">
            <Face name={name} url={booking.practitioner_avatar_url} />
            {name}
          </span>
        )}
      </div>
      <div className="patient-actions">
        <RoundLink href={reserveHref} label="Réserver" tone="primary">
          <Plus size={22} aria-hidden />
        </RoundLink>
        <RoundLink href="/dashboard/patient/messages" label="Écrire" tone="soft">
          <PenLine size={20} aria-hidden />
        </RoundLink>
        <RoundLink href="/dashboard/patient/documents" label="Documents" tone="soft">
          <Folder size={20} aria-hidden />
        </RoundLink>
        <RoundLink href={`/care/reservation/${booking.id}?token=${encodeURIComponent(booking.access_token)}`} label="Déplacer" tone="soft">
          <CalendarClock size={20} aria-hidden />
        </RoundLink>
        {maps ? (
          <RoundLink href={maps} label="Itinéraire" tone="soft" external>
            <MapPin size={20} aria-hidden />
          </RoundLink>
        ) : null}
        {booking.format === "visio" ? (
          <span className="patient-round-link">
            <button type="button" className="patient-round patient-round--soft" disabled aria-label={`Rejoindre. ${joinHint}`}>
              <Video size={20} aria-hidden />
            </button>
            <span className="patient-round-label" aria-hidden>
              Rejoindre
            </span>
          </span>
        ) : null}
      </div>
      {place ? null : booking.format !== "visio" ? (
        <p className="patient-muted">L&apos;adresse du cabinet n&apos;est pas encore renseignée.</p>
      ) : null}
    </article>
  );
}

export default async function PatientHomePage({
  searchParams,
}: {
  searchParams: Promise<{ personne?: string }>;
}) {
  const [{ personne }, relatives, home, documents, journeys, invoices] = await Promise.all([
    searchParams,
    loadPatientRelatives(),
    loadPatientCareHome(),
    loadPatientDocuments(),
    loadPatientJourneys(),
    loadPatientInvoices(),
  ]);
  const subjectId = activeSubjectId(personne, relatives);
  const next = home.upcoming.find((item) => sameSubject(item.subject_relative_id, subjectId)) ?? null;
  const visibleDocuments = documents.filter((item) => sameSubject(item.subjectRelativeId, subjectId));
  const journey = journeys.find((item) => sameSubject(item.subjectRelativeId, subjectId)) ?? null;
  const visibleInvoices = invoices.filter((item) => sameSubject(item.subjectRelativeId, subjectId));
  const paidCount = visibleInvoices.filter((item) => item.paidAt).length;
  const dueCount = visibleInvoices.length - paidCount;
  const suggestions = next ? [] : await loadCareDirectoryPreview(3);
  const visibleSuggestions = suggestions.filter((row) => row.slug && !isCarePlaceholderText(row.display_name));
  const personQuery = subjectId ? `?personne=${subjectId}` : "";
  const practitionerName = next ? formatPersonName(next.practitioner_name) : "";
  const practitionerMeta = next ? publicPractitionerLine(next.practitioner_title, next.practitioner_city) : "";

  return (
    <div className="patient-home">
      <div className="patient-stack">
        {next ? (
          <NextAppointment booking={next} />
        ) : (
          <article className="patient-card">
            <p className="patient-meta">
              <span className="patient-dot" aria-hidden />
              Prochain rendez-vous
            </p>
            <h2>Aucun rendez-vous à venir</h2>
            <div className="patient-actions">
              <RoundLink href="/care/praticiens" label="Réserver" tone="primary">
                <Plus size={22} aria-hidden />
              </RoundLink>
            </div>
            {visibleSuggestions.length ? (
              <div className="patient-people-list">
                {visibleSuggestions.map((row) => {
                  const name = formatPersonName(row.display_name);
                  const meta = publicPractitionerLine(row.title, row.city);
                  return (
                    <Link key={row.expert_id} href={`/care/praticiens/${row.slug}`} className="patient-suggest">
                      <Face name={name} url={row.avatar_url} />
                      <span>
                        <strong>{name}</strong>
                        {meta ? <span>{meta}</span> : null}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </article>
        )}

        <article className="patient-card">
          <div className="patient-card-head">
            <h2>Derniers documents</h2>
            <Link href={`/dashboard/patient/documents${personQuery}`}>Tout voir ›</Link>
          </div>
          {visibleDocuments.length ? (
            <div className="patient-doc-home">
              {visibleDocuments.slice(0, 4).map((item) => (
                <Link key={item.id} href={`/dashboard/patient/documents${personQuery}${personQuery ? "&" : "?"}doc=${item.id}`} className="patient-doc-home-row">
                  <DocumentKindMark kind={item.kind} />
                  <span>
                    <strong>
                      {item.title}
                      {!item.openedAt ? <em>Nouveau</em> : null}
                    </strong>
                    <small>
                      Partagé par {item.practitionerName} · {parisDayLabel(item.sharedAt)}
                    </small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="patient-muted" style={{ marginTop: 0 }}>
              Aucun document partagé. Il apparaît ici lorsque votre praticien le partage avec vous.
            </p>
          )}
        </article>

        {journey?.steps.length ? (
          <article className="patient-card">
            <h2>{journey.title}</h2>
            <p className="patient-muted">Avec {journey.practitionerName}</p>
            <ol className="patient-journey">
              {journey.steps.map((step) => (
                <li key={step.id} data-status={step.status}>
                  <span />
                  <strong>{step.title}</strong>
                  {step.date ? <small>{parisDayLabel(step.date)}</small> : null}
                </li>
              ))}
            </ol>
          </article>
        ) : null}

        {journey?.tasks.length ? (
          <article className="patient-card patient-card--prepare">
            <h2>{next ? `Avant ${parisDayLabel(next.starts_at)}` : "À préparer"}</h2>
            <PatientTaskList tasks={journey.tasks} />
          </article>
        ) : null}

        {journey?.note ? (
          <article className="patient-card">
            <h2>Un mot de {journey.practitionerName}</h2>
            <p>{journey.note.message}</p>
          </article>
        ) : null}

        {journey?.resource ? (
          <article className="patient-card patient-card--resource">
            <h2>Ressource recommandée</h2>
            <a href={journey.resource.url} target="_blank" rel="noreferrer">
              <strong>{journey.resource.title}</strong>
              <small>
                {[journey.resource.kind, journey.resource.durationMin ? `${journey.resource.durationMin} min` : ""].filter(Boolean).join(" · ")}
              </small>
            </a>
          </article>
        ) : null}
      </div>

      <div className="patient-stack">
        {next && practitionerName ? (
          <article className="patient-card">
            <div className="patient-prac">
              <Face name={practitionerName} url={next.practitioner_avatar_url} />
              <div>
                <h2>{practitionerName}</h2>
                {practitionerMeta ? <p>{practitionerMeta}</p> : null}
              </div>
            </div>
            <div className="patient-row-actions">
              <Link href="/dashboard/patient/messages" className="patient-pill patient-pill--dark">
                Écrire
              </Link>
              {next.practitioner_slug ? (
                <Link href={`/care/praticiens/${next.practitioner_slug}`} className="patient-pill patient-pill--soft">
                  Voir sa fiche
                </Link>
              ) : null}
            </div>
          </article>
        ) : null}

        <article className="patient-card">
          <div className="patient-card-head">
            <h2>Factures</h2>
            {visibleInvoices.length ? (
              <span className={dueCount ? "patient-due" : "patient-settled"}>
                {dueCount ? `${dueCount} à régler` : "Tout est réglé"}
              </span>
            ) : null}
          </div>
          {visibleInvoices.length ? (
            <div className="patient-doc-home">
              {visibleInvoices.slice(0, 3).map((item) => (
                <div key={item.id} className="patient-doc-home-row">
                  <span>
                    <strong>{new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(item.amountCents / 100)}</strong>
                    <small>
                      {item.practitionerName}
                      {item.number ? ` · ${item.number}` : ""}
                      {" · "}
                      {item.paidAt ? `Réglée le ${parisDayLabel(item.paidAt)}` : "À régler"}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          ) : visibleDocuments.some((item) => item.kind === "invoice") ? (
            <div className="patient-doc-home">
              {visibleDocuments
                .filter((item) => item.kind === "invoice")
                .slice(0, 2)
                .map((item) => (
                  <Link key={item.id} href={`/dashboard/patient/documents${personQuery}${personQuery ? "&" : "?"}doc=${item.id}`} className="patient-doc-home-row">
                    <DocumentKindMark kind={item.kind} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {parisDayLabel(item.sharedAt)} · {item.practitionerName}
                      </small>
                    </span>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="patient-muted" style={{ marginTop: 0 }}>
              Aucune facture pour le moment.
            </p>
          )}
          {paidCount > 0 ? (
            <a className="patient-pill patient-pill--soft" href={`/api/care/patient/attestation${subjectId ? `?personne=${subjectId}` : ""}`}>
              Attestation mutuelle
            </a>
          ) : null}
        </article>
      </div>
    </div>
  );
}
