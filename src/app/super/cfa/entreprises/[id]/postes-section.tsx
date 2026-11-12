"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { ActionNotice } from "@/components/cfa/action-notice";
import { CFA_SPECIALIZATIONS, getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { isAlternanceContractType, placedLabel } from "@/lib/cfa/alternance-contract";
import { formatCompanyName, formatPersonName } from "@/lib/cfa/format-org-name";
import type { CompanyApprentice } from "./tutors-section";
import type { CompanyContact } from "./contacts-section";

export type CompanyNeed = {
  id: string;
  title: string;
  cursus_id?: string | null;
  quantity: number;
  start_date?: string | null;
  location?: string | null;
  soft_skill_ids?: string[] | null;
};

export type CompanyOffer = {
  id: string;
  title?: string | null;
  city?: string | null;
  contract_type?: string | null;
  contract_duration?: string | null;
  start_label?: string | null;
  diploma_prepared?: string | null;
  created_at?: string | null;
  applicationCount?: number;
};

export type ProfileSend = {
  application_id: string;
  need_id?: string | null;
  job_offer_id?: string | null;
  sent_to_email?: string | null;
  sent_at: string;
  response?: string | null;
};

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  cursus: string;
  status: string;
  availability: string;
  shareWithCompanies: boolean;
  evaluated: boolean;
  matched: number;
  wanted: number;
};

type Target = { kind: "need" | "offer" | null; id: string; title: string };

function publishedOn(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function PostesSection({
  companyId,
  linked,
  needs,
  offers,
  sends,
  apprentices,
  contacts,
  proposal,
  onProposal,
  onChanged,
  onMessage,
}: {
  companyId: string;
  linked: boolean;
  needs: CompanyNeed[];
  offers: CompanyOffer[];
  sends: ProfileSend[];
  apprentices: CompanyApprentice[];
  contacts: CompanyContact[];
  proposal: Target | null;
  onProposal: (target: Target | null) => void;
  onChanged: () => Promise<void> | void;
  onMessage: (message: string) => void;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<{ state: "working" | "done" | "error"; title: string; detail: string } | null>(null);
  const [query, setQuery] = useState("");
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; siret?: string | null }>>([]);
  const [pendingOrg, setPendingOrg] = useState<{ id: string; name: string } | null>(null);

  async function saveNeed(body: Record<string, unknown>) {
    const response = await fetch(`/api/super-admin/crm/cfa/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) {
      onMessage(result.error || "Enregistrement impossible");
      return;
    }
    await onChanged();
  }

  async function createOffer() {
    setNotice({ state: "working", title: "Nouvelle offre", detail: "Ouverture du formulaire." });
    const response = await fetch(`/api/super-admin/crm/cfa/companies/${companyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_offer" }),
    });
    const result = await response.json();
    if (!response.ok || !result.offerId) {
      setNotice({ state: "error", title: "Offre non créée", detail: result.error || "Création impossible" });
      return;
    }
    router.push(`/dashboard/entreprise/offres/${result.offerId}/edition?step=1`);
  }

  const cards: Array<{
    key: string;
    title: string;
    cursus?: string | null;
    contract?: string | null;
    meta?: string | null;
    placed: number;
    wanted: number;
    offer?: CompanyOffer | null;
    need?: CompanyNeed | null;
  }> = [];

  for (const need of needs) {
    const related = offers.find(
      (offer) =>
        offer.diploma_prepared === need.cursus_id ||
        (offer.title && need.title && offer.title.toLowerCase().includes(need.title.toLowerCase().slice(0, 12))),
    );
    const placed = apprentices.filter(
      (item) => item.placementStatus === "active" && (!need.cursus_id || item.specialization === need.cursus_id),
    ).length;
    cards.push({
      key: `need-${need.id}`,
      title: need.title,
      cursus: need.cursus_id ? getCfaSpecializationLabel(need.cursus_id) : null,
      contract: related?.contract_type || "Contrat d'apprentissage",
      meta: [need.start_date || related?.contract_duration, formatCompanyName(need.location || related?.city || "")].filter(Boolean).join(" · ") || null,
      placed,
      wanted: need.quantity,
      offer: related ?? null,
      need,
    });
  }

  for (const offer of offers) {
    if (cards.some((card) => card.offer?.id === offer.id)) continue;
    cards.push({
      key: `offer-${offer.id}`,
      title: offer.title || "Sans titre",
      cursus: offer.diploma_prepared
        ? getCfaSpecializationLabel(offer.diploma_prepared) === offer.diploma_prepared
          ? offer.diploma_prepared
          : getCfaSpecializationLabel(offer.diploma_prepared)
        : null,
      contract: offer.contract_type,
      meta: [offer.contract_duration, formatCompanyName(offer.city)].filter(Boolean).join(" · ") || null,
      placed: 0,
      wanted: 1,
      offer,
      need: null,
    });
  }

  return (
    <section id="postes" className="scroll-mt-28 rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#5EDCC326] text-[#5EDCC3]">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[17px] font-extrabold text-[#F2F4FA]">Postes et offres</h2>
            <p className="text-xs text-[#9AA3BD]">Besoins du CFA et offres publiées sur Byound.</p>
          </div>
        </div>
        <button type="button" className="h-9 rounded-full border border-[#26304F] px-4 text-xs font-extrabold" onClick={() => void createOffer()}>
          ＋ Poste
        </button>
      </header>
      <ActionNotice open={Boolean(notice)} state={notice?.state ?? "working"} title={notice?.title ?? ""} detail={notice?.detail} onClose={() => setNotice(null)} />

      <ul className="space-y-3">
        {cards.map((card) => {
          const ratio = placedLabel(card.placed, card.wanted);
          const badContract = card.offer?.contract_type && !isAlternanceContractType(card.offer.contract_type);
          return (
            <li key={card.key} className="rounded-[18px] bg-[#0B1122] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-extrabold text-[#F2F4FA]">{card.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {card.cursus ? <span className="rounded-full bg-[#143226] px-2.5 py-1 text-[11px] font-extrabold text-[#6BE39B]">{card.cursus}</span> : null}
                    {card.contract ? <span className="rounded-full bg-[#14233A] px-2.5 py-1 text-[11px] font-extrabold text-[#8DB8FF]">{card.contract}</span> : null}
                    {card.meta ? <span className="rounded-full bg-[#1A2340] px-2.5 py-1 text-[11px] font-extrabold text-[#B7BED3]">{card.meta}</span> : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-extrabold leading-none text-[#F2F4FA]">{ratio.ratio}</p>
                  <p className="mt-1 text-[11px] text-[#9AA3BD]">{ratio.unit}</p>
                </div>
              </div>

              {badContract ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-[#F2CF6B55] bg-[#3A2A0E55] px-3 py-2.5">
                  <p className="text-sm text-[#F2CF6B]">
                    Cette offre est en « {card.offer?.contract_type} » : elle ne permet pas de signer un contrat en alternance
                  </p>
                  <a
                    href={`/dashboard/entreprise/offres/${card.offer?.id}/edition?step=1`}
                    className="h-8 shrink-0 rounded-full border border-[#F2CF6B88] px-3 text-xs font-extrabold text-[#F2CF6B] inline-flex items-center"
                  >
                    Modifier l&apos;offre
                  </a>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#1A2340] pt-3">
                <p className="text-xs text-[#9AA3BD]">
                  {card.offer
                    ? `Offre publiée sur Byound le ${publishedOn(card.offer.created_at)} · ${card.offer.applicationCount ?? 0} candidature${(card.offer.applicationCount ?? 0) > 1 ? "s" : ""} reçue${(card.offer.applicationCount ?? 0) > 1 ? "s" : ""}`
                    : "Aucune offre publiée"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {card.offer ? (
                    <a href={`/dashboard/ecole/offres/${card.offer.id}`} className="inline-flex h-9 items-center rounded-full border border-[#26304F] px-3 text-xs font-semibold">
                      Voir les candidatures
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="h-9 rounded-full bg-[#6E5BFF] px-3 text-xs font-extrabold text-white"
                    onClick={() =>
                      onProposal(
                        card.need
                          ? { kind: "need", id: card.need.id, title: card.need.title }
                          : card.offer
                            ? { kind: "offer", id: card.offer.id, title: card.offer.title || "Offre" }
                            : { kind: null, id: "", title: "" },
                      )
                    }
                  >
                    Proposer un profil
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {!cards.length ? <li className="text-sm text-[#6C7593]">Aucun poste pour le moment.</li> : null}
      </ul>

      {!linked ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[#26304F] p-4">
          <p className="text-sm">Cette entreprise n&apos;a pas de compte Byound Business : ses offres ne peuvent pas s&apos;afficher ici.</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void fetch(`/api/super-admin/crm/cfa/organizations?q=${encodeURIComponent(query)}`).then(async (response) => {
                const result = await response.json();
                setOrgs(result.organizations ?? []);
              });
            }}
          >
            <input aria-label="Compte Byound" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom ou SIRET" className="h-11 flex-1 rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
            <button type="submit" className="h-11 rounded-full border border-[#26304F] px-4 text-xs font-extrabold">
              Relier à un compte Byound Business
            </button>
          </form>
          <ul className="mt-3 space-y-2">
            {orgs.map((org) => (
              <li key={org.id}>
                <button type="button" className="text-sm text-[#B9AFFF]" onClick={() => setPendingOrg(org)}>
                  {formatCompanyName(org.name)}
                  {org.siret ? ` · ${org.siret}` : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {pendingOrg ? (
        <div className="mt-4 rounded-2xl bg-[#241C4A] p-4">
          <p className="text-sm">Rattacher {formatCompanyName(pendingOrg.name)} ? Le rattachement sera journalisé.</p>
          <button type="button" className="mt-3 h-9 rounded-full bg-[#6E5BFF] px-4 text-xs font-extrabold text-white" onClick={() => void saveNeed({ action: "link_organization", organizationId: pendingOrg.id }).then(() => setPendingOrg(null))}>
            Confirmer
          </button>
        </div>
      ) : null}

      {proposal ? (
        <ProfilesPanel
          companyId={companyId}
          target={proposal}
          needs={needs}
          offers={offers}
          sends={sends}
          contacts={contacts}
          onClose={() => onProposal(null)}
          onChanged={onChanged}
          onMessage={onMessage}
        />
      ) : null}
    </section>
  );
}

function ProfilesPanel({
  companyId,
  target,
  needs,
  offers,
  sends,
  contacts,
  onClose,
  onChanged,
  onMessage,
}: {
  companyId: string;
  target: Target;
  needs: CompanyNeed[];
  offers: CompanyOffer[];
  sends: ProfileSend[];
  contacts: CompanyContact[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
  onMessage: (message: string) => void;
}) {
  const [current, setCurrent] = useState(target);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [title, setTitle] = useState(target.kind ? (target.kind === "need" ? `Poste : ${target.title}` : `Offre : ${target.title}`) : "Profils à proposer");
  const [needsCursus, setNeedsCursus] = useState(false);
  const [alias, setAlias] = useState("");
  const [contactId, setContactId] = useState(contacts.find((item) => (item.roles ?? []).includes("main"))?.id ?? "");
  const [pending, setPending] = useState<{ id: string; name: string; email: string } | null>(null);
  const [notice, setNotice] = useState<{ state: "working" | "done" | "error"; title: string; detail: string } | null>(null);
  const changedRef = useRef(onChanged);
  const messageRef = useRef(onMessage);
  changedRef.current = onChanged;
  messageRef.current = onMessage;

  useEffect(() => {
    if (!current.kind || !current.id) return;
    const params = new URLSearchParams(current.kind === "need" ? { needId: current.id } : { offerId: current.id });
    void fetch(`/api/super-admin/crm/cfa/companies/${companyId}/proposals?${params}`).then(async (response) => {
      const result = await response.json();
      if (!response.ok) {
        messageRef.current(result.error || "Profils indisponibles");
        return;
      }
      setTitle(result.title || title);
      setCandidates(result.candidates ?? []);
      setNeedsCursus(Boolean(result.needsCursus));
      setAlias(String(result.alias ?? ""));
    });
  }, [companyId, current]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      const snapshot = pending;
      setPending(null);
      void fetch(`/api/super-admin/crm/cfa/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_profile",
          applicationId: snapshot.id,
          needId: current.kind === "need" ? current.id : undefined,
          jobOfferId: current.kind === "offer" ? current.id : undefined,
          contactId: contactId || undefined,
        }),
      }).then(async (response) => {
        const result = await response.json();
        if (!response.ok) setNotice({ state: "error", title: "Présentation non envoyée", detail: result.error || "Envoi impossible" });
        else {
          setNotice({ state: "done", title: "Présentation envoyée", detail: `${snapshot.name} est transmis au contact.` });
          await changedRef.current();
        }
      });
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [pending, companyId, current.kind, current.id, contactId]);

  function latest(applicationId: string) {
    return sends.find((item) => item.application_id === applicationId && (current.kind === "need" ? item.need_id === current.id : item.job_offer_id === current.id));
  }

  return (
    <div className="mt-5 rounded-[24px] border border-[#6E5BFF] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-extrabold">{title}</h3>
        <button type="button" className="text-sm" onClick={onClose}>
          Fermer
        </button>
      </div>
      {!current.kind ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-[#AEB6CC]">Choisissez un poste ou une offre.</p>
          {needs.map((need) => (
            <button key={need.id} type="button" className="block text-sm font-semibold text-[#B9AFFF]" onClick={() => setCurrent({ kind: "need", id: need.id, title: need.title })}>
              Poste : {need.title}
            </button>
          ))}
          {offers.map((offer) => (
            <button key={offer.id} type="button" className="block text-sm font-semibold text-[#B9AFFF]" onClick={() => setCurrent({ kind: "offer", id: offer.id, title: offer.title || "Offre" })}>
              Offre : {offer.title || "Sans titre"}
            </button>
          ))}
        </div>
      ) : null}
      {needsCursus ? (
        <label className="mt-3 block text-sm">
          Aucun cursus ne correspond{alias ? ` à « ${alias} »` : ""}.
          <select
            className="mt-2 h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3"
            defaultValue=""
            onChange={(event) => {
              const cursusId = event.target.value;
              if (!cursusId) return;
              const apply = () => {
                const params = new URLSearchParams({ offerId: current.id, cursusId });
                void fetch(`/api/super-admin/crm/cfa/companies/${companyId}/proposals?${params}`).then(async (response) => {
                  const result = await response.json();
                  if (!response.ok) return;
                  setCandidates(result.candidates ?? []);
                  setNeedsCursus(false);
                });
              };
              if (!alias) {
                apply();
                return;
              }
              void fetch(`/api/super-admin/crm/cfa/companies/${companyId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "set_cursus_alias", alias, cursusId }),
              }).then(apply);
            }}
          >
            <option value="">Choisir le cursus</option>
            {CFA_SPECIALIZATIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {contacts.length > 1 ? (
        <label className="mt-3 block text-sm">
          Destinataire
          <select aria-label="Contact destinataire" value={contactId} onChange={(event) => setContactId(event.target.value)} className="mt-1 h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3">
            {contacts
              .filter((item) => item.email)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {formatPersonName(`${item.first_name} ${item.last_name}`)} · {item.email}
                </option>
              ))}
          </select>
        </label>
      ) : null}
      <ul className="mt-4 space-y-3">
        {candidates.map((candidate) => {
          const sent = latest(candidate.id);
          const sentLabel = sent ? `✓ Envoyé le ${publishedOn(sent.sent_at)}` : "";
          return (
            <li key={candidate.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0B1122] p-3">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#241C4A] text-xs font-extrabold">{`${candidate.firstName.charAt(0)}${candidate.lastName.charAt(0)}`.toUpperCase()}</span>
                <div>
                  <p className="font-extrabold">{formatPersonName(`${candidate.firstName} ${candidate.lastName}`)}</p>
                  <p className="text-xs text-[#AEB6CC]">
                    {candidate.cursus} · {candidate.status} · {candidate.availability}
                  </p>
                  <p className="text-xs text-[#AEB6CC]">{candidate.evaluated ? `${candidate.matched} / ${candidate.wanted} soft skills` : "non évalué"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${candidate.shareWithCompanies ? "bg-[#143226] text-[#6BE3C0]" : "bg-[#3A2A0E] text-[#F6D68B]"}`}>{candidate.shareWithCompanies ? "Accord donné" : "Accord à demander"}</span>
                {sent?.response === "interested" ? <span className="rounded-full bg-[#14A37F] px-3 py-1 text-xs font-extrabold text-[#04140C]">Intéressé</span> : null}
                {sent?.response === "declined" ? <span className="rounded-full bg-[#1A2340] px-3 py-1 text-xs font-extrabold text-[#AEB6CC]">Décliné</span> : null}
                {sent && !sent.response ? <span className="text-xs font-extrabold text-[#6BE3C0]">{sentLabel}</span> : null}
                {!sent && candidate.shareWithCompanies ? (
                  <button
                    type="button"
                    className="h-9 rounded-full bg-[#6E5BFF] px-3 text-xs font-extrabold text-white"
                    onClick={() => {
                      setNotice({ state: "working", title: "Envoi", detail: "Vous pouvez encore annuler." });
                      setPending({
                        id: candidate.id,
                        name: `${candidate.firstName} ${candidate.lastName}`,
                        email: contacts.find((item) => item.id === contactId)?.email || contacts.find((item) => item.email)?.email || "",
                      });
                    }}
                  >
                    Envoyer le profil
                  </button>
                ) : null}
                {!sent && !candidate.shareWithCompanies ? (
                  <button
                    type="button"
                    className="h-9 rounded-full border border-[#E7A92C] px-3 text-xs font-extrabold text-[#F6D68B]"
                    onClick={() => {
                      setNotice({ state: "working", title: "Demande d'accord", detail: `E-mail en cours pour ${candidate.firstName}.` });
                      void fetch(`/api/super-admin/crm/cfa/companies/${companyId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "request_consent",
                          applicationId: candidate.id,
                          needId: current.kind === "need" ? current.id : undefined,
                          jobOfferId: current.kind === "offer" ? current.id : undefined,
                        }),
                      }).then(async (response) => {
                        const result = await response.json();
                        setNotice(
                          response.ok
                            ? { state: "done", title: "Demande envoyée", detail: `${candidate.firstName} reçoit le lien vers l'offre.` }
                            : { state: "error", title: "E-mail non envoyé", detail: result.error || "Envoi impossible" },
                        );
                      });
                    }}
                  >
                    Demander l&apos;accord
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {pending ? (
        <p className="mt-4 rounded-full bg-[#241C4A] px-4 py-2 text-sm">
          Profil de {pending.name} envoyé à {pending.email || "le contact"} ·{" "}
          <button
            type="button"
            className="font-extrabold"
            onClick={() => {
              setPending(null);
              setNotice(null);
            }}
          >
            Annuler
          </button>
        </p>
      ) : null}
      <ActionNotice open={Boolean(notice)} state={notice?.state ?? "working"} title={notice?.title ?? ""} detail={notice?.detail} onClose={() => setNotice(null)} />
    </div>
  );
}
