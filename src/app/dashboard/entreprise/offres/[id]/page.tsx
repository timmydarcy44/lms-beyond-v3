"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Pause, Pencil, Play, X } from "lucide-react";
import { Manrope } from "next/font/google";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

type Stage = "new" | "interview" | "retained" | "rejected";
type Phase = "active" | "draft" | "paused" | "closed";

type OfferDetail = {
  id: string;
  title: string | null;
  description: string | null;
  requirements: string | null;
  city: string | null;
  salary_range: string | null;
  contract_type: string | null;
  status: string | null;
  created_at?: string | null;
};

type ApplicationItem = {
  id: string;
  created_at?: string | null;
  stage?: string | null;
  status?: string | null;
  read_at?: string | null;
  source?: string | null;
  interview_at?: string | null;
  retained_at?: string | null;
  criteria_met?: number | null;
  criteria_total?: number | null;
  profiles?: Array<{ id?: string | null; first_name?: string | null; last_name?: string | null }> | null;
};

type Filter = "all" | "new" | "interview" | "retained";

function phaseOf(status: string | null | undefined): Phase {
  const value = String(status ?? "").toLowerCase();
  if (value === "draft" || value === "brouillon") return "draft";
  if (value === "paused" || value === "pause") return "paused";
  if (value === "closed" || value === "archived") return "closed";
  return "active";
}

function stageOf(application: ApplicationItem): Stage {
  const value = String(application.stage ?? application.status ?? "").toLowerCase();
  if (value === "interview" || value === "entretien") return "interview";
  if (value === "retained" || value === "retenu" || value === "accepted" || value === "hired") return "retained";
  if (value === "rejected" || value === "refused") return "rejected";
  return "new";
}

function linesOf(value: string | null | undefined) {
  return String(value ?? "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function payLabel(offer: OfferDetail) {
  const raw = String(offer.salary_range ?? "").trim();
  if (!raw) return "Non précisée";
  if (/\/\s*(an|jour|mois)/i.test(raw)) return raw;
  if (/freelance/i.test(offer.contract_type ?? "")) return `${raw} / jour`;
  if (/bachelor|alternance/i.test(`${raw} ${offer.contract_type ?? ""}`)) return raw;
  return `${raw} / an`;
}

function formatDay(value?: string | null, withYear = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", withYear
    ? { day: "numeric", month: "short", year: "numeric" }
    : { day: "numeric", month: "short" });
}

function candidateName(application: ApplicationItem) {
  const profile = application.profiles?.[0];
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || "Candidat";
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? "?"}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function avatarColor(name: string) {
  const palette = ["#6E5BFF", "#2F6FED", "#1F9D57", "#E7782C", "#3A3D45", "#C43B7A"];
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  const background = palette[index] ?? "#6E5BFF";
  return { background, color: background === "#E7782C" ? "#1A0C04" : "#FFFFFF" };
}

function contextLine(application: ApplicationItem, stage: Stage) {
  if (stage === "retained") return `Retenu le ${formatDay(application.retained_at || application.created_at)}`;
  if (stage === "interview") {
    if (!application.interview_at) return "Entretien à planifier";
    const date = new Date(application.interview_at);
    const day = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short", timeZone: "Europe/Paris" });
    const time = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
    return `Entretien ${day} · ${time}`;
  }
  const via = application.source ? ` · via ${application.source}` : "";
  return `${formatDay(application.created_at)}${via}`;
}

function actionOf(stage: Stage, application: ApplicationItem) {
  if (stage === "retained") return "Proposer";
  if (stage === "interview") return application.interview_at ? "Préparer" : "Planifier";
  return "Analyser";
}

export default function EntrepriseOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOffer = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/dashboard/entreprise/job-offers/${params.id}`, { credentials: "include" });
        const payload = (await response.json()) as { offer?: OfferDetail; applications?: ApplicationItem[]; error?: string };
        if (!response.ok || !payload.offer) throw new Error(payload.error || "Impossible de charger l'offre");
        setOffer(payload.offer);
        setApplications((payload.applications ?? []).filter((row) => stageOf(row) !== "rejected"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger l'offre");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) void loadOffer();
  }, [params.id]);

  const visible = useMemo(
    () => applications.filter((row) => filter === "all" || stageOf(row) === filter),
    [applications, filter],
  );
  const counts = useMemo(() => {
    const tally = { all: applications.length, new: 0, interview: 0, retained: 0 };
    for (const row of applications) {
      const stage = stageOf(row);
      if (stage === "new" || stage === "interview" || stage === "retained") tally[stage] += 1;
    }
    return tally;
  }, [applications]);
  const unread = applications.filter((row) => !row.read_at).length;
  const criteriaTotal = linesOf(offer?.requirements).length;

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/dashboard/entreprise/job-offers/${params.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Mise à jour impossible");
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const markRead = (application: ApplicationItem) => {
    if (application.read_at) return;
    const readAt = new Date().toISOString();
    setApplications((current) => current.map((row) => (row.id === application.id ? { ...row, read_at: readAt } : row)));
    void patch({ applicationId: application.id });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://www.byound.fr/dashboard/talent/offres/${params.id}`);
      setNotice("Lien copié");
      window.setTimeout(() => setNotice(null), 2000);
    } catch {
      setNotice("Copie impossible");
    }
  };

  const phase = phaseOf(offer?.status);
  const phaseLabel = phase === "draft" ? "Brouillon" : phase === "paused" ? "En pause" : phase === "closed" ? "Clôturée" : "Active";

  return (
    <div className={cn("min-h-screen bg-[#F4F4F1] text-[#07080B]", manrope.className)}>
      <EnterpriseSidebar />
      <main className="px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pl-[104px]">
        <Link href="/dashboard/entreprise/offres" className="inline-flex h-11 items-center gap-2 rounded-full border border-[#E3E0D8] bg-white px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6E5BFF]">
          <ArrowLeft className="h-4 w-4" />
          Mes offres
        </Link>

        {loading ? (
          <div className="mt-6 h-64 animate-pulse rounded-[32px] bg-[#ECE9E1]" />
        ) : error && !offer ? (
          <p className="mt-6 rounded-[26px] bg-white p-6 text-sm text-[#B42318]">{error}</p>
        ) : offer ? (
          <>
            <section className="relative mt-4 overflow-hidden rounded-[32px] bg-[#070C1C] px-6 py-8 text-white">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_100%_at_100%_0%,#6E5BFF66,transparent_70%)]" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-semibold", phase === "active" ? "bg-[#1F9D5733] text-[#7BE2A8]" : "bg-white/10 text-white")}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", phase === "active" ? "bg-[#7BE2A8]" : "bg-white")} />
                    {phaseLabel} · publiée le {formatDay(offer.created_at, true) || "date inconnue"}
                  </span>
                  <h1 className="mt-4 text-[clamp(36px,5vw,48px)] font-extrabold leading-none tracking-[-1.5px]">{offer.title || "Offre sans titre"}</h1>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[offer.contract_type, offer.city, payLabel(offer)].filter(Boolean).map((chip) => (
                      <span key={chip} className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold">{chip}</span>
                    ))}
                  </div>
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-[14px] text-[#B5BAC6]">Candidatures</p>
                  <p className="text-[72px] font-extrabold leading-none tracking-[-2px]">{applications.length}</p>
                  <p className="text-[14px] text-[#DADDE4]">dont {unread} non lue{unread > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="relative mt-8 flex flex-wrap gap-x-6 gap-y-4">
                <RoundAction label={notice ?? "Partager le lien"} primary onClick={() => void copyLink()}><ArrowUpRight className="h-5 w-5" /></RoundAction>
                <RoundAction label="Modifier" onClick={() => setEditing(true)}><Pencil className="h-5 w-5" /></RoundAction>
                {phase === "paused" || phase === "closed" ? (
                  <RoundAction label="Réactiver" onClick={() => { if (!saving) void patch({ status: "active" }).then((ok) => ok && setOffer({ ...offer, status: "active" })); }}><Play className="h-5 w-5" /></RoundAction>
                ) : (
                  <RoundAction label="Mettre en pause" onClick={() => { if (!saving) void patch({ status: "paused" }).then((ok) => ok && setOffer({ ...offer, status: "paused" })); }}><Pause className="h-5 w-5" /></RoundAction>
                )}
                <RoundAction label="Clôturer" onClick={() => setConfirmClose(true)}><X className="h-5 w-5" /></RoundAction>
              </div>
            </section>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
              <section className="rounded-[26px] bg-white p-4 sm:p-5">
                <h2 className="px-2 text-[18px] font-extrabold">Candidatures</h2>
                <div role="tablist" aria-label="Filtrer les candidatures" className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["all", "Toutes"],
                      ["new", "Nouvelles"],
                      ["interview", "Entretien"],
                      ["retained", "Retenues"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      role="tab"
                      aria-selected={filter === key}
                      onClick={() => setFilter(key)}
                      className={cn("h-10 rounded-full px-3 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6E5BFF]", filter === key ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white text-[#3A3D45]")}
                    >
                      {label} {counts[key]}
                    </button>
                  ))}
                </div>
                {visible.length === 0 ? (
                  <p className="px-2 py-10 text-center text-[14px] text-[#6B6F7A]">Aucune candidature dans cette étape.</p>
                ) : (
                  <ul className="mt-2">
                    {visible.map((application) => {
                      const stage = stageOf(application);
                      const name = candidateName(application);
                      const color = avatarColor(name);
                      const profileId = application.profiles?.[0]?.id;
                      const href = profileId ? `/dashboard/entreprise/offres/${offer.id}/candidats/${profileId}` : `/dashboard/entreprise/offres/${offer.id}`;
                      const met = application.criteria_met;
                      const total = application.criteria_total ?? criteriaTotal;
                      const complete = typeof met === "number" && total > 0 && met >= total;
                      return (
                        <li key={application.id} className="border-t border-[#F1EFE9] first:border-t-0">
                          <div className="flex min-h-[72px] items-center gap-3 py-2">
                            <Link href={href} onClick={() => markRead(application)} className="flex min-w-0 flex-1 items-center gap-3 rounded-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6E5BFF]">
                              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: color.background, color: color.color }}>{initials(name)}</span>
                              <span className="min-w-0">
                                <span className="flex items-center gap-2 text-[15px] font-extrabold">
                                  {name}
                                  {!application.read_at ? <span className="h-2 w-2 rounded-full bg-[#6E5BFF]" aria-label="Non lue" /> : null}
                                </span>
                                <span className="block truncate text-[13px] text-[#6B6F7A]">{contextLine(application, stage)}</span>
                              </span>
                            </Link>
                            {total > 0 ? (
                              <span className={cn("hidden shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold sm:inline", complete ? "bg-[#EEEBFF] text-[#4B3BD1]" : "bg-[#ECE9E1] text-[#3A3D45]")}>
                                {typeof met === "number" ? met : "—"} / {total} critères
                              </span>
                            ) : null}
                            <Link href={href} onClick={() => markRead(application)} className="inline-flex h-10 shrink-0 items-center rounded-full bg-[#07080B] px-4 text-[13px] font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6E5BFF]">
                              {actionOf(stage, application)}
                            </Link>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <div className="space-y-4">
                <section className="rounded-[26px] bg-white p-5">
                  <h2 className="text-[16px] font-extrabold">Le poste</h2>
                  {linesOf(offer.description).length > 0 ? (
                    <div className="mt-3 space-y-2 text-[14px] leading-6 text-[#3A3D45]">
                      {linesOf(offer.description).map((line) => <p key={line}>{line}</p>)}
                    </div>
                  ) : (
                    <p className="mt-3 text-[14px] text-[#6B6F7A]">Aucune description renseignée.</p>
                  )}
                  <h3 className="mt-5 text-[15px] font-extrabold">Profil recherché</h3>
                  {linesOf(offer.requirements).length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {linesOf(offer.requirements).map((line) => (
                        <li key={line} className="flex items-start gap-2 text-[14px] text-[#3A3D45]">
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEEBFF] text-[#4B3BD1]"><Check className="h-3 w-3" /></span>
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[14px] text-[#6B6F7A]">Aucun critère renseigné.</p>
                  )}
                </section>
                <section className="rounded-[26px] bg-white p-5">
                  {(
                    [
                      ["Type de contrat", offer.contract_type || "—"],
                      ["Ville", offer.city || "—"],
                      ["Rémunération", payLabel(offer)],
                      ["Publication", formatDay(offer.created_at, true) || "—"],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3 border-t border-[#F1EFE9] py-3 first:border-t-0 first:pt-0 last:pb-0">
                      <span className="text-[14px] text-[#6B6F7A]">{label}</span>
                      <span className="text-right text-[14px] font-semibold">{value}</span>
                    </div>
                  ))}
                </section>
                <section className="relative overflow-hidden rounded-[26px] bg-[#6E5BFF] p-5 text-white">
                  <span className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/12" />
                  <h2 className="text-[16px] font-extrabold">Byound AI</h2>
                  <p className="mt-2 text-[14px] leading-6 text-white/90">Comparez chaque candidature aux critères du poste et préparez vos questions d&apos;entretien.</p>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("entreprise-assistant-open", { detail: { prompt: `Compare les candidatures de l'offre « ${offer.title ?? "cette offre"} » aux critères du poste et propose des questions d'entretien.` } }))}
                    className="mt-4 inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#07080B]"
                  >
                    Comparer les profils
                  </button>
                </section>
              </div>
            </div>
            {error ? <p className="mt-4 text-sm text-[#B42318]">{error}</p> : null}
          </>
        ) : null}
        <p className="sr-only" aria-live="polite">{notice}</p>
      </main>

      {confirmClose && offer ? (
        <Modal title="Clôturer cette offre ?" onClose={() => setConfirmClose(false)}>
          <p className="text-[14px] text-[#3A3D45]">Les candidatures restent consultables. L&apos;offre n&apos;apparaîtra plus comme active.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmClose(false)} className="h-11 rounded-full border border-[#E3E0D8] px-4 text-sm font-semibold">Annuler</button>
            <button
              type="button"
              disabled={saving}
              onClick={() => { void patch({ status: "closed" }).then((ok) => { if (!ok) return; setOffer({ ...offer, status: "closed" }); setConfirmClose(false); }); }}
              className="h-11 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Clôturer
            </button>
          </div>
        </Modal>
      ) : null}

      {editing && offer ? (
        <Modal title="Modifier l'offre" onClose={() => setEditing(false)}>
          <OfferForm
            offer={offer}
            saving={saving}
            onCancel={() => setEditing(false)}
            onSave={async (next) => {
              const ok = await patch(next);
              if (!ok) return;
              setOffer({ ...offer, ...next });
              setEditing(false);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function RoundAction({ label, onClick, children, primary }: { label: string; onClick: () => void; children: ReactNode; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="flex w-[104px] flex-col items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
      <span className={cn("flex h-14 w-14 items-center justify-center rounded-full text-white", primary ? "bg-[#6E5BFF]" : "bg-white/12")}>{children}</span>
      <span className="text-center text-[13px] leading-tight">{label}</span>
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Fermer" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="offer-dialog-title" className="relative w-full max-w-lg rounded-[26px] bg-white p-5">
        <h2 id="offer-dialog-title" className="text-[20px] font-extrabold">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function OfferForm({
  offer,
  saving,
  onCancel,
  onSave,
}: {
  offer: OfferDetail;
  saving: boolean;
  onCancel: () => void;
  onSave: (next: Pick<OfferDetail, "title" | "city" | "contract_type" | "salary_range" | "description" | "requirements">) => Promise<void>;
}) {
  const [title, setTitle] = useState(offer.title ?? "");
  const [city, setCity] = useState(offer.city ?? "");
  const [contract, setContract] = useState(offer.contract_type ?? "");
  const [salary, setSalary] = useState(offer.salary_range ?? "");
  const [description, setDescription] = useState(offer.description ?? "");
  const [requirements, setRequirements] = useState(offer.requirements ?? "");
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({ title, city, contract_type: contract, salary_range: salary, description, requirements });
      }}
    >
      <Field label="Titre" value={title} onChange={setTitle} />
      <Field label="Ville" value={city} onChange={setCity} />
      <Field label="Contrat" value={contract} onChange={setContract} />
      <Field label="Rémunération" value={salary} onChange={setSalary} />
      <label className="block text-[13px] font-semibold text-[#3A3D45]">
        Description
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 min-h-24 w-full rounded-2xl border border-[#E3E0D8] px-3 py-2 text-sm font-medium" />
      </label>
      <label className="block text-[13px] font-semibold text-[#3A3D45]">
        Profil recherché, une ligne par critère
        <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} className="mt-1 min-h-24 w-full rounded-2xl border border-[#E3E0D8] px-3 py-2 text-sm font-medium" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="h-11 rounded-full border border-[#E3E0D8] px-4 text-sm font-semibold">Annuler</button>
        <button type="submit" disabled={saving || !title.trim()} className="h-11 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white disabled:opacity-50">Enregistrer</button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-[13px] font-semibold text-[#3A3D45]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-11 w-full rounded-full border border-[#E3E0D8] px-4 text-sm font-medium" />
    </label>
  );
}
