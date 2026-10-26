"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Building2, Calendar, ClipboardList, FolderOpen, ListChecks, Mail } from "lucide-react";
import { Manrope } from "next/font/google";

import {
  CFA_CHALLENGE_QUESTIONS,
  getCfaSpecializationLabel,
  type CfaApplication,
  type CfaApplicationStatus,
} from "@/lib/cfa-applications";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });

const STEPS: Array<{ id: CfaApplicationStatus; label: string }> = [
  { id: "brochure", label: "Fiche cursus" },
  { id: "profile", label: "Candidature" },
  { id: "challenge", label: "Challenge" },
  { id: "dossier", label: "Dossier" },
  { id: "interview", label: "Entretien" },
  { id: "review", label: "Revue" },
  { id: "administrative", label: "Administratif" },
  { id: "admitted", label: "Admis" },
  { id: "contract", label: "En contrat" },
];

const CERFA_FIELDS = [
  ["lastName", "Nom"],
  ["birthName", "Nom de naissance"],
  ["firstNames", "Prénom(s)"],
  ["sex", "Sexe"],
  ["birthDate", "Date de naissance"],
  ["birthCity", "Commune de naissance"],
  ["birthDepartment", "Département de naissance"],
  ["nationality", "Nationalité"],
  ["address", "Adresse"],
  ["phone", "Téléphone"],
  ["email", "E-mail"],
  ["socialSecurityNumber", "Numéro de sécurité sociale"],
  ["priorSituation", "Situation avant le contrat"],
  ["lastClass", "Dernière classe suivie"],
  ["highestDiploma", "Diplôme le plus élevé"],
  ["rqth", "RQTH"],
  ["highLevelAthlete", "Sportif de haut niveau"],
] as const;

const DOCS = [
  ["identity", "Pièce d'identité", "CNI ou passeport, recto verso"],
  ["social_security", "Carte Vitale", "Attestation de droits ou carte"],
  ["diploma", "Diplôme", "Relevé de notes ou dernier diplôme"],
] as const;

const SEX_OPTIONS = ["Masculin", "Féminin"];
const NATIONALITY_OPTIONS = ["Française", "Union européenne", "Hors Union européenne"];
const SITUATION_OPTIONS = ["Scolaire", "Étudiant", "Apprenti", "Salarié", "Demandeur d'emploi", "Inactif"];
const CLASS_OPTIONS = ["Seconde", "Première", "Terminale", "BTS", "Licence", "Master", "Autre"];
const DIPLOMA_OPTIONS = ["Aucun", "CAP / BEP", "Baccalauréat", "Bac+2", "Bac+3 ou plus"];
const YES_NO = ["Oui", "Non"];
const FIELD = "mt-1 h-11 w-full rounded-2xl border border-[#1E2848] bg-[#0B1122] px-3 text-sm text-[#EEF1F8]";

function Segments({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <span className="mt-2 flex gap-0.5" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className="h-1.5 flex-1 rounded-full" style={{ background: index < filled ? color : "#1E2848" }} />
      ))}
    </span>
  );
}

function withCurrent(options: string[], current: string) {
  const value = current.trim();
  return value && !options.includes(value) ? [value, ...options] : options;
}

function maskNss(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "•".repeat(Math.max(value.length, 8));
  return `${digits.slice(0, 1)} ** ** ** *** *** ${digits.slice(-2)}`;
}

function SectionHead({
  step,
  title,
  explain,
  pill,
  color,
  soft,
  icon,
  action,
  expanded,
  onToggle,
}: {
  step: string;
  title: string;
  explain: string;
  pill: string;
  color: string;
  soft: string;
  icon: ReactNode;
  action?: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const ink = color === "#E7A92C" || color === "#14A37F" ? "#04140C" : "#FFFFFF";
  return (
    <header className="-mx-5 -mt-5 mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[#1A2340] px-5 py-4" style={{ background: `linear-gradient(90deg, ${color}2E, transparent 75%)` }}>
      <div className="flex gap-3">
        <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]" style={{ background: color, color: ink }}>{icon}</span>
        <div>
          <p className="text-xs font-extrabold" style={{ color: soft }}>{step}</p>
          <h2 className="text-xl font-extrabold">{title}</h2>
          <p className="text-xs text-[#AEB6CC]">{explain}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {action}
        {onToggle ? (
          <button type="button" aria-expanded={expanded !== false} onClick={onToggle} className="rounded-full border border-[#26304F] px-3 py-1 text-xs font-semibold">
            {expanded === false ? "Déplier" : "Replier"}
          </button>
        ) : null}
        <span className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: `${color}24`, color: soft }}>{pill}</span>
      </div>
    </header>
  );
}

function initialsOf(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "•";
}

type Company = { id: string; company_name: string; siret: string | null; city: string | null; company_address: string | null; apprenticeCount: number };
type Tutor = { id: string; company_id: string; user_id: string | null; first_name: string; last_name: string; email: string; job_title: string | null; invited_at: string | null; last_code_sent_at: string | null; activated_at: string | null; apprenticeCount: number };
type Placement = { id: string; company_id: string; tutor_id: string | null; status: string; started_at: string | null; ended_at: string | null };

function ageLabel(application: CfaApplication, cerfa: Record<string, string>) {
  const birth = cerfa.birthDate;
  if (birth) {
    const date = new Date(birth);
    if (!Number.isNaN(date.getTime())) {
      const now = new Date();
      let age = now.getFullYear() - date.getFullYear();
      const month = now.getMonth() - date.getMonth();
      if (month < 0 || (month === 0 && now.getDate() < date.getDate())) age -= 1;
      if (age >= 0 && age < 120) return `${age} ans`;
    }
  }
  return application.age != null ? `${application.age} ans` : null;
}

function createdLabel(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function FicheApprenant({ id }: { id: string }) {
  const [application, setApplication] = useState<CfaApplication | null>(null);
  const [cerfa, setCerfa] = useState<Record<string, string>>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [companyDraft, setCompanyDraft] = useState({ name: "", siret: "", city: "" });
  const [tutorDraft, setTutorDraft] = useState({ firstName: "", lastName: "", email: "", jobTitle: "" });
  const [confirmAdmit, setConfirmAdmit] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [pickingCompany, setPickingCompany] = useState(false);
  const [pickingTutor, setPickingTutor] = useState(false);
  const [pendingTutorId, setPendingTutorId] = useState("");
  const [showNss, setShowNss] = useState(false);
  const [showRqth, setShowRqth] = useState(false);
  const [refuseKind, setRefuseKind] = useState("");
  const [refuseNote, setRefuseNote] = useState("");
  const [addressHits, setAddressHits] = useState<string[]>([]);
  const [visibleSection, setVisibleSection] = useState("entreprise");
  const [editingInterview, setEditingInterview] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [feeMethod, setFeeMethod] = useState("cheque");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [linkHits, setLinkHits] = useState<Array<{ id: string; firstName: string; lastName: string; email: string; phone: string; sameName: boolean; samePhone: boolean; linkedElsewhere: boolean }>>([]);
  const [linkPending, setLinkPending] = useState<{ id: string; label: string } | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ entreprise: true, candidature: true, inscription: true, documents: true, entretien: true });
  const [saveHint, setSaveHint] = useState("");
  const loadedCerfa = useRef("");

  async function load(quiet = false) {
    if (!quiet) setLoading(true);
    setMessage("");
    try {
      const [boardRes, placeRes] = await Promise.all([
        fetch("/api/super-admin/crm/cfa", { cache: "no-store" }),
        fetch(`/api/super-admin/crm/cfa/placements?applicationId=${encodeURIComponent(id)}`, { cache: "no-store" }),
      ]);
      const board = await boardRes.json();
      const place = await placeRes.json();
      if (!boardRes.ok) throw new Error(board.error || "Chargement impossible");
      if (!placeRes.ok) throw new Error(place.error || "Rattachements indisponibles");
      const found = ((board.applications ?? []) as CfaApplication[]).find((item) => item.id === id) ?? null;
      setApplication(found);
      setCompanies(place.companies ?? []);
      setTutors(place.tutors ?? []);
      setPlacements(place.placements ?? []);
      const stored = found?.cerfa_data ?? {};
      const next: Record<string, string> = {};
      for (const [key] of CERFA_FIELDS) next[key] = stored[key] ?? "";
      next.socialSecurityNumberMask = stored.socialSecurityNumberMask ?? "";
      next.rqth = "";
      next.rqthPresent = stored.rqthPresent ? "1" : "";
      if (found) {
        next.lastName = next.lastName || found.last_name;
        next.firstNames = next.firstNames || found.first_name;
        next.email = next.email || found.email;
        next.phone = next.phone || found.phone || "";
      }
      loadedCerfa.current = JSON.stringify(next);
      setShowNss(false);
      setShowRqth(false);
      setCerfa(next);
      setInterviewNotes(found?.interview_notes ?? "");
      setInterviewAt(
        found?.interview_at
          ? new Date(new Date(found.interview_at).getTime() - new Date(found.interview_at).getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
          : "",
      );
      if (!found) setMessage("Dossier introuvable.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loading) return;
    const nodes = ["entreprise", "candidature", "inscription", "documents", "entretien"]
      .map((sectionId) => document.getElementById(sectionId))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;
    const observer = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current?.target.id) setVisibleSection(current.target.id);
    }, { rootMargin: "-15% 0px -60% 0px", threshold: [0.15, 0.4] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [loading, id]);

  useEffect(() => {
    if (loading || JSON.stringify(cerfa) === loadedCerfa.current) return;
    setSaveHint("Enregistrement…");
    const timer = window.setTimeout(() => {
      const payload = cerfa;
      void fetch("/api/super-admin/crm/cfa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_cerfa", id, cerfa: payload }),
      }).then((response) => {
        if (response.ok) {
          loadedCerfa.current = JSON.stringify(payload);
          setSaveHint("Enregistré");
        } else setSaveHint("Enregistrement impossible");
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [cerfa, loading, id]);

  const currentPlacement = placements.find((item) => item.status === "active" || item.status === "pending") ?? null;
  const company = companies.find((item) => item.id === currentPlacement?.company_id) ?? null;
  const tutor = tutors.find((item) => item.id === currentPlacement?.tutor_id) ?? null;
  const companyTutors = tutors.filter((item) => item.company_id === company?.id);
  const placed = Boolean(currentPlacement?.status === "active" && tutor);
  const visibleCompanies = companies.filter((item) => {
    const query = companyQuery.trim().toLowerCase();
    if (!query) return true;
    return [item.company_name, item.siret, item.city].filter(Boolean).join(" ").toLowerCase().includes(query);
  });

  const filledCerfa = CERFA_FIELDS.filter(([key]) => key === "socialSecurityNumber" ? Boolean((cerfa[key] ?? "").trim() || cerfa.socialSecurityNumberMask) : key === "rqth" ? Boolean((cerfa[key] ?? "").trim() || cerfa.rqthPresent) : Boolean((cerfa[key] ?? "").trim())).length;
  const challengeCount = application ? CFA_CHALLENGE_QUESTIONS.filter((question) => (application.challenge_answers?.[question.id] ?? "").trim()).length : 0;
  const docsReceived = application ? DOCS.filter(([kind]) => application.administrative_document_urls?.[kind]).length : 0;

  const checks = useMemo(() => {
    if (!application) return [];
    return [
      { label: "Réponses au challenge", done: challengeCount === 4 },
      { label: "CV déposé", done: Boolean(application.cv_url) },
      { label: "Coordonnées", done: Boolean(application.email && application.phone) },
      { label: "Inscription complète", done: filledCerfa === CERFA_FIELDS.length },
      { label: "Entreprise et tuteur", done: placed },
      { label: "Pièces justificatives", done: docsReceived === DOCS.length },
      { label: "Frais d'inscription", done: Boolean(application.registration_fee_paid_at) },
    ];
  }, [application, challengeCount, filledCerfa, placed, docsReceived]);

  async function send(url: string, method: "POST" | "PATCH", body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible");
      setPickingCompany(false);
      setShowCompanyForm(false);
      setShowTutorForm(false);
      await load(true);
      setMessage("Enregistré.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Enregistrement impossible");
      setBusy(false);
      return false;
    }
  }

  async function changeStatus(status: CfaApplicationStatus) {
    if (status === "admitted") {
      setConfirmAdmit(true);
      return;
    }
    if (status === "contract" && !placed) return;
    const response = await fetch("/api/super-admin/crm/cfa", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Statut impossible");
      return;
    }
    setMessage("Statut mis à jour.");
    await load(true);
    setMessage("Statut mis à jour.");
  }

  if (loading) {
    return <main className={`${manrope.className} min-h-screen bg-[#0A0F1E] px-6 py-10`}><div className="h-28 animate-pulse rounded-[26px] bg-[#111831]" /></main>;
  }
  if (!application) {
    return (
      <main className={`${manrope.className} min-h-screen bg-[#0A0F1E] px-6 py-10 text-[#EEF1F8]`}>
        <Link href="/super/crm/cfa">‹ CRM Apprenant</Link>
        <p className="mt-4">{message || "Dossier introuvable."}</p>
      </main>
    );
  }

  const stepIndex = STEPS.findIndex((step) => step.id === application.status);
  const initials = `${application.first_name.charAt(0)}${application.last_name.charAt(0)}`.toUpperCase();
  const age = ageLabel(application, cerfa);
  const existingAccount = application.origin === "existing_account" || Boolean(application.profile_id);
  const placementLabel = !company ? "Sans entreprise" : placed ? "Placé" : "Tuteur à assigner";

  return (
    <main className={`${manrope.className} min-h-screen bg-[#0A0F1E] px-4 py-6 text-[#EEF1F8] sm:px-6`}>
      <Link href="/super/crm/cfa" className="text-sm text-[#AEB6CC]">‹ CRM Apprenant</Link>
      {message ? <p className="mt-4 rounded-2xl border border-[#26304F] bg-[#111831] px-4 py-3 text-sm">{message}</p> : null}

      <section className="mt-4 rounded-[26px] border border-[#1A2340] bg-[#111831] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4">
            <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#6E5BFF] text-xl font-extrabold">{initials}</span>
            <div>
              <h1 className="text-[32px] font-extrabold leading-none">{application.first_name} {application.last_name}</h1>
              <p className="mt-2 text-sm text-[#AEB6CC]">
                {getCfaSpecializationLabel(application.specialization)} · {application.email}
                {application.phone ? ` · ${application.phone}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className={existingAccount ? "rounded-full bg-[#0E2A1D] px-3 py-1 font-semibold text-[#6BE3C0]" : "rounded-full bg-[#1A2340] px-3 py-1 font-semibold text-[#AEB6CC]"}>
                  {existingAccount ? "Compte existant" : "Nouveau candidat"}
                </span>
                {age ? <span className="rounded-full bg-[#1A2340] px-3 py-1 text-[#AEB6CC]">{age}</span> : null}
                {application.education_level ? <span className="rounded-full bg-[#1A2340] px-3 py-1 text-[#AEB6CC]">{application.education_level}</span> : null}
                <span className="text-[#5D6785]">Fiche créée le {createdLabel(application.created_at)}</span>
                {application.status === "rejected" ? <span className="rounded-full border border-[#FF8A98] px-3 py-1 font-semibold text-[#FF8A98]">Non retenu</span> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="h-11 rounded-full border border-[#FF8A98] px-4 text-sm font-semibold text-[#FF8A98]" onClick={() => setRejectOpen(true)}>Marquer non retenu</button>
            <a href={`mailto:${application.email}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#26304F] px-4 text-sm font-semibold"><Mail className="h-4 w-4" />Envoyer un email</a>
            <a href="#entretien" onClick={() => setOpenSections((current) => ({ ...current, entretien: true }))} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white"><Calendar className="h-4 w-4" />Planifier l'entretien</a>
          </div>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5D6785]">
            <span>Étape actuelle : <strong className="font-extrabold text-[#EEF1F8]">{STEPS[stepIndex]?.label ?? "Non retenu"}</strong></span>
            <span>Cliquer sur une étape pour changer le statut</span>
          </div>
          <div role="radiogroup" aria-label="Statut de la candidature" className="flex items-center overflow-x-auto pb-1">
            {STEPS.map((step, index) => {
              const active = step.id === application.status;
              const past = stepIndex >= 0 && index < stepIndex;
              const contractReady = application.status === "admitted" && placed;
              const locked = step.id === "contract" && application.status !== "contract" && !contractReady;
              const lockTitle = application.status !== "admitted" && application.status !== "contract"
                ? "Passez d'abord au statut Admis."
                : "Rattachez d'abord une entreprise et un tuteur.";
              const barOn = stepIndex >= index;
              return (
                <div key={step.id} className="flex min-w-[92px] flex-1 items-center">
                  {index > 0 ? <span className={`mx-1 h-1 min-w-3 flex-1 rounded-full ${barOn ? "bg-[#6E5BFF]" : "bg-[#1A2340]"}`} /> : null}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={busy || locked}
                    title={locked ? lockTitle : step.label}
                    onClick={() => void changeStatus(step.id)}
                    className={`h-9 shrink-0 rounded-full px-3 text-[11px] font-extrabold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF] ${active ? "bg-[#6E5BFF] text-white" : past ? "bg-[#241C4A] text-[#B9AFFF]" : "bg-[#0B1122] text-[#5D6785]"} ${locked ? "cursor-not-allowed opacity-45" : ""}`}
                  >
                    {step.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <nav aria-label="Sommaire" className="sticky top-3 z-20 mt-4 flex gap-2 overflow-x-auto min-[900px]:grid min-[900px]:grid-cols-5">
        {[
          { id: "entreprise", label: "Entreprise et tuteur", state: placementLabel, color: "#6E5BFF", done: placed },
          { id: "candidature", label: "Candidature", state: `${challengeCount} / 4 réponses`, color: "#2F7CF6", done: challengeCount === 4 },
          { id: "inscription", label: "Inscription", state: `${filledCerfa} / 17 champs`, color: "#14A37F", done: filledCerfa === CERFA_FIELDS.length },
          { id: "documents", label: "Documents", state: `${docsReceived} / 3 reçus`, color: "#E7A92C", done: docsReceived === DOCS.length },
          { id: "entretien", label: "Entretien", state: application.interview_at ? "Planifié" : "À planifier", color: "#D9459E", done: Boolean(application.interview_at) },
        ].map((tile) => (
          <a key={tile.id} href={`#${tile.id}`} onClick={() => setOpenSections((current) => ({ ...current, [tile.id]: true }))} className={`min-w-[180px] rounded-[20px] border bg-[#111831] px-3 py-3 text-sm min-[900px]:min-w-0 ${visibleSection === tile.id ? "border-[#6E5BFF]" : "border-[#1A2340]"}`}>
            <span className="flex items-center gap-2 font-extrabold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold" style={{ background: tile.color, color: tile.color === "#E7A92C" || tile.color === "#14A37F" ? "#04140C" : "#fff" }}>{tile.done ? "✓" : ""}</span>
              {tile.label}
            </span>
            <span className="mt-1 block text-xs text-[#AEB6CC]">{tile.state}</span>
          </a>
        ))}
      </nav>

      <div className="mt-4 grid items-start gap-4 min-[1200px]:grid-cols-[minmax(0,1.4fr)_320px]">
        <div className="space-y-4">
          <section id="entreprise" className={`scroll-mt-28 overflow-hidden rounded-[26px] border border-[#1A2340] border-t-4 border-t-[#6E5BFF] bg-[#111831] ${openSections.entreprise ? "" : "[&>*:not(header)]:hidden"}`}>
            <header className="flex items-start justify-between gap-3 border-b border-[#1A2340] px-5 py-4" style={{ background: "linear-gradient(90deg, rgba(110,91,255,.18), transparent 75%)" }}>
              <div className="flex gap-3">
                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#6E5BFF]"><Building2 className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-extrabold text-[#B9AFFF]">1 · Placement</p>
                  <h2 className="text-xl font-extrabold">Entreprise et tuteur</h2>
                  <p className="text-xs text-[#AEB6CC]">Rattachez l'alternant à son entreprise d'accueil et à son maître d'apprentissage.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" aria-expanded={openSections.entreprise} onClick={() => setOpenSections((current) => ({ ...current, entreprise: !current.entreprise }))} className="rounded-full border border-[#26304F] px-3 py-1 text-xs font-semibold">{openSections.entreprise ? "Replier" : "Déplier"}</button>
                <span className="rounded-full bg-[#241C4A] px-3 py-1 text-xs font-extrabold text-[#B9AFFF]">{placementLabel}</span>
              </div>
            </header>
            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="rounded-2xl bg-[#0B1122] p-4 md:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">Compte apprenant</p>
                    <p className="mt-1 text-sm text-[#AEB6CC]">
                      {!application.profile_id
                        ? "Pas de compte"
                        : application.origin === "existing_account"
                          ? "Compte existant lié"
                          : "Compte créé à l'admission"}
                    </p>
                    {application.profile_id ? <p className="mt-1 text-xs text-[#5D6785]">{application.email}</p> : null}
                  </div>
                  {!application.profile_id ? (
                    <button type="button" className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-extrabold text-white" onClick={() => setLinkOpen(true)}>Lier à un compte existant</button>
                  ) : application.status !== "admitted" && application.status !== "contract" ? (
                    <button type="button" className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold" onClick={() => void send("/api/super-admin/crm/cfa/accounts", "POST", { action: "unlink", applicationId: id })}>Délier</button>
                  ) : null}
                </div>
                {linkOpen ? (
                  <div className="mt-4 space-y-2">
                    <input value={linkQuery} onChange={(event) => {
                      const value = event.target.value;
                      setLinkQuery(value);
                      if (value.trim().length < 2) { setLinkHits([]); return; }
                      void fetch(`/api/super-admin/crm/cfa/accounts?applicationId=${encodeURIComponent(id)}&q=${encodeURIComponent(value)}`).then(async (response) => {
                        const result = await response.json();
                        if (response.ok) setLinkHits(result.accounts ?? []);
                      });
                    }} placeholder="Nom ou e-mail" aria-label="Rechercher un compte" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#111831] px-3 text-sm" />
                    <ul className="max-h-48 overflow-auto rounded-2xl border border-[#1A2340]">
                      {linkHits.map((account) => (
                        <li key={account.id}>
                          <button type="button" disabled={account.linkedElsewhere} className="block w-full px-3 py-2 text-left text-sm disabled:opacity-40" onClick={() => {
                            const label = `${account.firstName} ${account.lastName}`.trim();
                            if (!account.sameName && !account.samePhone) setLinkPending({ id: account.id, label });
                            else void send("/api/super-admin/crm/cfa/accounts", "POST", { action: "link", applicationId: id, profileId: account.id }).then(() => setLinkOpen(false));
                          }}>
                            <span className="font-semibold">{account.firstName} {account.lastName}</span>
                            <span className="mt-0.5 block text-xs text-[#5D6785]">{[account.email, account.phone].filter(Boolean).join(" · ")}</span>
                            <span className="mt-1 flex gap-2 text-xs text-[#E7A92C]">
                              {account.sameName ? <span>Même nom</span> : null}
                              {account.samePhone ? <span>Même téléphone</span> : null}
                              {!account.sameName && !account.samePhone ? <span>Aucun point commun</span> : null}
                              {account.linkedElsewhere ? <span>Déjà lié à une candidature active</span> : null}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-extrabold">Entreprise d'accueil</p>
                {company && !pickingCompany ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#0B1122] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#241C4A] text-xs font-extrabold">{initialsOf(company.company_name)}</span>
                      <div>
                        <p className="font-extrabold">{company.company_name}</p>
                        <p className="mt-1 text-xs text-[#AEB6CC]">{[company.siret, company.city, `${company.apprenticeCount} alternant${company.apprenticeCount > 1 ? "s" : ""}`].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                    <button type="button" className="rounded-full border border-[#26304F] px-3 py-1.5 text-sm font-semibold" onClick={() => setPickingCompany(true)}>Changer</button>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2">
                    <input value={companyQuery} onChange={(event) => setCompanyQuery(event.target.value)} placeholder="Nom, SIRET, ville" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
                    <ul className="max-h-48 overflow-auto rounded-2xl border border-[#1A2340]">
                      {visibleCompanies.map((item) => (
                        <li key={item.id}>
                          <button type="button" className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[#0B1122]" onClick={() => {
                            if (currentPlacement && !window.confirm("Le rattachement actuel sera clos. L'ancien tuteur n'aura plus accès à cet alternant.")) return;
                            void send("/api/super-admin/crm/cfa/placements", "POST", { action: "set_company", applicationId: id, companyId: item.id });
                          }}>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#241C4A] text-[10px] font-extrabold">{initialsOf(item.company_name)}</span>
                            <span>
                            <span className="font-semibold">{item.company_name}</span>
                            <span className="mt-0.5 block text-xs text-[#5D6785]">{[item.siret, item.city, `${item.apprenticeCount} alternants`].filter(Boolean).join(" · ")}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button type="button" className="text-sm font-semibold text-[#B9AFFF]" onClick={() => setShowCompanyForm((value) => !value)}>+ Créer une entreprise</button>
                    {showCompanyForm ? (
                      <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void send("/api/super-admin/crm/cfa/placements", "POST", { action: "create_company", applicationId: id, companyName: companyDraft.name, siret: companyDraft.siret, city: companyDraft.city }); }}>
                        <input required value={companyDraft.name} onChange={(event) => setCompanyDraft({ ...companyDraft, name: event.target.value })} placeholder="Nom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
                        <input value={companyDraft.siret} onChange={(event) => setCompanyDraft({ ...companyDraft, siret: event.target.value })} placeholder="SIRET" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
                        <input value={companyDraft.city} onChange={(event) => setCompanyDraft({ ...companyDraft, city: event.target.value })} placeholder="Ville" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
                        <button type="submit" disabled={busy} className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white">Créer</button>
                      </form>
                    ) : null}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-extrabold">Tuteur (maître d'apprentissage)</p>
                {!company || pickingCompany ? <p className="mt-3 rounded-2xl border border-dashed border-[#26304F] p-4 text-sm text-[#5D6785]">Choisissez d'abord l'entreprise.</p> : tutor && !pickingTutor ? (
                  <div className="mt-3 rounded-2xl bg-[#0B1122] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8782C] text-xs font-extrabold text-[#2A1305]">{initialsOf(`${tutor.first_name} ${tutor.last_name}`)}</span>
                        <div>
                          <p className="font-extrabold">{tutor.first_name} {tutor.last_name}</p>
                          <p className="text-xs text-[#AEB6CC]">{tutor.job_title || "Maître d'apprentissage"} · {tutor.apprenticeCount} alternant{tutor.apprenticeCount > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <button type="button" className="rounded-full border border-[#26304F] px-3 py-1.5 text-sm font-semibold" onClick={() => { setPickingTutor(true); setPendingTutorId(""); }}>Changer</button>
                    </div>
                    <p className={`mt-3 text-xs font-semibold ${tutor.activated_at ? "text-[#6BE3C0]" : tutor.invited_at ? "text-[#B9AFFF]" : "text-[#5D6785]"}`}>
                      {tutor.activated_at ? "Compte actif" : tutor.invited_at ? "E-mail envoyé · en attente de première connexion" : "Pas encore assigné"}
                    </p>
                    <button type="button" disabled={busy || (tutor.last_code_sent_at ? now - new Date(tutor.last_code_sent_at).getTime() < 60_000 : false)} className="mt-2 text-sm font-semibold text-[#B9AFFF] disabled:opacity-50" onClick={() => void send("/api/super-admin/crm/cfa/placements", "POST", { action: "resend_code", applicationId: id, tutorId: tutor.id })}>
                      {tutor.last_code_sent_at && now - new Date(tutor.last_code_sent_at).getTime() < 60_000
                        ? `Renvoyer dans ${60 - Math.floor((now - new Date(tutor.last_code_sent_at).getTime()) / 1000)} s`
                        : "Renvoyer l'e-mail"}
                    </button>
                  </div>
                ) : (
                  <ul className="mt-3 max-h-48 overflow-auto rounded-2xl border border-[#1A2340]">
                    {companyTutors.map((item) => (
                      <li key={item.id}>
                        <button type="button" className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#0B1122] ${pendingTutorId === item.id ? "bg-[#241C4A]" : ""}`} onClick={() => setPendingTutorId(item.id)}>
                          {item.first_name} {item.last_name}
                          <span className="mt-0.5 block text-xs text-[#5D6785]">{[item.job_title, `${item.apprenticeCount} alternants`].filter(Boolean).join(" · ")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {company && !pickingCompany && (!tutor || pickingTutor) ? (
                  <>
                    {pendingTutorId ? (
                      <div className="mt-3 rounded-2xl bg-[#6E5BFF]/15 p-4 text-sm">
                        <p>{(companyTutors.find((item) => item.id === pendingTutorId)?.activated_at)
                          ? `${companyTutors.find((item) => item.id === pendingTutorId)?.first_name} a déjà un compte tuteur : il recevra un e-mail l'informant que ${application.first_name} ${application.last_name} lui est confié.`
                          : `${companyTutors.find((item) => item.id === pendingTutorId)?.first_name} ${companyTutors.find((item) => item.id === pendingTutorId)?.last_name} recevra un e-mail pour ouvrir son espace tuteur.`}</p>
                        {tutor ? <p className="mt-2 text-xs text-[#AEB6CC]">Le rattachement actuel sera clos.</p> : null}
                        <button type="button" disabled={busy} className="mt-3 h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white" onClick={() => void send("/api/super-admin/crm/cfa/placements", "POST", { action: "set_tutor", applicationId: id, tutorId: pendingTutorId }).then(() => setPickingTutor(false))}>Assigner et prévenir</button>
                      </div>
                    ) : null}
                    <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); void send("/api/super-admin/crm/cfa/placements", "POST", { action: "create_tutor", applicationId: id, ...tutorDraft }); }}>
                      <button type="button" className="text-sm font-semibold text-[#B9AFFF]" onClick={() => setShowTutorForm((value) => !value)}>+ Nouveau tuteur dans cette entreprise</button>
                      {showTutorForm ? (
                        <>
                          <input required aria-label="Prénom" value={tutorDraft.firstName} onChange={(event) => setTutorDraft({ ...tutorDraft, firstName: event.target.value })} placeholder="Prénom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
                          <input required aria-label="Nom" value={tutorDraft.lastName} onChange={(event) => setTutorDraft({ ...tutorDraft, lastName: event.target.value })} placeholder="Nom" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
                          <input required aria-label="E-mail professionnel" type="email" value={tutorDraft.email} onChange={(event) => setTutorDraft({ ...tutorDraft, email: event.target.value })} placeholder="E-mail professionnel" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
                          <input aria-label="Poste" value={tutorDraft.jobTitle} onChange={(event) => setTutorDraft({ ...tutorDraft, jobTitle: event.target.value })} placeholder="Poste" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm" />
                          <p className="text-xs text-[#AEB6CC]">{tutorDraft.firstName || "Le tuteur"} recevra un e-mail pour indiquer son adresse et recevoir un code.</p>
                          <button type="submit" disabled={busy} className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white">Assigner et prévenir</button>
                        </>
                      ) : null}
                    </form>
                  </>
                ) : null}
              </div>
            </div>
            {placements.some((item) => item.status === "ended") ? (
              <details className="border-t border-[#1A2340] px-5 py-4">
                <summary className="cursor-pointer text-sm font-extrabold">Historique des rattachements</summary>
                <ul className="mt-3 space-y-2 text-sm text-[#AEB6CC]">
                  {placements.filter((item) => item.status === "ended").map((item) => {
                    const pastCompany = companies.find((entry) => entry.id === item.company_id);
                    const pastTutor = tutors.find((entry) => entry.id === item.tutor_id);
                    return <li key={item.id}>{pastCompany?.company_name ?? "Entreprise"}{pastTutor ? ` · ${pastTutor.first_name} ${pastTutor.last_name}` : ""}{item.ended_at ? ` · clos le ${createdLabel(item.ended_at)}` : ""}</li>;
                  })}
                </ul>
              </details>
            ) : null}
          </section>

          <section id="candidature" className={`scroll-mt-28 overflow-hidden rounded-[26px] border border-[#1A2340] border-t-4 border-t-[#2F7CF6] bg-[#111831] p-5 ${openSections.candidature ? "" : "[&>*:not(header)]:hidden"}`}>
            <SectionHead step="2 · Candidature" title="Dossier et challenge" explain="Ce que le candidat a écrit pour se présenter." pill={`${challengeCount} / 4 réponses`} color="#2F7CF6" soft="#8DB8FF" icon={<ClipboardList className="h-5 w-5" />} expanded={openSections.candidature} onToggle={() => setOpenSections((current) => ({ ...current, candidature: !current.candidature }))} />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[["Parcours", application.school_background], ["Expériences", application.experiences], ["Motivation", application.motivation_text]].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#0B1122] p-4">
                  <p className="text-xs text-[#5D6785]">{label}</p>
                  <p className="mt-2 text-sm">{value || "Non renseigné"}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm">{application.cv_url ? <a className="text-[#8DB8FF]" href={application.cv_url} target="_blank" rel="noreferrer">CV déposé</a> : <span className="text-[#5D6785]">CV non déposé</span>}</p>
            <div className="mt-4 space-y-2">
              {CFA_CHALLENGE_QUESTIONS.map((question) => {
                const answer = application.challenge_answers?.[question.id]?.trim() ?? "";
                const tone = question.eyebrow === "Raisonnement" ? "bg-[#10284d] text-[#8DB8FF]" : question.eyebrow === "Projection" ? "bg-[#0E2A1D] text-[#6BE3C0]" : question.eyebrow === "Motivation" ? "bg-[#3A2A0E] text-[#F6D68B]" : "bg-[#241C4A] text-[#B9AFFF]";
                return (
                  <details key={question.id} className="rounded-2xl bg-[#0B1122] p-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-extrabold ${tone}`}>{question.eyebrow}</span>
                        <span className="text-sm font-bold">{question.question}</span>
                      </span>
                      <span className="shrink-0 text-xs text-[#5D6785]">{answer ? `${answer.slice(0, 42)}${answer.length > 42 ? "…" : ""}` : "Sans réponse"}</span>
                    </summary>
                    {answer ? <p className="mt-3 text-sm text-[#AEB6CC]">{answer}</p> : null}
                  </details>
                );
              })}
            </div>
          </section>

          <section id="inscription" className={`scroll-mt-28 overflow-hidden rounded-[26px] border border-[#1A2340] border-t-4 border-t-[#14A37F] bg-[#111831] p-5 ${openSections.inscription ? "" : "[&>*:not(header)]:hidden"}`}>
            <SectionHead step="3 · Inscription" title="Informations administratives" explain="Nécessaires au contrat d'apprentissage. Enregistrement automatique." pill={saveHint || `${filledCerfa} / 17 champs`} color="#14A37F" soft="#6BE3C0" icon={<ListChecks className="h-5 w-5" />} expanded={openSections.inscription} onToggle={() => setOpenSections((current) => ({ ...current, inscription: !current.inscription }))} />
            <Segments filled={filledCerfa} total={17} color="#14A37F" />
            {([
              ["Identité", [
                ["lastName", "Nom", "text"],
                ["birthName", "Nom de naissance", "text"],
                ["firstNames", "Prénom(s)", "text"],
                ["sex", "Sexe", "sex"],
              ]],
              ["Naissance et nationalité", [
                ["birthDate", "Date de naissance", "date"],
                ["birthCity", "Commune de naissance", "text"],
                ["birthDepartment", "Département de naissance", "text"],
                ["nationality", "Nationalité", "nationality"],
              ]],
              ["Coordonnées", [
                ["email", "E-mail", "text"],
                ["phone", "Téléphone", "text"],
                ["address", "Adresse", "address"],
                ["socialSecurityNumber", "N° de sécurité sociale", "nss"],
              ]],
              ["Parcours et situation", [
                ["priorSituation", "Situation avant le contrat", "situation"],
                ["lastClass", "Dernière classe suivie", "class"],
                ["highestDiploma", "Diplôme le plus élevé", "diploma"],
                ["highLevelAthlete", "Sportif de haut niveau", "yesno"],
                ["rqth", "RQTH", "rqth"],
              ]],
            ] as const).map(([title, fields]) => (
              <div key={title} className="mt-5">
                <p className="text-sm font-extrabold text-[#6BE3C0]">{title}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {fields.map(([key, label, kind]) => (
                    <label key={key} className="text-xs text-[#AEB6CC]">
                      <span className="flex items-center gap-2">{label}{kind === "rqth" ? <span className="rounded-full bg-[#1A2340] px-2 py-0.5 text-[10px] font-extrabold text-[#F6D68B]">accès restreint</span> : null}</span>
                      {kind === "nss" && (cerfa.socialSecurityNumberMask || cerfa.socialSecurityNumber) && !showNss ? (
                        <span className="mt-1 flex h-11 items-center justify-between rounded-2xl border border-[#1E2848] bg-[#0B1122] px-3 text-sm">
                          <span>{cerfa.socialSecurityNumberMask || maskNss(cerfa.socialSecurityNumber ?? "")}</span>
                          <button type="button" className="font-semibold text-[#6BE3C0]" onClick={() => { void fetch("/api/super-admin/crm/cfa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "audit_reveal", id, field: "socialSecurityNumber" }) }).then(async (response) => { const result = await response.json(); if (response.ok && result.value) { setCerfa((current) => ({ ...current, socialSecurityNumber: result.value })); setShowNss(true); } }); }}>Afficher</button>
                        </span>
                      ) : kind === "text" || kind === "date" || kind === "nss" ? (
                        <input aria-label={label} type={kind === "date" ? "date" : "text"} value={cerfa[key] ?? ""} placeholder={key === "birthName" ? "Si différent" : "À compléter"} onChange={(event) => setCerfa((current) => ({ ...current, [key]: event.target.value }))} className={FIELD} style={kind === "date" ? { colorScheme: "dark" } : undefined} />
                      ) : kind === "address" ? (
                        <span className="relative block">
                          <input aria-label={label} value={cerfa.address ?? ""} placeholder="À compléter" onChange={(event) => {
                            const value = event.target.value;
                            setCerfa((current) => ({ ...current, address: value }));
                            if (value.trim().length < 3) { setAddressHits([]); return; }
                            void fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`).then((response) => response.json()).then((json) => {
                              setAddressHits(((json.features ?? []) as Array<{ properties?: { label?: string } }>).map((feature) => feature.properties?.label ?? "").filter(Boolean));
                            }).catch(() => setAddressHits([]));
                          }} className={FIELD} />
                          {addressHits.length ? (
                            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl border border-[#26304F] bg-[#111831]">
                              {addressHits.map((hit) => (
                                <li key={hit}><button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-[#0B1122]" onClick={() => { setCerfa((current) => ({ ...current, address: hit })); setAddressHits([]); }}>{hit}</button></li>
                              ))}
                            </ul>
                          ) : null}
                        </span>
                      ) : kind === "rqth" && cerfa.rqthPresent && !showRqth ? (
                        <span className="mt-1 flex h-11 items-center justify-between rounded-2xl border border-[#1E2848] bg-[#0B1122] px-3 text-sm">
                          <span>Renseigné</span>
                          <button type="button" className="font-semibold text-[#6BE3C0]" onClick={() => { void fetch("/api/super-admin/crm/cfa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "audit_reveal", id, field: "rqth" }) }).then(async (response) => { const result = await response.json(); if (response.ok) { setCerfa((current) => ({ ...current, rqth: String(result.value ?? "") })); setShowRqth(true); } }); }}>Afficher</button>
                        </span>
                      ) : (
                        <select aria-label={label} value={cerfa[key] ?? ""} onChange={(event) => setCerfa((current) => ({ ...current, [key]: event.target.value }))} className={FIELD}>
                          <option value="">Choisir</option>
                          {withCurrent(kind === "sex" ? SEX_OPTIONS : kind === "nationality" ? NATIONALITY_OPTIONS : kind === "situation" ? SITUATION_OPTIONS : kind === "class" ? CLASS_OPTIONS : kind === "diploma" ? DIPLOMA_OPTIONS : YES_NO, cerfa[key] ?? "").map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section id="documents" className={`scroll-mt-28 overflow-hidden rounded-[26px] border border-[#1A2340] border-t-4 border-t-[#E7A92C] bg-[#111831] p-5 ${openSections.documents ? "" : "[&>*:not(header)]:hidden"}`}>
            <SectionHead
              step="4 · Pièces justificatives"
              title="Documents"
              explain="Pièces à fournir avant la signature du contrat."
              pill={`${docsReceived} / 3 reçus`}
              color="#E7A92C"
              soft="#F6D68B"
              icon={<FolderOpen className="h-5 w-5" />}
              expanded={openSections.documents}
              onToggle={() => setOpenSections((current) => ({ ...current, documents: !current.documents }))}
              action={<label className="cursor-pointer rounded-full border border-[#26304F] px-3 py-2 text-sm font-semibold">
                + Autre
                <input type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) { setMessage("10 Mo maximum."); return; }
                  const body = new FormData();
                  body.set("id", id);
                  body.set("label", file.name);
                  body.set("file", file);
                  setBusy(true);
                  void fetch("/api/super/cfa/admis", { method: "POST", body }).then(async (response) => {
                    const result = await response.json();
                    if (!response.ok) setMessage(result.error || "Dépôt impossible");
                    else await load(true);
                  }).finally(() => setBusy(false));
                }} />
              </label>}
            />
            <div className="mt-4 space-y-2">
              {DOCS.map(([kind, label, detail]) => {
                const url = application.administrative_document_urls?.[kind];
                const review = application.private_files?.[kind]?.review_status;
                const note = application.private_files?.[kind]?.review_note;
                const pill = !url ? "En attente" : review === "validated" ? "Validé" : review === "refused" ? "Refusé" : "Reçu";
                const pillClass = !url ? "bg-[#1A2340] text-[#AEB6CC]" : review === "validated" ? "bg-[#14A37F] text-[#04140C]" : review === "refused" ? "border border-[#FF8A98] text-[#FF8A98]" : "bg-[#3A2A0E] text-[#F6D68B]";
                return (
                  <div key={kind} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#0B1122] px-4 py-3">
                    <div>
                      <p className="text-sm font-extrabold">{label}</p>
                      <p className="text-xs text-[#5D6785]">{detail}</p>
                      {review === "refused" && note ? <p className="mt-1 text-xs text-[#FF8A98]">{note}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-extrabold ${pillClass}`}>{pill}</span>
                      {url ? <a className="text-sm text-[#F6D68B]" href={url} target="_blank" rel="noreferrer">Voir</a> : null}
                      {url && review !== "validated" ? <button type="button" className="text-sm font-semibold text-[#6BE3C0]" onClick={() => void send("/api/super-admin/crm/cfa", "PATCH", { action: "review_document", id, kind, review: "validated" })}>Valider</button> : null}
                      {url && review !== "refused" ? <button type="button" className="text-sm font-semibold text-[#FF8A98]" onClick={() => setRefuseKind(kind)}>Refuser</button> : null}
                      {refuseKind === kind ? (
                        <span className="flex items-center gap-2">
                          <input aria-label="Motif du refus" value={refuseNote} onChange={(event) => setRefuseNote(event.target.value)} placeholder="Motif" className="h-9 rounded-xl border border-[#26304F] bg-[#111831] px-2 text-sm" />
                          <button type="button" className="text-sm font-semibold" onClick={() => { setRefuseKind(""); void send("/api/super-admin/crm/cfa", "PATCH", { action: "review_document", id, kind, review: "refused", note: refuseNote }); }}>Confirmer</button>
                        </span>
                      ) : null}
                      <label className="cursor-pointer text-sm font-semibold">
                        Déposer
                        <input type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) { setMessage("10 Mo maximum."); return; }
                          const body = new FormData();
                          body.set("id", id);
                          body.set("label", label);
                          body.set("kind", kind);
                          body.set("file", file);
                          setBusy(true);
                          void fetch("/api/super/cfa/admis", { method: "POST", body }).then(async (response) => {
                            const result = await response.json();
                            if (!response.ok) setMessage(result.error || "Dépôt impossible");
                            else await load(true);
                          }).finally(() => setBusy(false));
                        }} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-4 min-[1200px]:sticky min-[1200px]:top-4">
          <section className="rounded-[26px] border border-[#1A2340] bg-[#111831] p-5">
            <p className="text-sm text-[#AEB6CC]">Dossier complet</p>
            <p className="text-3xl font-extrabold">{checks.filter((item) => item.done).length}<span className="text-base text-[#5D6785]"> / 7</span></p>
            <Segments filled={checks.filter((item) => item.done).length} total={7} color="#6E5BFF" />
            <ul className="mt-3 space-y-2 text-sm">
              {checks.map((item) => (
                <li key={item.label} className={item.done ? "text-[#6BE3C0]" : "text-[#5D6785]"}>{item.done ? "✓" : "○"} {item.label}</li>
              ))}
            </ul>
          </section>
          <section id="entretien" className={`scroll-mt-28 overflow-hidden rounded-[26px] border border-[#1A2340] border-t-4 border-t-[#D9459E] bg-[#111831] p-5 ${openSections.entretien ? "" : "[&>*:not(header)]:hidden"}`}>
            <SectionHead step="5 · Entretien" title="Planifier l'entretien" explain="La date et le message partent au candidat." pill={application.interview_at ? "Planifié" : "À planifier"} color="#D9459E" soft="#F29BCB" icon={<Calendar className="h-5 w-5" />} expanded={openSections.entretien} onToggle={() => setOpenSections((current) => ({ ...current, entretien: !current.entretien }))} />
            {application.interview_at && !editingInterview ? (
              <div className="mt-3">
                <p className="text-sm">{createdLabel(application.interview_at)}</p>
                <button type="button" className="mt-3 h-10 rounded-full border border-[#26304F] px-4 text-sm font-semibold" onClick={() => setEditingInterview(true)}>Modifier</button>
              </div>
            ) : (
              <>
                <label className="mt-3 block text-xs text-[#AEB6CC]">Date et heure
                  <input aria-label="Date et heure de l'entretien" type="datetime-local" value={interviewAt} onChange={(event) => setInterviewAt(event.target.value)} className="mt-1 h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm text-[#EEF1F8]" style={{ colorScheme: "dark" }} />
                </label>
                <label className="mt-3 block text-xs text-[#AEB6CC]">Message au candidat
                  <textarea aria-label="Message au candidat" value={interviewNotes} onChange={(event) => setInterviewNotes(event.target.value)} rows={4} className="mt-1 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] p-3 text-sm text-[#EEF1F8]" />
                </label>
                <button type="button" disabled={busy} className="mt-3 h-11 w-full rounded-full bg-[#6E5BFF] text-sm font-extrabold text-white" onClick={() => {
                  if (!interviewAt) { setMessage("Choisis une date et une heure."); return; }
                  void fetch("/api/super-admin/crm/cfa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "interview", interviewAt: new Date(interviewAt).toISOString(), interviewNotes }) }).then(async (response) => {
                    const result = await response.json();
                    if (!response.ok) setMessage(result.error || "Entretien impossible");
                    else { setEditingInterview(false); setMessage(result.emailSent ? "Invitation envoyée." : "Entretien enregistré."); await load(true); }
                  });
                }}>Envoyer l'invitation</button>
              </>
            )}
          </section>
          <section className={`rounded-[26px] p-5 ${application.registration_fee_paid_at ? "bg-[#0E2A1D] text-[#6BE3C0]" : "bg-[#3A2A0E] text-[#F6D68B]"}`}>
            <p className="text-sm font-extrabold">Frais d'inscription</p>
            <p className="mt-1 text-xs">{application.registration_fee_paid_at ? `Payé le ${createdLabel(application.registration_fee_paid_at)} · ${{ cheque: "Chèque", transfer: "Virement", card: "CB", cash: "Espèces", covered: "Prise en charge (OPCO / employeur)" }[application.cerfa_data?._fee_method ?? ""] ?? "Moyen non précisé"}` : "En attente"}</p>
            {application.registration_fee_paid_at ? null : (
              <div className="mt-3 flex flex-wrap gap-2">
                <select aria-label="Moyen de paiement" value={feeMethod} onChange={(event) => setFeeMethod(event.target.value)} className="h-10 rounded-full border border-[#E7A92C] bg-transparent px-3 text-sm text-[#F6D68B]">
                  <option value="cheque">Chèque</option>
                  <option value="transfer">Virement</option>
                  <option value="card">CB</option>
                  <option value="cash">Espèces</option>
                  <option value="covered">Prise en charge (OPCO / employeur)</option>
                </select>
                <button type="button" disabled={busy} className="h-10 rounded-full bg-[#E7A92C] px-4 text-sm font-extrabold text-[#2A1F06]" onClick={() => void send("/api/super-admin/crm/cfa", "PATCH", { action: "mark_fee", id, method: feeMethod })}>Marquer payé</button>
              </div>
            )}
          </section>
        </aside>
      </div>

      {confirmAdmit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[26px] bg-[#111831] p-6">
            <h2 className="text-xl font-extrabold">Passer en Admis</h2>
            <p className="mt-3 text-sm text-[#AEB6CC]">
              {existingAccount
                ? "Le rôle apprenant sera ajouté au compte existant. Un e-mail d'information part, sans nouveau code."
                : "Un compte apprenant sera créé. Un code de connexion part par e-mail."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="h-10 rounded-full px-4 text-sm" onClick={() => setConfirmAdmit(false)}>Annuler</button>
              <button type="button" className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white" onClick={() => { setConfirmAdmit(false); void fetch("/api/super-admin/crm/cfa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "admitted" }) }).then(async (response) => { const result = await response.json(); if (!response.ok) setMessage(result.error || "Admission impossible"); else await load(); }); }}>Confirmer</button>
            </div>
          </div>
        </div>
      ) : null}
      {linkPending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-[26px] bg-[#111831] p-6">
            <h2 className="text-xl font-extrabold">Aucun point commun</h2>
            <p className="mt-3 text-sm text-[#E7A92C]">{linkPending.label} n'a ni le même nom ni le même téléphone que cette candidature.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="h-10 rounded-full px-4 text-sm" onClick={() => setLinkPending(null)}>Annuler</button>
              <button type="button" className="h-10 rounded-full bg-[#E7A92C] px-4 text-sm font-extrabold text-[#2A1F06]" onClick={() => { const pending = linkPending; setLinkPending(null); void send("/api/super-admin/crm/cfa/accounts", "POST", { action: "link", applicationId: id, profileId: pending.id, confirmNoMatch: true }).then(() => setLinkOpen(false)); }}>Confirmer le lien</button>
            </div>
          </div>
        </div>
      ) : null}
      {rejectOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form className="w-full max-w-md rounded-[26px] bg-[#111831] p-6" onSubmit={(event) => { event.preventDefault(); setRejectOpen(false); void fetch("/api/super-admin/crm/cfa", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "rejected", decisionNotes: rejectNote }) }).then(async (response) => { const result = await response.json(); if (!response.ok) setMessage(result.error || "Statut impossible"); else { setMessage("Candidature marquée non retenue."); await load(true); } }); }}>
            <h2 className="text-xl font-extrabold">Marquer non retenu</h2>
            <label className="mt-3 block text-sm text-[#AEB6CC]">Motif, facultatif
              <textarea aria-label="Motif" value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} rows={3} className="mt-1 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] p-3 text-sm text-[#EEF1F8]" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="h-10 rounded-full px-4 text-sm" onClick={() => setRejectOpen(false)}>Annuler</button>
              <button type="submit" className="h-10 rounded-full border border-[#FF8A98] px-4 text-sm font-extrabold text-[#FF8A98]">Confirmer</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
