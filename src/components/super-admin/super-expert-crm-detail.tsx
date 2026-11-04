"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BadgeCheck,
  Briefcase,
  Check,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Languages,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Star,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
import { parseExpertDocuments, parseExpertInternalNotes, parseExpertRegistrationMeta } from "@/lib/expert/admin-expert-types";
import { buildExpertTimeline, computeExpertKpis, getExpertCoverUrl, getExpertCvUrl, getExpertPortfolioUrl } from "@/lib/expert/expert-crm-utils";
import { expertProfileChecks, skillCards, skillLabels } from "@/lib/expert/fiche-profile";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import { CONTRIBUTOR_ROLES, parseContributorProfile, type ContributorRole } from "@/lib/expert/contributor-profile";
import { EXPERT_MAIL_TEMPLATES } from "@/lib/expert/expert-mail-templates";
import { ExpertFormationProposals } from "@/components/super-admin/expert-formation-proposals";
import { CrmEmailsClient } from "@/app/super/crm/emails/crm-emails-client";
import { SectionCard, SectionHeader, TintPill, fullDate, shortDate } from "@/components/super-admin/expert-fiche-ui";
import type { FormationProposal } from "@/lib/expert/formation-proposals";

type BadgeOption = { id: string; name: string; imageUrl?: string | null; domain?: string | null };
type Draft = {
  roles: ContributorRole[];
  jobTitle: string;
  showOnHomepage: boolean;
  homepageOrder: string;
  cursus: string[];
  badges: string[];
};
type SentMail = {
  id: string;
  subject: string;
  html: string;
  status: string;
  sender_email: string | null;
  template_label: string | null;
  created_at: string;
};

const TABS = [
  { id: "profil", label: "Profil" },
  { id: "roles", label: "Rôles et visibilité" },
  { id: "cursus", label: "Cursus et badges" },
  { id: "missions", label: "Missions" },
  { id: "documents", label: "Documents" },
  { id: "mail", label: "Mail" },
  { id: "historique", label: "Historique" },
] as const;

const TRACKS = [
  { code: "NTC", title: "Business & Sales", color: "#8B7BFF" },
  { code: "MEM", title: "Retail & Luxury", color: "#F2A3C7" },
  { code: "REM", title: "Management", color: "#8DB8FF" },
  { code: "RDC", title: "Business Development", color: "#5EDCC3" },
];

const EXPECTED_DOCS = [
  { label: "CV", test: (name: string) => /\bcv\b/i.test(name) },
  { label: "Diplômes", test: (name: string) => /dipl/i.test(name) },
  { label: "Attestations", test: (name: string) => /attest/i.test(name) },
  { label: "Pièces administratives", test: (name: string) => /admin|siret|kbis|assurance|rc/i.test(name) },
];

const ROLE_COPY: Record<ContributorRole, string> = {
  expert: "Valide uniquement des Open Badges.",
  formateur: "Donne des cours en présentiel, vidéo ou visio.",
};

function relativeDay(value: string | null | undefined) {
  if (!value) return undefined;
  const days = Math.round((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Il y a 1 jour";
  return `Il y a ${days} jours`;
}

function personName(first: string, last: string) {
  const nice = (value: string) => {
    const text = value.trim();
    if (!text) return "";
    return text.charAt(0).toLocaleUpperCase("fr-FR") + text.slice(1);
  };
  return [nice(first), nice(last)].filter(Boolean).join(" ");
}

function buildDraft(expert: AdminExpertRow): Draft {
  const profile = parseContributorProfile(expert.references, expert.headline);
  const selected = Array.isArray(expert.open_badges)
    ? expert.open_badges
        .map((badge) => (badge && typeof badge === "object" ? String((badge as { id?: string }).id ?? "") : ""))
        .filter(Boolean)
    : [];
  return {
    roles: profile.roles,
    jobTitle: profile.jobTitle,
    showOnHomepage: profile.showOnHomepage,
    homepageOrder: profile.homepageOrder == null ? "" : String(profile.homepageOrder),
    cursus: CFA_SPECIALIZATIONS.filter((item) => (expert.specialties ?? []).includes(item.label)).map((item) => item.value),
    badges: selected,
  };
}

function changeCount(draft: Draft, base: string) {
  const saved = JSON.parse(base) as Draft;
  const same = (left: string[], right: string[]) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
  return [
    same(draft.roles, saved.roles),
    draft.jobTitle === saved.jobTitle,
    draft.showOnHomepage === saved.showOnHomepage,
    draft.homepageOrder === saved.homepageOrder,
    same(draft.cursus, saved.cursus),
    same(draft.badges, saved.badges),
  ].filter((item) => !item).length;
}

async function cropSquare(file: File) {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const edge = Math.min(size, 1200);
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Recadrage impossible");
  ctx.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, edge, edge);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Recadrage impossible");
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

function linesOf(value: string) {
  return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

export function SuperExpertCrmDetail({
  expert,
  basePath = "/super/experts",
  proposals = [],
  initialTab = "profil",
  initialTemplate = null,
}: {
  expert: AdminExpertRow;
  basePath?: string;
  proposals?: FormationProposal[];
  initialTab?: string;
  initialTemplate?: string | null;
}) {
  const router = useRouter();
  const serverDraft = useMemo(() => buildDraft(expert), [expert]);
  const serverKey = JSON.stringify(serverDraft);
  const [draft, setDraft] = useState<Draft>(serverDraft);
  const [base, setBase] = useState(serverKey);
  const [tab, setTab] = useState(TABS.some((item) => item.id === initialTab) ? initialTab : "profil");
  const [templateId, setTemplateId] = useState<string | null>(initialTemplate);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prompt, setPrompt] = useState<null | "reject" | "needs_info">(null);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [photo, setPhoto] = useState(expert.photo_url || expert.avatar_url || "");
  const [logoUrl, setLogoUrl] = useState(parseContributorProfile(expert.references, expert.headline).companyLogoUrl ?? "");
  const [uploading, setUploading] = useState<"photo" | "logo" | null>(null);
  const [bioOpen, setBioOpen] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillForm, setSkillForm] = useState({ domains: "", specialties: "", formats: "", audiences: "", zones: "", languages: "", availabilities: "" });
  const [badges, setBadges] = useState<BadgeOption[]>([]);
  const [cursusQuery, setCursusQuery] = useState("");
  const [badgeQuery, setBadgeQuery] = useState("");
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [emails, setEmails] = useState<SentMail[]>([]);
  const [openMail, setOpenMail] = useState<SentMail | null>(null);
  const applied = useRef(serverKey);

  const meta = parseExpertRegistrationMeta(expert.references);
  const documents = parseExpertDocuments(expert.references);
  const notes = parseExpertInternalNotes(expert.references);
  const timeline = useMemo(() => buildExpertTimeline(expert), [expert]);
  const kpis = useMemo(() => computeExpertKpis(expert, meta), [expert, meta]);
  const portfolioUrl = getExpertPortfolioUrl(meta);
  const coverUrl = getExpertCoverUrl(meta);
  const cvUrl = getExpertCvUrl(expert);
  const checks = expertProfileChecks(expert, portfolioUrl, draft.cursus.length);
  const done = checks.filter((item) => item.ok).length;
  const missing = checks.find((item) => !item.ok);
  const cards = skillCards(expert);
  const name = personName(expert.first_name ?? "", expert.last_name ?? "");
  const initials = `${(expert.first_name ?? "?").charAt(0)}${(expert.last_name ?? "").charAt(0)}`.toUpperCase();
  const approvedAt = notes.find((item) => item.action === "approved" && item.at)?.at;
  const lastActivityAt = [...notes].filter((item) => item.at).sort((a, b) => +new Date(b.at!) - +new Date(a.at!))[0]?.at ?? expert.created_at;
  const pending = expert.review_status !== "approved";
  const certified = Boolean(expert.is_certified_beyond || expert.certification_status === "certified");
  const changes = changeCount(draft, base);
  const paragraphs = [expert.bio, expert.bio_long].filter(Boolean).join("\n\n").split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const visibleParagraphs = bioOpen ? paragraphs : paragraphs.slice(0, 2);

  useEffect(() => {
    if (applied.current === serverKey) return;
    applied.current = serverKey;
    if (JSON.stringify(draft) === base) {
      setDraft(serverDraft);
      setBase(serverKey);
    }
  }, [serverKey, serverDraft, draft, base]);

  useEffect(() => {
    void fetch("/api/super-admin/experts/catalog")
      .then((response) => response.json())
      .then((result) => setBadges(result.badges ?? []))
      .catch(() => setBadges([]));
  }, []);

  useEffect(() => {
    if (tab !== "mail") return;
    void fetch(`/api/super/experts/${expert.id}/emails`)
      .then((response) => response.json())
      .then((result) => setEmails(result.emails ?? []))
      .catch(() => setEmails([]));
  }, [tab, expert.id]);

  const go = (next: string, modele?: string | null) => {
    setTab(next);
    setTemplateId(modele ?? null);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    if (modele) url.searchParams.set("modele", modele);
    else url.searchParams.delete("modele");
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
  };

  const runReview = async (action: "approve" | "reject" | "needs_info") => {
    if ((action === "reject" || action === "needs_info") && !message.trim()) {
      toast.error("Veuillez saisir un message.");
      setPrompt(action);
      return;
    }
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/experts/${expert.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message: message.trim() || undefined }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.error || "Erreur");
      toast.success(out.emailed ? "Action enregistrée. E-mail envoyé." : "Modifications enregistrées.");
      setPrompt(null);
      setMessage("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setLoading(null);
    }
  };

  const runAction = async (action: string, payload: Record<string, unknown> = {}) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/super/experts/${expert.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.error || "Erreur");
      toast.success("Mise à jour enregistrée.");
      if (action === "add_note") setNote("");
      if (action === "update_referential") setEditingSkills(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setLoading(null);
    }
  };

  const saveDraft = async () => {
    setLoading("save");
    try {
      const res = await fetch(`/api/super/experts/${expert.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_assignments",
          cursus: draft.cursus,
          openBadges: badges.length
            ? badges.filter((badge) => draft.badges.includes(badge.id)).map((badge) => ({ id: badge.id, name: badge.name }))
            : (Array.isArray(expert.open_badges) ? expert.open_badges : []).filter((badge) => badge && typeof badge === "object" && draft.badges.includes(String((badge as { id?: string }).id ?? ""))),
          roles: draft.roles,
          jobTitle: draft.jobTitle,
          showOnHomepage: draft.showOnHomepage,
          homepageOrder: draft.homepageOrder.trim() === "" ? null : Number(draft.homepageOrder),
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.error || "Enregistrement impossible");
      setBase(JSON.stringify(draft));
      toast.success("Enregistré.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setLoading(null);
    }
  };

  const uploadPhoto = async (file: File) => {
    setUploading("photo");
    try {
      const cropped = await cropSquare(file);
      const body = new FormData();
      body.set("photo", cropped);
      const res = await fetch(`/api/super/experts/${expert.id}/photo`, { method: "POST", body });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Envoi impossible");
      setPhoto(out.photoUrl);
      toast.success("Photo enregistrée.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setUploading(null);
    }
  };

  const uploadLogo = async (file: File) => {
    setUploading("logo");
    try {
      const body = new FormData();
      body.set("logo", file);
      const res = await fetch(`/api/super/experts/${expert.id}/company-logo`, { method: "POST", body });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Envoi impossible");
      setLogoUrl(out.companyLogoUrl ?? "");
      toast.success("Logo enregistré.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setUploading(null);
    }
  };

  const openSkillEditor = () => {
    const zones = ((meta?.geographic_zones as string[] | undefined) ?? (expert.regions as string[]) ?? []).join("\n");
    setSkillForm({
      domains: cards.map((card) => card.label).join("\n"),
      specialties: skillLabels(expert.specialties).join("\n"),
      formats: ((expert.formats_supported as string[]) ?? []).join("\n"),
      audiences: ((meta?.audiences as string[]) ?? []).join("\n"),
      zones,
      languages: ((meta?.languages as string[]) ?? []).join("\n"),
      availabilities: ((meta?.availabilities as string[]) ?? []).join("\n"),
    });
    setEditingSkills(true);
  };

  const status = !expert.is_active
    ? "Suspendu"
    : expert.review_status === "approved"
      ? "Validé"
      : expert.review_status === "rejected"
        ? "Refusé"
        : expert.review_status === "needs_info"
          ? "Informations demandées"
          : "En attente";
  const siteState = !draft.showOnHomepage ? "Masqué" : photo ? "Activé" : "En attente";
  const duplicateNames = [...badges.reduce((map, badge) => map.set(badge.name, (map.get(badge.name) ?? 0) + 1), new Map<string, number>())]
    .filter(([, count]) => count > 1)
    .map(([label]) => label);

  const counters: Record<string, number | null> = {
    cursus: draft.cursus.length || null,
    missions: kpis.missionsCount,
    documents: documents.length || null,
  };

  return (
    <div className="relative mx-auto max-w-[1440px] text-white">
      <p className="text-sm text-[#9AA3BD]">
        <Link href={basePath} className="hover:text-white">Formateurs et experts</Link>
        <span className="mx-2">›</span>
        <span className="text-white">{name || "Fiche"}</span>
      </p>

      <section className="relative mt-4 overflow-hidden rounded-[28px] border border-[#1A2340]" style={{ background: "linear-gradient(180deg, #1B2550 0%, #111831 100%)" }}>
        {coverUrl ? <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" /> : null}
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#6E5BFF] opacity-30 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-5">
              <div className="relative h-28 w-28 shrink-0">
                {photo ? (
                  <Image src={photo} alt={name} fill className="rounded-[28px] object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-[28px] border border-dashed border-[#9AA3BD] text-3xl font-extrabold text-[#9AA3BD]">
                    {initials}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white text-[#0A0F1E]">
                  <Plus className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploading === "photo"}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void uploadPhoto(file);
                    }}
                  />
                </label>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#6E5BFF26] px-3 py-1 text-xs font-extrabold text-[#C9C2FF]">{status}</span>
                  {draft.roles.map((role) => (
                    <span key={role} className="rounded-full bg-[#111831] px-3 py-1 text-xs font-extrabold text-white">
                      {role === "expert" ? "Expert" : "Formateur"}
                    </span>
                  ))}
                  {certified ? (
                    <span className="rounded-full bg-[#F5C85C26] px-3 py-1 text-xs font-extrabold text-[#F5C85C]">Byound Certified</span>
                  ) : expert.wants_certification ? (
                    <span className="rounded-full bg-[#F5C85C26] px-3 py-1 text-xs font-extrabold text-[#F5C85C]">Byound Certified demandé</span>
                  ) : null}
                </div>
                <h1 className="mt-3 text-[36px] font-extrabold leading-none tracking-tight">{name || "Nom à préciser"}</h1>
                <p className="mt-2 text-base text-[#9AA3BD]">{draft.jobTitle || "Poste à préciser"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#9AA3BD]">
                  {expert.email ? (
                    <button type="button" onClick={() => go("mail")} className="inline-flex items-center gap-1.5 text-white">
                      <Mail className="h-3.5 w-3.5" />
                      {expert.email}
                    </button>
                  ) : null}
                  {expert.linkedin_url ? (
                    <a href={expert.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn ↗
                    </a>
                  ) : null}
                  {portfolioUrl ? (
                    <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
                      <ExternalLink className="h-3.5 w-3.5" /> Portfolio ↗
                    </a>
                  ) : null}
                  {cvUrl ? (
                    <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-white">
                      <FileText className="h-3.5 w-3.5" /> CV
                    </a>
                  ) : null}
                  <span>Inscrit le {fullDate(expert.created_at)}{approvedAt ? ` · validé le ${fullDate(approvedAt)}` : ""}</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {pending ? (
                <>
                  <button type="button" disabled={loading !== null} onClick={() => void runReview("approve")} className="rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-[#0A0F1E] disabled:opacity-60">
                    {loading === "approve" ? "…" : "Valider"}
                  </button>
                  <button type="button" disabled={loading !== null} onClick={() => setPrompt("reject")} className="rounded-full border border-[#26304F] px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-60">
                    Refuser
                  </button>
                </>
              ) : (
                <Link href="/super/open-badges/badgeclasses/new" className="rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-[#0A0F1E]">
                  Créer un Open Badge
                </Link>
              )}
              <div className="relative">
                <button type="button" onClick={(event) => { event.stopPropagation(); setMenuOpen((value) => !value); }} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#26304F] text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-[#26304F] bg-[#111831] p-2 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                    <MenuButton onClick={() => { setMenuOpen(false); void runAction("toggle_active"); }}>{expert.is_active ? "Suspendre" : "Réactiver"}</MenuButton>
                    <MenuButton onClick={() => { setMenuOpen(false); setPrompt("reject"); }}>Refuser</MenuButton>
                    <MenuButton onClick={() => { setMenuOpen(false); setPrompt("needs_info"); }}>Demander des informations</MenuButton>
                    <MenuButton onClick={() => { setMenuOpen(false); void runAction("set_certified", { certified: true }); }}>Byound Certified</MenuButton>
                    <MenuButton onClick={() => { setMenuOpen(false); void runAction("toggle_care"); }}>{expert.is_care_expert ? "Retirer de Care" : "Afficher dans Care"}</MenuButton>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi icon={Briefcase} color="#8B7BFF" label="Missions" value={kpis.missionsCount != null ? String(kpis.missionsCount) : "0"} />
            <Kpi icon={User} color="#8DB8FF" label="Expérience" value={kpis.yearsExperience ?? "—"} />
            <Kpi icon={Star} color="#F5C85C" label="Note moyenne" value={kpis.rating != null ? String(kpis.rating).replace(".", ",") : "—"} hint={kpis.rating == null ? "Après la 1re mission" : undefined} />
            <Kpi icon={Clock} color="#6BE39B" label="Dernière activité" value={shortDate(lastActivityAt)} hint={relativeDay(lastActivityAt)} />
            <Kpi icon={BadgeCheck} color="#F2CF6B" label="Profil complet" value={`${done} / ${checks.length}`} hint={missing ? `Il manque ${missing.missing}` : "Complet"} hintColor={missing ? "#F2CF6B" : "#6BE39B"} />
          </div>
        </div>
      </section>

      <div className="mt-6 flex gap-6 overflow-x-auto border-b border-[#1A2340]">
        {TABS.map((item) => (
          <button key={item.id} type="button" onClick={() => go(item.id, item.id === "mail" ? templateId : null)} className={cn("flex shrink-0 items-center gap-2 border-b-2 pb-3 text-sm font-extrabold", tab === item.id ? "border-[#8B7BFF] text-white" : "border-transparent text-[#9AA3BD]")}>
            {item.label}
            {counters[item.id] ? <span className="rounded-full bg-[#1A2340] px-2 py-0.5 text-[11px]">{counters[item.id]}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "profil" ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <SectionCard color="#A99BFF">
                <SectionHeader icon={User} color="#A99BFF" title="Présentation" subtitle="Texte affiché sur sa fiche publique" />
                <div className="max-w-[720px] px-6 pb-6 pt-4 text-[16px] leading-[1.7] text-[#E7EAF5]">
                  {visibleParagraphs.length ? visibleParagraphs.map((paragraph) => <p key={paragraph} className="mb-4 whitespace-pre-wrap last:mb-0">{paragraph}</p>) : <p className="text-[#9AA3BD]">Aucune présentation.</p>}
                  {paragraphs.length > 2 && !bioOpen ? (
                    <button type="button" onClick={() => setBioOpen(true)} className="font-extrabold text-[#A99BFF]">Lire toute la présentation ›</button>
                  ) : null}
                </div>
              </SectionCard>

              <SectionCard color="#8DB8FF">
                <SectionHeader icon={Award} color="#8DB8FF" title="Compétences et référentiel" subtitle={`${cards.length} domaines · ${skillLabels(expert.specialties).length} spécialités`} action={<TintPill color="#8DB8FF" onClick={openSkillEditor}>Modifier</TintPill>} />
                <div className="space-y-4 px-6 pb-6 pt-4">
                  {editingSkills ? (
                    <div className="grid gap-3">
                      <SkillField label="Domaines" value={skillForm.domains} onChange={(domains) => setSkillForm({ ...skillForm, domains })} />
                      <SkillField label="Spécialités" value={skillForm.specialties} onChange={(specialties) => setSkillForm({ ...skillForm, specialties })} />
                      <SkillField label="Formats" value={skillForm.formats} onChange={(formats) => setSkillForm({ ...skillForm, formats })} />
                      <SkillField label="Publics" value={skillForm.audiences} onChange={(audiences) => setSkillForm({ ...skillForm, audiences })} />
                      <SkillField label="Zone" value={skillForm.zones} onChange={(zones) => setSkillForm({ ...skillForm, zones })} />
                      <SkillField label="Langues" value={skillForm.languages} onChange={(languages) => setSkillForm({ ...skillForm, languages })} />
                      <SkillField label="Disponibilités" value={skillForm.availabilities} onChange={(availabilities) => setSkillForm({ ...skillForm, availabilities })} />
                      <div className="flex gap-2">
                        <button type="button" disabled={loading !== null} onClick={() => void runAction("update_referential", { domains: linesOf(skillForm.domains), specialties: linesOf(skillForm.specialties), formats: linesOf(skillForm.formats), audiences: linesOf(skillForm.audiences), zones: linesOf(skillForm.zones), languages: linesOf(skillForm.languages), availabilities: linesOf(skillForm.availabilities) })} className="rounded-full bg-[#8DB8FF] px-4 py-2 text-sm font-extrabold text-[#0A0F1E] disabled:opacity-60">Enregistrer</button>
                        <button type="button" onClick={() => setEditingSkills(false)} className="rounded-full px-4 py-2 text-sm font-extrabold text-[#9AA3BD]">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-3 md:grid-cols-2">
                        {cards.map((card) => (
                          <div key={card.id} className="rounded-2xl p-4" style={{ background: `${card.color}18`, border: `1px solid ${card.color}33` }}>
                            <p className="text-sm font-extrabold" style={{ color: card.color }}>{card.label}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {card.specialties.map((item) => <span key={item} className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${card.color}26`, color: card.color }}>{item}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <MetaRow icon={Globe} label="Formats" values={(expert.formats_supported as string[]) ?? []} />
                      <MetaRow icon={Users} label="Publics" values={(meta?.audiences as string[]) ?? []} />
                      <MetaRow icon={MapPin} label="Zone" values={(meta?.geographic_zones as string[]) ?? (expert.regions as string[]) ?? []} />
                      <MetaRow icon={Languages} label="Langues" values={(meta?.languages as string[]) ?? []} />
                      <MetaRow icon={Clock} label="Disponibilités" values={(meta?.availabilities as string[]) ?? []} />
                    </>
                  )}
                </div>
              </SectionCard>

              <SectionCard color="#B7BED3">
                <SectionHeader icon={Clock} color="#B7BED3" title="Historique" action={<TintPill color="#B7BED3" onClick={() => go("historique")}>Tout voir</TintPill>} />
                <div className="px-6 pb-6 pt-4"><Timeline events={timeline.slice(0, 3)} /></div>
              </SectionCard>
              <ExpertFormationProposals proposals={proposals} />
            </div>
            <div className="space-y-6">
              <TodoCard expert={expert} photo={photo} documents={documents.length} certified={certified} pending={pending} onMail={go} onValidate={() => void runReview("approve")} onExamine={() => document.getElementById("byound-certified")?.scrollIntoView({ behavior: "smooth" })} />
              <SiteCard photo={photo} name={name} job={draft.jobTitle} state={siteState} order={draft.homepageOrder} visible={draft.showOnHomepage} onVisible={(showOnHomepage) => setDraft({ ...draft, showOnHomepage })} onOrder={(homepageOrder) => setDraft({ ...draft, homepageOrder })} onAsk={() => go("mail", "accord")} />
              <SectionCard color="#F5C85C" id="byound-certified">
                <SectionHeader icon={Award} color="#F5C85C" title="Byound Certified" subtitle={certified ? "Label obtenu" : expert.wants_certification ? "Certification demandée" : "Certification non demandée"} />
                <div className="flex flex-wrap gap-2 px-6 pb-6 pt-4">
                  {!certified ? (
                    <button type="button" disabled={loading !== null} onClick={() => void runAction("set_certified", { certified: true })} className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#0A0F1E] disabled:opacity-60">Lancer le parcours</button>
                  ) : null}
                  {!certified && expert.wants_certification ? (
                    <button type="button" disabled={loading !== null} onClick={() => void runAction("add_note", { note: "Demande Byound Certified refusée" })} className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">Refuser</button>
                  ) : null}
                </div>
              </SectionCard>
              <section className="overflow-hidden rounded-[28px] border border-[#2A2550] bg-[#1E1A3A]">
                <SectionHeader icon={MessageSquare} color="#C9C2FF" title="Notes internes" subtitle="Visibles par Byound seulement" />
                <ul className="mt-4 space-y-3 px-6">
                  {notes.filter((item) => item.action === "internal_note").length === 0 ? <li className="text-sm text-[#9AA3BD]">Aucune note.</li> : null}
                  {notes.filter((item) => item.action === "internal_note").map((item, index) => (
                    <li key={`${item.at}-${index}`} className="text-sm text-[#E7EAF5]">
                      <p>{item.message}</p>
                      <p className="mt-1 text-xs text-[#9AA3BD]">Byound · {item.at ? new Date(item.at).toLocaleString("fr-FR") : ""}</p>
                    </li>
                  ))}
                </ul>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ajouter une note…" className="mx-6 mt-4 min-h-[72px] w-[calc(100%-3rem)] rounded-2xl border border-[#2A2550] bg-[#14122C] px-3 py-2 text-sm text-white outline-none" />
                <button type="button" disabled={loading !== null || !note.trim()} onClick={() => void runAction("add_note", { note: note.trim() })} className="mx-6 mb-6 mt-2 rounded-full bg-[#C9C2FF] px-4 py-2 text-sm font-extrabold text-[#1E1A3A] disabled:opacity-50">Enregistrer la note</button>
              </section>
            </div>
          </div>
        ) : null}

        {tab === "roles" ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {CONTRIBUTOR_ROLES.map((role) => {
                const on = draft.roles.includes(role);
                return (
                  <button key={role} type="button" onClick={() => setDraft({ ...draft, roles: on ? draft.roles.filter((item) => item !== role) : [...draft.roles, role] })} className="block w-full rounded-[28px] border p-6 text-left" style={{ borderColor: on ? "#6E5BFF" : "#1A2340", background: on ? "#1B2550" : "#111831" }}>
                    <span className="flex items-center justify-between">
                      <span className="text-[18px] font-extrabold">{role === "expert" ? "Expert" : "Formateur"}</span>
                      <span className={cn("h-7 w-12 rounded-full p-1", on ? "bg-[#6E5BFF]" : "bg-[#26304F]")}><span className={cn("block h-5 w-5 rounded-full bg-white transition", on && "translate-x-5")} /></span>
                    </span>
                    <span className="mt-2 block text-sm text-[#9AA3BD]">{ROLE_COPY[role]}</span>
                  </button>
                );
              })}
              <SectionCard color="#8DB8FF">
                <SectionHeader icon={User} color="#8DB8FF" title="Logo entreprise" subtitle="Affiché sur la photo" />
                <div className="flex flex-wrap items-center gap-3 px-6 pb-6 pt-4">
                  {logoUrl ? <img src={logoUrl} alt="" className="h-14 w-14 rounded-2xl bg-white object-contain p-1.5" /> : <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-[#26304F] text-xs text-[#9AA3BD]">Logo</span>}
                  <label className="cursor-pointer rounded-full border border-[#26304F] px-4 py-2 text-sm font-extrabold">
                    {uploading === "logo" ? "Envoi…" : "Choisir un logo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadLogo(file); }} />
                  </label>
                  {logoUrl ? <button type="button" className="text-sm font-extrabold text-[#9AA3BD]" onClick={() => { setUploading("logo"); void fetch(`/api/super/experts/${expert.id}/company-logo`, { method: "DELETE" }).then(() => { setLogoUrl(""); setUploading(null); router.refresh(); }); }}>Retirer</button> : null}
                </div>
              </SectionCard>
              <label className="block text-sm font-extrabold text-white">
                Poste sous la photo
                <input value={draft.jobTitle} onChange={(event) => setDraft({ ...draft, jobTitle: event.target.value })} className="mt-2 h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm font-medium outline-none" />
              </label>
            </div>
            <SiteCard photo={photo} name={name} job={draft.jobTitle} state={siteState} order={draft.homepageOrder} visible={draft.showOnHomepage} onVisible={(showOnHomepage) => setDraft({ ...draft, showOnHomepage })} onOrder={(homepageOrder) => setDraft({ ...draft, homepageOrder })} onAsk={() => go("mail", "accord")} />
          </div>
        ) : null}

        {tab === "cursus" ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard color="#8B7BFF">
              <SectionHeader icon={Award} color="#8B7BFF" title="Cursus où il intervient" subtitle="Il peut être proposé sur les missions de ces cursus." action={<TintPill color="#8B7BFF">{draft.cursus.length} sélectionnés</TintPill>} />
              <div className="px-6 pb-6 pt-4">
                <input value={cursusQuery} onChange={(event) => setCursusQuery(event.target.value)} placeholder="Rechercher un cursus" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm outline-none" />
                <div className="mt-4 space-y-4">
                  {TRACKS.map((track) => {
                    const items = CFA_SPECIALIZATIONS.filter((item) => item.group.startsWith(track.code) && item.label.toLowerCase().includes(cursusQuery.toLowerCase()));
                    const selected = items.filter((item) => draft.cursus.includes(item.value)).length;
                    if (!items.length) return null;
                    return (
                      <div key={track.code}>
                        <p className="text-sm font-extrabold" style={{ color: track.color }}>{track.code} · {track.title} <span className="text-[#9AA3BD]">{selected} / {items.length}</span></p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {items.map((item) => {
                            const on = draft.cursus.includes(item.value);
                            return (
                              <button key={item.value} type="button" onClick={() => setDraft({ ...draft, cursus: on ? draft.cursus.filter((value) => value !== item.value) : [...draft.cursus, item.value] })} className="rounded-full px-3 py-1.5 text-sm font-bold" style={{ background: on ? "#6E5BFF" : "#0B1122", color: "white", border: "1px solid #26304F" }}>
                                {on ? <Check className="mr-1 inline h-3.5 w-3.5" /> : null}{item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
            <SectionCard color="#5EDCC3">
              <SectionHeader icon={BadgeCheck} color="#5EDCC3" title="Open Badges qu'il peut valider" subtitle="Réservé aux experts : active le rôle Expert." action={!draft.roles.includes("expert") ? <TintPill color="#5EDCC3" onClick={() => setDraft({ ...draft, roles: [...draft.roles, "expert"] })}>Activer Expert</TintPill> : null} />
              <div className="px-6 pb-6 pt-4">
                {duplicateNames.map((label) => (
                  <div key={label} className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-[#F2CF6B26] px-4 py-3 text-sm text-[#F2CF6B]">
                    <span>« {label} » existe en double dans le catalogue des badges.</span>
                    <button type="button" onClick={() => { setBadgeQuery(label); setShowAllBadges(true); }} className="rounded-full bg-[#F2CF6B] px-3 py-1 text-xs font-extrabold text-[#0A0F1E]">Voir</button>
                  </div>
                ))}
                <div className={cn(!draft.roles.includes("expert") && "pointer-events-none opacity-45")}>
                <input value={badgeQuery} onChange={(event) => setBadgeQuery(event.target.value)} placeholder="Rechercher un badge" className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm outline-none" />
                <ul className="mt-3 space-y-2">
                  {(badgeQuery || showAllBadges ? badges : badges.slice(0, 6)).filter((badge) => badge.name.toLowerCase().includes(badgeQuery.toLowerCase())).map((badge) => (
                    <li key={badge.id}>
                      <label className="flex items-center gap-3 rounded-2xl border border-[#1A2340] bg-[#0B1122] px-3 py-2">
                        {badge.imageUrl ? <img src={badge.imageUrl} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#d7dbe8] to-[#8d93a8]" />}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-extrabold">{badge.name}</span>
                          {badge.domain ? <span className="block text-xs text-[#9AA3BD]">{badge.domain}</span> : null}
                        </span>
                        <input type="checkbox" checked={draft.badges.includes(badge.id)} onChange={() => setDraft({ ...draft, badges: draft.badges.includes(badge.id) ? draft.badges.filter((id) => id !== badge.id) : [...draft.badges, badge.id] })} className="h-4 w-4 accent-[#5EDCC3]" />
                      </label>
                    </li>
                  ))}
                </ul>
                {!badgeQuery && !showAllBadges && badges.length > 6 ? (
                  <button type="button" onClick={() => setShowAllBadges(true)} className="mt-3 text-sm font-extrabold text-[#5EDCC3]">Voir les {badges.length - 6} autres badges ›</button>
                ) : null}
                </div>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {tab === "missions" ? (
          <SectionCard color="#8B7BFF">
            <SectionHeader icon={Briefcase} color="#8B7BFF" title="Missions" subtitle="Chiffre déclaré à l'inscription" />
            <p className="px-6 pb-6 pt-4 text-sm text-[#9AA3BD]">{kpis.missionsCount ? `${kpis.missionsCount} mission${kpis.missionsCount > 1 ? "s" : ""} enregistrée${kpis.missionsCount > 1 ? "s" : ""}.` : "Aucune mission enregistrée."}</p>
          </SectionCard>
        ) : null}

        {tab === "documents" ? (
          <SectionCard color="#8DB8FF">
            <SectionHeader icon={FileText} color="#8DB8FF" title="Documents" subtitle="CV, diplômes, attestations, pièces administratives" action={<TintPill color="#8DB8FF" onClick={() => go("mail", "documents")}>Demander les documents manquants</TintPill>} />
            <div className="grid gap-6 px-6 pb-6 pt-4 lg:grid-cols-2">
              <div>
                <p className="text-sm font-extrabold">Transmis</p>
                <ul className="mt-3 space-y-2">
                  {documents.length === 0 ? <li className="text-sm text-[#9AA3BD]">Aucun document transmis.</li> : null}
                  {documents.map((doc, index) => {
                    const label = String(doc.label ?? doc.name ?? "Document");
                    const date = String(doc.uploaded_at ?? doc.created_at ?? doc.at ?? "");
                    return (
                      <li key={index} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] px-4 py-3">
                        <p className="text-sm font-extrabold">{label}</p>
                        <p className="mt-1 text-xs text-[#9AA3BD]">{date ? fullDate(date) : "Date non précisée"}</p>
                        {doc.url ? (
                          <a href={String(doc.url)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-extrabold text-[#8DB8FF]">Aperçu et téléchargement</a>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <p className="text-sm font-extrabold">Attendus</p>
                <ul className="mt-3 space-y-2">
                  {EXPECTED_DOCS.map((item) => {
                    const found = documents.some((doc) => item.test(String(doc.label ?? doc.name ?? "")));
                    return <li key={item.label} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] px-4 py-3 text-sm">{item.label} <span className="text-[#9AA3BD]">{found ? "· reçu" : "· manquant"}</span></li>;
                  })}
                </ul>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {tab === "mail" ? (
          <SectionCard color="#8DB8FF">
            <SectionHeader icon={Mail} color="#8DB8FF" title="Mail" subtitle="Écrire à cet expert" />
            <div className="px-6 pb-6 pt-4">
              <CrmEmailsClient
                lockedRecipient={{ name: name || "Expert", email: expert.email ?? "" }}
                expertId={expert.id}
                templates={EXPERT_MAIL_TEMPLATES}
                initialTemplateId={templateId}
                variables={{ prenom: expert.first_name ?? "", nom: expert.last_name ?? "", lien_espace: "https://www.byound.fr/dashboard/expert" }}
                onSent={() => {
                  void fetch(`/api/super/experts/${expert.id}/emails`).then((response) => response.json()).then((result) => setEmails(result.emails ?? []));
                  router.refresh();
                }}
              />
              <div className="mt-8">
                <p className="text-sm font-extrabold">E-mails envoyés</p>
                <ul className="mt-3 space-y-2">
                  {emails.length === 0 ? <li className="text-sm text-[#9AA3BD]">Aucun e-mail envoyé depuis cette fiche.</li> : null}
                  {emails.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => setOpenMail(item)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#1A2340] bg-[#0B1122] px-4 py-3 text-left">
                        <span>
                          <span className="block text-sm font-extrabold">{item.subject}</span>
                          <span className="mt-1 block text-xs text-[#9AA3BD]">{fullDate(item.created_at)} · {item.sender_email || "Byound"}</span>
                        </span>
                        <span className="text-xs font-extrabold text-[#8DB8FF]">{item.status}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {tab === "historique" ? (
          <SectionCard color="#B7BED3">
            <SectionHeader icon={Clock} color="#B7BED3" title="Historique" subtitle="Inscription, validation, notes et e-mails" />
            <div className="px-6 pb-6 pt-4"><Timeline events={timeline} /></div>
          </SectionCard>
        ) : null}
      </div>

      {changes > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-4 rounded-full border border-[#26304F] bg-[#111831] px-5 py-3 shadow-2xl">
            <span className="text-sm font-extrabold">{changes} modification{changes > 1 ? "s" : ""} non enregistrée{changes > 1 ? "s" : ""}</span>
            <button type="button" onClick={() => setDraft(JSON.parse(base) as Draft)} className="text-sm font-extrabold text-[#9AA3BD]">Annuler</button>
            <button type="button" disabled={loading === "save"} onClick={() => void saveDraft()} className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-60">{loading === "save" ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </div>
      ) : null}

      {prompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-[#26304F] bg-[#111831] p-6">
            <p className="text-lg font-extrabold">{prompt === "reject" ? "Refuser le profil" : "Demander des informations"}</p>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message envoyé à l'expert" className="mt-4 min-h-[120px] w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm outline-none" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPrompt(null)} className="rounded-full px-4 py-2 text-sm font-extrabold text-[#9AA3BD]">Annuler</button>
              <button type="button" disabled={loading !== null} onClick={() => void runReview(prompt)} className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#0A0F1E] disabled:opacity-60">Envoyer</button>
            </div>
          </div>
        </div>
      ) : null}

      {openMail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpenMail(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-[28px] bg-white" onClick={(event) => event.stopPropagation()}>
            <iframe title={openMail.subject} sandbox="" srcDoc={openMail.html} className="h-[70vh] w-full bg-white" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({ children, onClick }: { children: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-[#1A2340]">{children}</button>;
}

function Kpi({ icon: Icon, color, label, value, hint, hintColor = "#9AA3BD" }: { icon: typeof User; color: string; label: string; value: string; hint?: string; hintColor?: string }) {
  return (
    <div className="rounded-[24px] border border-[#1A2340] bg-[#0B1122] px-4 py-4">
      <div className="flex items-center gap-2 text-[13px] text-[#9AA3BD]">
        <Icon className="h-4 w-4" style={{ color }} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      {hint ? <p className="mt-1 text-xs font-bold" style={{ color: hintColor }}>{hint}</p> : null}
    </div>
  );
}

function MetaRow({ icon: Icon, label, values }: { icon: typeof User; label: string; values: string[] }) {
  return (
    <div className="flex gap-3 border-t border-[#1A2340] py-3 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#8DB8FF]" />
      <span className="w-36 shrink-0 font-extrabold">{label}</span>
      <span className="text-[#9AA3BD]">{values.length ? values.join(" · ") : "—"}</span>
    </div>
  );
}

function SkillField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-extrabold text-[#9AA3BD]">
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-[64px] w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm font-medium text-white outline-none" />
    </label>
  );
}

function Timeline({ events }: { events: ReturnType<typeof buildExpertTimeline> }) {
  return (
    <ol>
      {events.map((event, index) => (
        <li key={event.id} className="relative flex gap-4 pb-5 last:pb-0">
          {index < events.length - 1 ? <span className="absolute left-[7px] top-4 h-full w-px bg-[#26304F]" /> : null}
          <span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ background: event.type === "approved" ? "#6BE39B" : event.type === "rejected" ? "#FF8B8B" : event.type === "certified" ? "#F5C85C" : event.type === "needs_info" ? "#F2CF6B" : "#8DB8FF" }} />
          <div>
            <p className="text-sm font-extrabold">{event.label}</p>
            {event.message ? <p className="mt-1 text-sm text-[#9AA3BD]">{event.message}</p> : null}
            <p className="mt-1 text-xs text-[#9AA3BD]">{event.type === "registration" ? "L'expert" : "Byound"} · {new Date(event.at).toLocaleString("fr-FR")}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function TodoCard({
  expert,
  photo,
  documents,
  certified,
  pending,
  onMail,
  onValidate,
  onExamine,
}: {
  expert: AdminExpertRow;
  photo: string;
  documents: number;
  certified: boolean;
  pending: boolean;
  onMail: (tab: string, template: string) => void;
  onValidate: () => void;
  onExamine: () => void;
}) {
  const items = [
    !photo ? { color: "#F2CF6B", title: "Ajouter une photo", text: "Obligatoire pour apparaître sur la page d'accueil.", action: "Demander la photo", onClick: () => onMail("mail", "photo") } : null,
    documents === 0 ? { color: "#8DB8FF", title: "Aucun document transmis", text: "CV, diplômes, attestations, pièces administratives.", action: "Demander les documents", onClick: () => onMail("mail", "documents") } : null,
    expert.wants_certification && !certified ? { color: "#F5C85C", title: "Examiner la demande Byound Certified", text: "Parcours demandé.", action: "Examiner", onClick: onExamine } : null,
    pending ? { color: "#6BE39B", title: "Profil en attente de validation", text: "La fiche n'est pas encore validée.", action: "Valider le profil", onClick: onValidate } : null,
  ].filter(Boolean) as { color: string; title: string; text: string; action: string; onClick: () => void }[];
  return (
    <SectionCard color="#F2CF6B">
      <SectionHeader icon={Clock} color="#F2CF6B" title="À faire" subtitle={items.length ? `${items.length} action${items.length > 1 ? "s" : ""} pour compléter le profil` : "Rien en attente"} />
      <div className="space-y-3 px-6 pb-6 pt-4">
        {items.length === 0 ? <p className="text-sm text-[#9AA3BD]">Rien à demander.</p> : null}
        {items.map((item) => (
          <div key={item.title} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4" style={{ borderLeft: `3px solid ${item.color}` }}>
            <p className="text-sm font-extrabold">{item.title}</p>
            <p className="mt-1 text-xs text-[#9AA3BD]">{item.text}</p>
            <button type="button" onClick={item.onClick} className="mt-3 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#0A0F1E]">{item.action}</button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SiteCard({
  photo,
  name,
  job,
  state,
  order,
  visible,
  onVisible,
  onOrder,
  onAsk,
}: {
  photo: string;
  name: string;
  job: string;
  state: string;
  order: string;
  visible: boolean;
  onVisible: (value: boolean) => void;
  onOrder: (value: string) => void;
  onAsk: () => void;
}) {
  return (
    <SectionCard color="#6BE39B">
      <SectionHeader icon={Globe} color="#6BE39B" title="Sur le site" subtitle="Aperçu de sa carte publique" />
      <div className="space-y-4 px-6 pb-6 pt-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#1A2340] bg-[#0B1122] p-3">
          {photo ? <img src={photo} alt="" className="h-14 w-14 rounded-2xl object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-[#26304F] text-xs text-[#9AA3BD]">Photo</span>}
          <span>
            <span className="block text-sm font-extrabold">{name}</span>
            <span className="block text-xs text-[#9AA3BD]">{job || "Poste sous la photo"}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>Visible sur la page d'accueil</span>
          <button type="button" onClick={() => onVisible(!visible)} className="rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: state === "Activé" ? "#6BE39B26" : state === "Masqué" ? "#1A2340" : "#F2CF6B26", color: state === "Activé" ? "#6BE39B" : state === "Masqué" ? "#9AA3BD" : "#F2CF6B" }}>{state}</button>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span>Accord de l'expert <span className="block text-xs text-[#9AA3BD]">Non reçu</span></span>
          <button type="button" onClick={onAsk} className="text-xs font-extrabold text-[#6BE39B]">Demander</button>
        </div>
        <label className="block text-sm">
          Ordre d'affichage
          <input inputMode="numeric" value={order} onChange={(event) => onOrder(event.target.value.replace(/[^\d]/g, ""))} className="mt-2 h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 outline-none" />
        </label>
        <p className="text-xs text-[#9AA3BD]">Affiché seulement s'il y a l'accord et une photo.</p>
      </div>
    </SectionCard>
  );
}
