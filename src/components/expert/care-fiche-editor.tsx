"use client";

import { useMemo, useState } from "react";
import { CARE_PUBLICS, careCompleteness } from "@/lib/care/completeness";
import { CARE_DOMAINS } from "@/lib/care/domains";
import { saveCarePublicProfile } from "@/lib/care/expert-actions";
import { CARE_LANGUAGE_LABELS, CARE_PAYMENT_LABELS, type CarePublicProfile } from "@/lib/care/profile";
import { CareSortableCards } from "@/components/expert/care-sortable-cards";
import { createClient } from "@/lib/supabase/client";
import type { CareDomain } from "@/lib/care/domains";
import type { CareService } from "@/lib/care/types";

type ServiceDraft = CareService & { localId: string };
type ExpDraft = CarePublicProfile["experiences"][number] & { localId: string };
type TrainDraft = CarePublicProfile["trainings"][number] & { localId: string };

const field = "w-full rounded-xl border border-[#1E2130] bg-[#0B0C10] px-3 py-2 text-sm";

function nid() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tmp-${Date.now()}`;
}

export function CareFicheEditor({ profile }: { profile: CarePublicProfile }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [slug, setSlug] = useState(profile.slug);
  const [title, setTitle] = useState(profile.title);
  const [tagline, setTagline] = useState(profile.tagline);
  const [headline, setHeadline] = useState(profile.headline);
  const [bio, setBio] = useState(profile.bio);
  const [approach, setApproach] = useState(profile.approach);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [domains, setDomains] = useState<CareDomain[]>(profile.domains);
  const [publics, setPublics] = useState(profile.publics);
  const [city, setCity] = useState(profile.city ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [cabinet, setCabinet] = useState(profile.offers_cabinet);
  const [visio, setVisio] = useState(profile.offers_visio);
  const [languages, setLanguages] = useState(profile.languages.length ? profile.languages : ["fr"]);
  const [payments, setPayments] = useState(profile.payment_methods.length ? profile.payment_methods : ["on_site"]);
  const [notice, setNotice] = useState(profile.cancellation_hours);
  const [published, setPublished] = useState(profile.published);
  const [services, setServices] = useState<ServiceDraft[]>(
    profile.services.map((item) => ({ ...item, localId: item.id })),
  );
  const [experiences, setExperiences] = useState<ExpDraft[]>(
    profile.experiences.map((item) => ({ ...item, localId: item.id })),
  );
  const [trainings, setTrainings] = useState<TrainDraft[]>(
    profile.trainings.map((item) => ({ ...item, localId: item.id })),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const completeness = useMemo(
    () => careCompleteness({ avatar_url: avatarUrl, title, tagline, domains, services }),
    [avatarUrl, title, tagline, domains, services],
  );

  function toggle<T extends string>(list: T[], value: T, setter: (next: T[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function onAvatar(file: File) {
    const supabase = createClient();
    if (!supabase) return;
    const path = `${profile.expert_id}/avatar-${Date.now()}.${file.name.split(".").pop() ?? "jpg"}`;
    const { error } = await supabase.storage.from("care-avatars").upload(path, file, { upsert: true });
    if (error) {
      setMessage("Upload de la photo impossible.");
      return;
    }
    const { data } = supabase.storage.from("care-avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
  }

  async function onSave(nextPublished = published) {
    setPending(true);
    const result = await saveCarePublicProfile({
      display_name: displayName,
      slug,
      title,
      tagline,
      headline,
      bio,
      approach,
      avatar_url: avatarUrl,
      domains,
      publics,
      city,
      address,
      offers_cabinet: cabinet,
      offers_visio: visio,
      languages,
      payment_methods: payments,
      cancellation_hours: notice,
      published: nextPublished,
      services: services.map((item) => ({
        id: item.id,
        name: item.name,
        domain: item.domain,
        description: item.description,
        duration_min: item.duration_min,
        formats: item.formats,
        price_cents: item.price_cents,
        active: item.active,
      })),
      experiences: experiences.map((item) => ({
        period_label: item.period_label,
        role: item.role,
        organization: item.organization,
        description: item.description,
      })),
      trainings: trainings.map((item) => ({ year: item.year, title: item.title, organization: item.organization })),
    });
    setPending(false);
    setMessage(result.ok ? "Fiche enregistrée." : result.message);
    if (result.ok) setPublished(nextPublished && completeness.canPublish);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="grid gap-8">
        <section className="grid gap-3">
          <h2 className="text-lg font-extrabold">Identité</h2>
          <label className="grid gap-1 text-sm">
            Nom affiché
            <input className={field} value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Slug
            <input className={field} value={slug} onChange={(event) => setSlug(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Titre
            <input className={field} value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Photo
            <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && void onAvatar(event.target.files[0])} />
          </label>
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" /> : null}
        </section>
        <section className="grid gap-3">
          <h2 className="text-lg font-extrabold">Présentation</h2>
          <label className="grid gap-1 text-sm">
            Accroche (140 caractères)
            <input className={field} maxLength={140} value={tagline} onChange={(event) => setTagline(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Encadré
            <input className={field} value={headline} onChange={(event) => setHeadline(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Bio
            <textarea className={field} rows={5} value={bio} onChange={(event) => setBio(event.target.value)} />
          </label>
        </section>
        <section className="grid gap-3">
          <h2 className="text-lg font-extrabold">Approche</h2>
          <textarea className={field} rows={4} value={approach} onChange={(event) => setApproach(event.target.value)} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-extrabold">Domaines</h2>
          <div className="flex flex-wrap gap-2">
            {CARE_DOMAINS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-full px-3 py-1 text-sm ${domains.includes(item.id) ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[#12141A]"}`}
                onClick={() => toggle(domains, item.id, setDomains)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-extrabold">Publics</h2>
          <div className="flex flex-wrap gap-2">
            {CARE_PUBLICS.map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-full px-3 py-1 text-sm ${publics.includes(item) ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[#12141A]"}`}
                onClick={() => toggle(publics, item, setPublics)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>
        <section className="grid gap-3">
          <h2 className="text-lg font-extrabold">Infos pratiques</h2>
          <label className="grid gap-1 text-sm">
            Ville
            <input className={field} value={city} onChange={(event) => setCity(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Adresse
            <input className={field} value={address} onChange={(event) => setAddress(event.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cabinet} onChange={(event) => setCabinet(event.target.checked)} />
            Cabinet
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={visio} onChange={(event) => setVisio(event.target.checked)} />
            Visio
          </label>
          <p className="text-sm">Langues</p>
          {Object.entries(CARE_LANGUAGE_LABELS).map(([id, label]) => (
            <label key={id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={languages.includes(id)} onChange={() => toggle(languages, id, setLanguages)} />
              {label}
            </label>
          ))}
          <p className="text-sm">Paiements</p>
          {Object.entries(CARE_PAYMENT_LABELS).map(([id, label]) => (
            <label key={id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={payments.includes(id)} onChange={() => toggle(payments, id, setPayments)} />
              {label}
            </label>
          ))}
          <label className="grid gap-1 text-sm">
            Délai d’annulation (heures)
            <input className={field} type="number" min={0} value={notice} onChange={(event) => setNotice(Number(event.target.value))} />
          </label>
        </section>
        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Prestations</h2>
            <button
              type="button"
              className="text-sm font-semibold text-[#FFB4B8]"
              onClick={() => {
                const id = nid();
                setServices([
                  ...services,
                  {
                    id,
                    localId: id,
                    expert_id: profile.expert_id,
                    position: services.length,
                    name: "",
                    domain: domains[0] ?? "famille",
                    description: "",
                    duration_min: 60,
                    formats: visio ? ["visio"] : ["cabinet"],
                    price_cents: 0,
                    active: true,
                  },
                ]);
              }}
            >
              Ajouter
            </button>
          </div>
          <CareSortableCards
            items={services.map((item) => ({ ...item, id: item.localId }))}
            onReorder={(next) => setServices(next)}
            render={(item) => (
              <div className="grid gap-2">
                <input className={field} placeholder="Nom" value={item.name} onChange={(event) => setServices(services.map((row) => (row.localId === item.localId ? { ...row, name: event.target.value } : row)))} />
                <select className={field} value={item.domain} onChange={(event) => setServices(services.map((row) => (row.localId === item.localId ? { ...row, domain: event.target.value as CareDomain } : row)))}>
                  {CARE_DOMAINS.map((domain) => (
                    <option key={domain.id} value={domain.id}>
                      {domain.label}
                    </option>
                  ))}
                </select>
                <textarea className={field} placeholder="Description" value={item.description} onChange={(event) => setServices(services.map((row) => (row.localId === item.localId ? { ...row, description: event.target.value } : row)))} />
                <input className={field} type="number" min={1} value={item.duration_min} onChange={(event) => setServices(services.map((row) => (row.localId === item.localId ? { ...row, duration_min: Number(event.target.value) } : row)))} />
                <input className={field} type="number" min={0} value={Math.round(item.price_cents / 100)} onChange={(event) => setServices(services.map((row) => (row.localId === item.localId ? { ...row, price_cents: Math.round(Number(event.target.value) * 100) } : row)))} />
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={item.formats.includes("cabinet")} onChange={(event) => setServices(services.map((row) => (row.localId === item.localId ? { ...row, formats: event.target.checked ? [...row.formats.filter((f) => f !== "cabinet"), "cabinet"] : row.formats.filter((f) => f !== "cabinet") } : row)))} />
                  Cabinet
                </label>
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={item.formats.includes("visio")} onChange={(event) => setServices(services.map((row) => (row.localId === item.localId ? { ...row, formats: event.target.checked ? [...row.formats.filter((f) => f !== "visio"), "visio"] : row.formats.filter((f) => f !== "visio") } : row)))} />
                  Visio
                </label>
                <label className="flex gap-2 text-sm">
                  <input type="checkbox" checked={item.active} onChange={(event) => setServices(services.map((row) => (row.localId === item.localId ? { ...row, active: event.target.checked } : row)))} />
                  Active
                </label>
                <button type="button" className="text-left text-sm text-[#FF4B4B]" onClick={() => setServices(services.filter((row) => row.localId !== item.localId))}>
                  Retirer
                </button>
              </div>
            )}
          />
        </section>
        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Expériences</h2>
            <button type="button" className="text-sm font-semibold text-[#FFB4B8]" onClick={() => setExperiences([...experiences, { id: nid(), localId: nid(), position: experiences.length, period_label: "", role: "", organization: "", description: "" }])}>
              Ajouter
            </button>
          </div>
          <CareSortableCards
            items={experiences.map((item) => ({ ...item, id: item.localId }))}
            onReorder={setExperiences}
            render={(item) => (
              <div className="grid gap-2">
                <input className={field} placeholder="Période" value={item.period_label} onChange={(event) => setExperiences(experiences.map((row) => (row.localId === item.localId ? { ...row, period_label: event.target.value } : row)))} />
                <input className={field} placeholder="Rôle" value={item.role} onChange={(event) => setExperiences(experiences.map((row) => (row.localId === item.localId ? { ...row, role: event.target.value } : row)))} />
                <input className={field} placeholder="Organisation" value={item.organization} onChange={(event) => setExperiences(experiences.map((row) => (row.localId === item.localId ? { ...row, organization: event.target.value } : row)))} />
                <textarea className={field} value={item.description} onChange={(event) => setExperiences(experiences.map((row) => (row.localId === item.localId ? { ...row, description: event.target.value } : row)))} />
                <button type="button" className="text-left text-sm text-[#FF4B4B]" onClick={() => setExperiences(experiences.filter((row) => row.localId !== item.localId))}>
                  Retirer
                </button>
              </div>
            )}
          />
        </section>
        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Formations</h2>
            <button type="button" className="text-sm font-semibold text-[#FFB4B8]" onClick={() => setTrainings([...trainings, { id: nid(), localId: nid(), position: trainings.length, year: "", title: "", organization: "" }])}>
              Ajouter
            </button>
          </div>
          <CareSortableCards
            items={trainings.map((item) => ({ ...item, id: item.localId }))}
            onReorder={setTrainings}
            render={(item) => (
              <div className="grid gap-2">
                <input className={field} placeholder="Année" value={item.year} onChange={(event) => setTrainings(trainings.map((row) => (row.localId === item.localId ? { ...row, year: event.target.value } : row)))} />
                <input className={field} placeholder="Titre" value={item.title} onChange={(event) => setTrainings(trainings.map((row) => (row.localId === item.localId ? { ...row, title: event.target.value } : row)))} />
                <input className={field} placeholder="Organisation" value={item.organization} onChange={(event) => setTrainings(trainings.map((row) => (row.localId === item.localId ? { ...row, organization: event.target.value } : row)))} />
                <button type="button" className="text-left text-sm text-[#FF4B4B]" onClick={() => setTrainings(trainings.filter((row) => row.localId !== item.localId))}>
                  Retirer
                </button>
              </div>
            )}
          />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-extrabold">Open Badges</h2>
          <p className="mb-3 text-sm text-[#9096A3]">Obtenus sur la plateforme — lecture seule.</p>
          {profile.badges.length ? (
            <ul className="grid gap-2">
              {profile.badges.map((badge) => (
                <li key={badge.badge_id} className="rounded-2xl bg-[#12141A] p-3 text-sm">
                  {badge.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#9096A3]">Aucun badge pour le moment.</p>
          )}
          <a href="/beyond-center/formations/ntc" className="mt-3 inline-block text-sm font-semibold text-[#FFB4B8]">
            Obtenir d’autres badges — formations Byound Care
          </a>
        </section>
        {message ? <p role="alert">{message}</p> : null}
        <button type="button" disabled={pending} className="h-11 rounded-full bg-[#F4F5F7] px-5 font-extrabold text-[#07080B]" onClick={() => void onSave()}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      <aside className="h-fit rounded-3xl border border-[#1E2130] bg-[#12141A] p-5">
        <p className="text-sm text-[#9096A3]">Complétude</p>
        <p className="text-3xl font-extrabold">{completeness.percent} %</p>
        {completeness.missing.length ? (
          <ul className="mt-3 list-disc pl-4 text-sm text-[#FFB4B8]">
            {completeness.missing.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm">Prête à publier.</p>
        )}
        <label className="mt-4 flex items-center justify-between gap-3 text-sm">
          Publier
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => {
              const next = event.target.checked;
              if (next && !completeness.canPublish) {
                setMessage(`Impossible de publier : ${completeness.missing.map((item) => item.label).join(", ")}.`);
                return;
              }
              setPublished(next);
              void onSave(next);
            }}
          />
        </label>
        <a className="mt-4 inline-flex h-10 items-center rounded-full bg-[#F4F5F7] px-4 text-sm font-extrabold text-[#07080B]" href={`/care/praticiens/${slug}`} target="_blank" rel="noreferrer">
          Aperçu
        </a>
      </aside>
    </div>
  );
}
