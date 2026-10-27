"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, AtSign, Download, Link2, Plus, UserPlus } from "lucide-react";
import { Manrope } from "next/font/google";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

type OfferPhase = "active" | "draft" | "paused" | "closed";
type Stage = "new" | "interview" | "retained";
type StageCounts = { new: number; interview: number; retained: number };

type JobOffer = {
  id: string;
  title: string | null;
  city: string | null;
  salary_range: string | null;
  contract_type: string | null;
  status: string | null;
  created_at?: string | null;
  applications_count: number;
  unread_count?: number;
  stages?: StageCounts;
};

type RecentRow = {
  id: string;
  offer_id: string;
  offer_title: string;
  name: string;
  created_at: string | null;
  stage?: Stage | string;
  href: string;
};

type FormationCard = {
  id: string;
  title: string;
  status: string;
  enrolled: number;
  seats: number | null;
  updated_at: string | null;
  href: string;
};

const EMPTY_STAGES: StageCounts = { new: 0, interview: 0, retained: 0 };

function phaseOf(status: string | null | undefined): OfferPhase {
  const value = String(status ?? "").toLowerCase();
  if (value === "draft" || value === "brouillon") return "draft";
  if (value === "paused" || value === "pause") return "paused";
  if (value === "closed" || value === "cloturee" || value === "clôturée" || value === "archived") return "closed";
  return "active";
}

function phaseLabel(phase: OfferPhase) {
  if (phase === "draft") return "Brouillon";
  if (phase === "paused") return "En pause";
  if (phase === "closed") return "Clôturée";
  return "Active";
}

function initials(value: string) {
  const words = value.split(/[\s—–-]+/).filter((word) => word && !/^\d/.test(word));
  return `${words[0]?.[0] ?? "?"}${words[1]?.[0] ?? ""}`.toUpperCase();
}

function personInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "?"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function formatDay(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function payLabel(offer: JobOffer) {
  const raw = String(offer.salary_range ?? "").trim();
  if (!raw) return "";
  if (/\/\s*(an|jour|mois)/i.test(raw)) return raw;
  if (/freelance/i.test(offer.contract_type ?? "")) return `${raw} / jour`;
  if (/bachelor|alternance/i.test(`${raw} ${offer.contract_type ?? ""}`)) return raw;
  return `${raw} / an`;
}

function subtitle(offer: JobOffer) {
  return [offer.contract_type, offer.city, payLabel(offer)].filter(Boolean).join(" · ");
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count > 1 ? many : one}`;
}

function stagesOf(offer: JobOffer): StageCounts {
  if (offer.stages) return offer.stages;
  return { ...EMPTY_STAGES, new: offer.applications_count };
}

function legend(stages: StageCounts) {
  const retained = stages.retained > 1 ? "retenues" : "retenue";
  return `${plural(stages.new, "nouvelle", "nouvelles")} · ${stages.interview} en entretien · ${stages.retained} ${retained}`;
}

function avatarColor(name: string) {
  const palette = ["#6E5BFF", "#2F6FED", "#1F9D57", "#E7782C", "#3A3D45", "#C43B7A"];
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  const background = palette[index] ?? "#6E5BFF";
  return { background, color: background === "#E7782C" ? "#1A0C04" : "#FFFFFF" };
}

function downloadCsv(filename: string, rows: string[][]) {
  const body = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([`\uFEFF${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function OffresSkeleton() {
  return (
    <main className={cn("px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pl-[104px]", manrope.className)}>
      <div className="h-10 w-56 animate-pulse rounded-full bg-[#ECE9E1]" />
      <div className="mt-6 h-56 animate-pulse rounded-[32px] bg-[#ECE9E1]" />
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <div className="h-72 animate-pulse rounded-[26px] bg-white" />
        <div className="h-72 animate-pulse rounded-[26px] bg-white" />
      </div>
    </main>
  );
}

export function OffresBoard() {
  const router = useRouter();
  const params = useSearchParams();
  const type = params.get("type") === "formation" ? "formation" : "emploi";
  const [offers, setOffers] = useState<JobOffer[] | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentRow[]>([]);
  const [formations, setFormations] = useState<FormationCard[] | null>(null);
  const [recentFormations, setRecentFormations] = useState<RecentRow[]>([]);
  const [jobError, setJobError] = useState<string | null>(null);
  const [formationError, setFormationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    void (async () => {
      try {
        const [jobsRes, formationsRes] = await Promise.all([
          fetch("/api/dashboard/entreprise/job-offers", { credentials: "include" }),
          fetch("/api/dashboard/entreprise/offres", { credentials: "include" }),
        ]);
        const jobsJson = (await jobsRes.json()) as { offers?: JobOffer[]; recent?: RecentRow[]; error?: string };
        const formationsJson = (await formationsRes.json()) as {
          formation_cards?: FormationCard[];
          recent_enrollments?: RecentRow[];
          error?: string;
        };
        if (ignore) return;
        if (jobsRes.ok) {
          setOffers(Array.isArray(jobsJson.offers) ? jobsJson.offers : []);
          setRecentJobs(Array.isArray(jobsJson.recent) ? jobsJson.recent : []);
          setJobError(null);
        } else {
          setOffers([]);
          setJobError(jobsJson.error || "Impossible de charger les offres");
        }
        if (formationsRes.ok) {
          setFormations(Array.isArray(formationsJson.formation_cards) ? formationsJson.formation_cards : []);
          setRecentFormations(Array.isArray(formationsJson.recent_enrollments) ? formationsJson.recent_enrollments : []);
          setFormationError(null);
        } else {
          setFormations([]);
          setFormationError(formationsJson.error || "Impossible de charger les formations");
        }
      } catch (err) {
        if (!ignore) {
          const message = err instanceof Error ? err.message : "Impossible de charger les offres";
          setOffers([]);
          setFormations([]);
          setJobError(message);
          setFormationError(message);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const setType = (next: "emploi" | "formation") => {
    const query = new URLSearchParams(params.toString());
    query.set("type", next);
    router.replace(`/dashboard/entreprise/offres?${query.toString()}`, { scroll: false });
  };

  const jobView = useMemo(() => arrangeOffers(offers ?? []), [offers]);
  const formationView = useMemo(() => arrangeFormations(formations ?? []), [formations]);
  const loading = type === "emploi" ? offers === null : formations === null;
  const error = type === "emploi" ? jobError : formationError;

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Lien copié");
      window.setTimeout(() => setNotice(null), 2000);
    } catch {
      setNotice("Copie impossible");
    }
  };

  const shareJob = jobView.ordered.find((offer) => offer.id === jobView.featuredId) ?? jobView.active[0];
  const shareFormation = formationView.ordered.find((card) => card.id === formationView.featuredId) ?? formationView.open[0];

  const createHref = type === "emploi" ? "/dashboard/entreprise/offres/creer" : "/dashboard/entreprise/formations/creer";

  const exportRows = () => {
    if (type === "emploi") {
      downloadCsv("offres-emploi.csv", [
        ["Titre", "Statut", "Contrat", "Ville", "Rémunération", "Candidatures", "Nouvelles", "Entretien", "Retenues", "Non lues"],
        ...jobView.ordered.map((offer) => {
          const stages = stagesOf(offer);
          return [
            offer.title ?? "",
            phaseLabel(phaseOf(offer.status)),
            offer.contract_type ?? "",
            offer.city ?? "",
            payLabel(offer),
            String(offer.applications_count),
            String(stages.new),
            String(stages.interview),
            String(stages.retained),
            String(offer.unread_count ?? 0),
          ];
        }),
      ]);
      return;
    }
    downloadCsv("offres-formation.csv", [
      ["Titre", "Statut", "Inscrits", "Places"],
      ...formationView.ordered.map((card) => [card.title, card.status, String(card.enrolled), card.seats == null ? "" : String(card.seats)]),
    ]);
  };

  return (
    <main className={cn("px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pl-[104px]", manrope.className)}>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[40px] font-extrabold leading-none tracking-[-1.2px]">Mes offres</h1>
          <p className="mt-2 text-[15px] text-[#3A3D45]">Vos offres d&apos;emploi et de formation, et les candidatures à traiter.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="tablist" aria-label="Type d'offre" className="inline-flex rounded-full border border-[#E3E0D8] bg-white p-1">
            {(
              [
                ["emploi", "Emploi"],
                ["formation", "Formation"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={type === key}
                onClick={() => setType(key)}
                className={cn(
                  "h-10 rounded-full px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF]",
                  type === key ? "bg-[#07080B] text-white" : "text-[#3A3D45]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            href={createHref}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF]"
          >
            <Plus className="h-4 w-4" />
            Créer une offre
          </Link>
        </div>
      </header>

      {error ? (
        <p className="mt-6 rounded-[26px] bg-white p-6 text-sm text-[#B42318]">{error}</p>
      ) : loading ? (
        <div className="mt-6 h-56 animate-pulse rounded-[32px] bg-[#ECE9E1]" />
      ) : type === "emploi" ? (
        <JobBoard
          view={jobView}
          recent={recentJobs}
          notice={notice}
          onCreate={() => router.push(createHref)}
          onShare={() => void copyLink(shareJob ? `https://www.byound.fr/dashboard/talent/offres/${shareJob.id}` : "https://www.byound.fr/dashboard/entreprise/offres?type=emploi")}
          onAdd={() => router.push("/dashboard/entreprise/recrutement/candidats/nouveau")}
          onExport={exportRows}
        />
      ) : (
        <FormationBoard
          view={formationView}
          recent={recentFormations}
          notice={notice}
          onCreate={() => router.push(createHref)}
          onShare={() => void copyLink(shareFormation ? `https://www.byound.fr${shareFormation.href}` : "https://www.byound.fr/dashboard/entreprise/formations/gerer")}
          onInvite={() => router.push("/dashboard/entreprise/salaries")}
          onExport={exportRows}
        />
      )}
      <p className="sr-only" aria-live="polite">{notice}</p>
    </main>
  );
}

function arrangeOffers(offers: JobOffer[]) {
  const active = offers.filter((offer) => phaseOf(offer.status) === "active");
  const pool = offers.filter((offer) => phaseOf(offer.status) !== "draft");
  const featured = [...(pool.length ? pool : offers)].sort((a, b) => {
    const byCount = b.applications_count - a.applications_count;
    if (byCount !== 0) return byCount;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  })[0];
  const featuredId = featured && phaseOf(featured.status) !== "draft" ? featured.id : null;
  const ordered = [...offers].sort((a, b) => {
    if (a.id === featuredId) return -1;
    if (b.id === featuredId) return 1;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
  const received = active.reduce((sum, offer) => sum + offer.applications_count, 0);
  const unread = active.reduce((sum, offer) => sum + (offer.unread_count ?? 0), 0);
  return { ordered, active, featuredId, received, unread };
}

function arrangeFormations(cards: FormationCard[]) {
  const open = cards.filter((card) => phaseOf(card.status) === "active");
  const featured = [...open].sort((a, b) => b.enrolled - a.enrolled || String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? "")))[0];
  const featuredId = featured?.id ?? null;
  const ordered = [...cards].sort((a, b) => {
    if (a.id === featuredId) return -1;
    if (b.id === featuredId) return 1;
    return String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? ""));
  });
  const enrolled = open.reduce((sum, card) => sum + card.enrolled, 0);
  const seats = open.length > 0 && open.every((card) => typeof card.seats === "number")
    ? open.reduce((sum, card) => sum + (card.seats ?? 0), 0)
    : null;
  return { ordered, open, featuredId, enrolled, seats };
}

function Hero({
  kicker,
  value,
  caption,
  children,
}: {
  kicker: string;
  value: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <section className="relative mt-6 overflow-hidden rounded-[32px] bg-[#070C1C] px-6 py-8 text-center text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_100%_at_50%_0%,#6E5BFF66,transparent_70%)]" />
      <div className="relative">
        <p className="text-[14px] text-[#B5BAC6]">{kicker}</p>
        <p className="mt-3 text-[clamp(56px,7vw,84px)] font-extrabold leading-none tracking-[-3px]">{value}</p>
        <p className="mt-2 text-[15px] text-[#DADDE4]">{caption}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-4">{children}</div>
      </div>
    </section>
  );
}

function RoundAction({ label, onClick, children, primary }: { label: string; onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex w-[104px] flex-col items-center gap-2 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <span className={cn("flex h-14 w-14 items-center justify-center rounded-full text-white", primary ? "bg-[#6E5BFF]" : "bg-white/12")}>{children}</span>
      <span className="text-center text-[13px] leading-tight">{label}</span>
    </button>
  );
}

function JobBoard({
  view,
  recent,
  notice,
  onCreate,
  onShare,
  onAdd,
  onExport,
}: {
  view: ReturnType<typeof arrangeOffers>;
  recent: RecentRow[];
  notice: string | null;
  onCreate: () => void;
  onShare: () => void;
  onAdd: () => void;
  onExport: () => void;
}) {
  return (
    <>
      <Hero
        kicker={`Candidatures reçues · ${plural(view.active.length, "offre active", "offres actives")}`}
        value={String(view.received)}
        caption={`dont ${plural(view.unread, "non lue", "non lues")}`}
      >
        <RoundAction label="Créer une offre" primary onClick={onCreate}><Plus className="h-5 w-5" /></RoundAction>
        <RoundAction label={notice ?? "Partager une offre"} onClick={onShare}><ArrowUpRight className="h-5 w-5" /></RoundAction>
        <RoundAction label="Ajouter un candidat" onClick={onAdd}><AtSign className="h-5 w-5" /></RoundAction>
        <RoundAction label="Exporter" onClick={onExport}><Download className="h-5 w-5" /></RoundAction>
      </Hero>
      {view.ordered.length === 0 ? (
        <EmptyState href="/dashboard/entreprise/offres/creer" />
      ) : (
        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {view.ordered.map((offer) => (
              <JobCard key={offer.id} offer={offer} featured={offer.id === view.featuredId} />
            ))}
          </div>
          <RecentList title="Dernières candidatures" href={view.ordered[0] ? `/dashboard/entreprise/offres/${view.ordered[0].id}/candidats` : "/dashboard/entreprise/offres"} rows={recent} />
        </section>
      )}
    </>
  );
}

function FormationBoard({
  view,
  recent,
  notice,
  onCreate,
  onShare,
  onInvite,
  onExport,
}: {
  view: ReturnType<typeof arrangeFormations>;
  recent: RecentRow[];
  notice: string | null;
  onCreate: () => void;
  onShare: () => void;
  onInvite: () => void;
  onExport: () => void;
}) {
  const seatsCaption = view.seats == null ? "places non renseignées" : `sur ${view.seats} places proposées`;
  return (
    <>
      <Hero
        kicker={`Inscriptions · ${plural(view.open.length, "formation ouverte", "formations ouvertes")}`}
        value={String(view.enrolled)}
        caption={seatsCaption}
      >
        <RoundAction label="Créer une offre" primary onClick={onCreate}><Plus className="h-5 w-5" /></RoundAction>
        <RoundAction label={notice ?? "Partager le lien"} onClick={onShare}><Link2 className="h-5 w-5" /></RoundAction>
        <RoundAction label="Inviter des salariés" onClick={onInvite}><UserPlus className="h-5 w-5" /></RoundAction>
        <RoundAction label="Exporter" onClick={onExport}><Download className="h-5 w-5" /></RoundAction>
      </Hero>
      {view.ordered.length === 0 ? (
        <EmptyState href="/dashboard/entreprise/formations/creer" />
      ) : (
        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {view.ordered.map((card) => (
              <FormationOfferCard key={card.id} card={card} featured={card.id === view.featuredId} />
            ))}
          </div>
          <RecentList title="Dernières inscriptions" href="/dashboard/entreprise/formations/gerer" rows={recent} inscription />
        </section>
      )}
    </>
  );
}

function EmptyState({ href }: { href: string }) {
  return (
    <div className="mt-4 rounded-[26px] bg-white px-6 py-14 text-center">
      <h2 className="text-[20px] font-extrabold">Aucune offre pour l&apos;instant</h2>
      <Link href={href} className="mt-5 inline-flex h-11 items-center rounded-full bg-[#07080B] px-5 text-sm font-semibold text-white">
        Créer une offre
      </Link>
    </div>
  );
}

function JobCard({ offer, featured }: { offer: JobOffer; featured: boolean }) {
  const phase = phaseOf(offer.status);
  const draft = phase === "draft";
  const dark = featured && !draft;
  const stages = stagesOf(offer);
  return (
    <Link
      href={draft ? `/dashboard/entreprise/offres/${offer.id}/edition` : `/dashboard/entreprise/offres/${offer.id}`}
      className={cn(
        "relative flex min-h-[280px] flex-col overflow-hidden rounded-[26px] p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF]",
        dark ? "bg-[#070C1C] text-white" : draft ? "border border-dashed border-[#D6D2C8] bg-[#FAF9F6]" : "bg-white",
      )}
    >
      {dark ? <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" /> : null}
      <div className="flex items-start justify-between gap-3">
        <span className={cn("inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-extrabold", dark ? "bg-[#6E5BFF] text-white" : "bg-[#EEEBFF] text-[#4B3BD1]")}>
          {initials(offer.title || "Offre")}
        </span>
        <StatusPill phase={phase} onDark={dark} />
      </div>
      <h2 className="mt-4 text-[21px] font-extrabold leading-tight">{offer.title || "Offre sans titre"}</h2>
      <p className={cn("mt-1 text-[14px]", dark ? "text-[#B5BAC6]" : "text-[#6B6F7A]")}>{subtitle(offer) || "Informations à compléter"}</p>
      <div className="mt-4">
        <StageBar stages={draft ? EMPTY_STAGES : stages} tone={dark ? "dark" : "light"} />
        <p className={cn("mt-2 text-[13px]", dark ? "text-[#DADDE4]" : "text-[#6B6F7A]")}>{draft ? "Pas encore publiée" : legend(stages)}</p>
      </div>
      <div className="mt-auto flex items-end justify-between pt-6">
        <p className="text-[40px] font-extrabold leading-none tracking-[-1px]">{offer.applications_count}</p>
        <span className={cn("inline-flex h-10 items-center rounded-full px-4 text-[13px] font-semibold", dark ? "bg-white text-[#07080B]" : "bg-[#07080B] text-white")}>
          {draft ? "Terminer et publier" : "Voir l'offre"}
        </span>
      </div>
    </Link>
  );
}

function FormationOfferCard({ card, featured }: { card: FormationCard; featured: boolean }) {
  const phase = phaseOf(card.status);
  const draft = phase === "draft";
  const dark = featured && !draft;
  const seats = card.seats;
  const filled = seats == null ? card.enrolled : Math.min(card.enrolled, seats);
  const free = seats == null ? null : Math.max(0, seats - card.enrolled);
  return (
    <Link
      href={card.href}
      className={cn(
        "relative flex min-h-[280px] flex-col overflow-hidden rounded-[26px] p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF]",
        dark ? "bg-[#070C1C] text-white" : draft ? "border border-dashed border-[#D6D2C8] bg-[#FAF9F6]" : "bg-white",
      )}
    >
      {dark ? <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" /> : null}
      <div className="flex items-start justify-between gap-3">
        <span className={cn("inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-extrabold", dark ? "bg-[#6E5BFF] text-white" : "bg-[#EEEBFF] text-[#4B3BD1]")}>
          {initials(card.title)}
        </span>
        <StatusPill phase={phase} onDark={dark} />
      </div>
      <h2 className="mt-4 text-[21px] font-extrabold leading-tight">{card.title}</h2>
      <p className={cn("mt-1 text-[14px]", dark ? "text-[#B5BAC6]" : "text-[#6B6F7A]")}>Formation interne</p>
      <div className="mt-4">
        <SeatBar filled={draft ? 0 : filled} total={draft ? 6 : seats == null ? Math.max(filled, 1) : Math.max(seats, filled, 1)} tone={dark ? "dark" : "light"} />
        <p className={cn("mt-2 text-[13px]", dark ? "text-[#DADDE4]" : "text-[#6B6F7A]")}>
          {draft ? "Pas encore publiée" : free == null ? plural(card.enrolled, "inscrit", "inscrits") : `${plural(card.enrolled, "inscrit", "inscrits")} · ${plural(free, "place libre", "places libres")}`}
        </p>
      </div>
      <div className="mt-auto flex items-end justify-between pt-6">
        <p className="text-[40px] font-extrabold leading-none tracking-[-1px]">{seats == null ? card.enrolled : `${card.enrolled} / ${seats}`}</p>
        <span className={cn("inline-flex h-10 items-center rounded-full px-4 text-[13px] font-semibold", dark ? "bg-white text-[#07080B]" : "bg-[#07080B] text-white")}>
          {draft ? "Terminer et publier" : "Voir l'offre"}
        </span>
      </div>
    </Link>
  );
}

function StatusPill({ phase, onDark }: { phase: OfferPhase; onDark?: boolean }) {
  const cls = onDark && phase === "active"
    ? "bg-[#1F9D5733] text-[#7BE2A8]"
    : phase === "active"
      ? "bg-[#E3F6EC] text-[#126B3B]"
      : phase === "closed"
        ? "bg-[#FDECEC] text-[#B42318]"
        : "bg-[#ECE9E1] text-[#3A3D45]";
  return <span className={cn("rounded-full px-3 py-1 text-[12px] font-semibold", cls)}>{phaseLabel(phase)}</span>;
}

function StageBar({ stages, tone }: { stages: StageCounts; tone: "dark" | "light" }) {
  const parts: Array<"new" | "interview" | "retained" | "empty"> = [
    ...Array.from({ length: stages.new }, () => "new" as const),
    ...Array.from({ length: stages.interview }, () => "interview" as const),
    ...Array.from({ length: stages.retained }, () => "retained" as const),
  ];
  const missing = Math.max(0, 6 - parts.length);
  const color = {
    new: tone === "dark" ? "bg-[#B9AFFF]" : "bg-[#6E5BFF]",
    interview: tone === "dark" ? "bg-white" : "bg-[#07080B]",
    retained: tone === "dark" ? "bg-[#3DD68C]" : "bg-[#1F9D57]",
    empty: tone === "dark" ? "bg-white/20" : "bg-[#ECE9E1]",
  };
  return (
    <div className="flex gap-1" aria-hidden>
      {parts.map((part, index) => <span key={`${part}-${index}`} className={cn("h-[6px] flex-1 rounded-full", color[part])} />)}
      {Array.from({ length: missing }, (_, index) => <span key={`empty-${index}`} className={cn("h-[6px] flex-1 rounded-full", color.empty)} />)}
    </div>
  );
}

function SeatBar({ filled, total, tone }: { filled: number; total: number; tone: "dark" | "light" }) {
  const count = Math.max(total, 1);
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={cn("h-[6px] flex-1 rounded-full", index < filled ? (tone === "dark" ? "bg-white" : "bg-[#6E5BFF]") : tone === "dark" ? "bg-white/20" : "bg-[#ECE9E1]")} />
      ))}
    </div>
  );
}

function RecentList({ title, href, rows, inscription }: { title: string; href: string; rows: RecentRow[]; inscription?: boolean }) {
  return (
    <aside className="rounded-[26px] bg-white p-4">
      <div className="flex items-center justify-between gap-3 px-2 py-2">
        <h2 className="text-[16px] font-extrabold">{title}</h2>
        <Link href={href} className="text-[13px] font-semibold text-[#6E5BFF]">Tout voir</Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-2 py-8 text-center text-[14px] text-[#6B6F7A]">Rien à afficher pour l&apos;instant.</p>
      ) : (
        <ul>
          {rows.map((row) => {
            const color = avatarColor(row.name);
            const detail = [row.offer_title, formatDay(row.created_at)].filter(Boolean).join(" · ");
            return (
              <li key={row.id} className="border-t border-[#F1EFE9] first:border-t-0">
                <Link href={row.href} className="flex min-h-16 items-center gap-3 rounded-[18px] px-2 py-2 hover:bg-[#F7F5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6E5BFF]">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: color.background, color: color.color }}>
                    {personInitials(row.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-extrabold">{row.name}</span>
                    <span className="block truncate text-[13px] text-[#6B6F7A]">{detail}</span>
                  </span>
                  {inscription ? (
                    <span className="shrink-0 rounded-full bg-[#E3F6EC] px-2.5 py-1 text-[12px] font-semibold text-[#126B3B]">Inscrit</span>
                  ) : (
                    <StagePill stage={row.stage} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

function StagePill({ stage }: { stage?: string }) {
  const value = stage === "interview" || stage === "retained" || stage === "rejected" ? stage : "new";
  const cls = value === "retained"
    ? "bg-[#E3F6EC] text-[#126B3B]"
    : value === "interview"
      ? "bg-[#ECE9E1] text-[#07080B]"
      : value === "rejected"
        ? "bg-[#FDECEC] text-[#B42318]"
        : "bg-[#EEEBFF] text-[#4B3BD1]";
  const label = value === "retained" ? "Retenue" : value === "interview" ? "Entretien" : value === "rejected" ? "Échec" : "Nouvelle";
  return <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold", cls)}>{label}</span>;
}
