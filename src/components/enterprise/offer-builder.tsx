"use client";

import { Manrope } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BuilderTopBar, FicheStepper, PublishChecklist } from "@/components/builder/fiche-builder-chrome";
import { OfferStepPoste } from "@/components/enterprise/offer-step-poste";
import { OfferDiscriminationNote } from "@/components/enterprise/offer-discrimination-note";
import { OfferPreviewCard } from "@/components/enterprise/offer-preview-card";
import { OfferStepCandidature } from "@/components/enterprise/offer-step-candidature";
import { OfferStepConditions } from "@/components/enterprise/offer-step-conditions";
import { OfferStepSkills, type OfferSkillDraft } from "@/components/enterprise/offer-step-skills";
import { offerChecklist, OFFER_STEPS } from "@/lib/entreprise/offer-publish";
import { scanOfferDiscrimination, type DiscriminationFinding } from "@/lib/entreprise/offer-discrimination";
import { formatFreelancePay, formatOfferPay } from "@/lib/entreprise/offer-conditions";
import { prepareCandidature } from "@/lib/entreprise/offer-candidature";
import { prepareConditions, preparePosteDraft, type OfferPoste } from "@/lib/entreprise/offer-poste";
import { ANONYMITY_MESSAGE, type AnonymityFlag, type AnonymityRewrite } from "@/lib/offres/anonymity";

const manrope = Manrope({ subsets: ["latin"] });

function serializePoste(draft: OfferPoste) {
  const contract = String(draft.contract_type ?? "");
  const alternance = contract === "Alternance";
  const timed = alternance || contract === "CDD" || contract === "Stage" || contract === "Intérim";
  return JSON.stringify({
    title: String(draft.title ?? "").trim() || "Sans titre",
    contract_type: contract,
    description: String(draft.description ?? "").trim(),
    city: String(draft.city ?? "").trim(),
    work_mode: String(draft.work_mode ?? ""),
    contract_duration: timed ? String(draft.contract_duration ?? "").trim() : "",
    diploma_prepared: alternance ? String(draft.diploma_prepared ?? "").trim() : "",
    alternance_school: alternance ? String(draft.alternance_school ?? "").trim() : "",
    work_rhythm: alternance ? String(draft.work_rhythm ?? "").trim() : "",
    experience_level: String(draft.experience_level ?? ""),
    education_level: alternance ? "" : String(draft.education_level ?? ""),
    requirements: String(draft.requirements ?? "").trim(),
    salary_min: typeof draft.salary_min === "number" ? draft.salary_min : null,
    salary_max: typeof draft.salary_max === "number" && draft.salary_max > 0 ? draft.salary_max : null,
    salary_period: draft.salary_period === "year" ? "year" : "month",
    hours_per_week: typeof draft.hours_per_week === "number" && Number.isFinite(draft.hours_per_week) ? draft.hours_per_week : null,
    start_label: String(draft.start_label ?? "").trim(),
    headcount: typeof draft.headcount === "number" && draft.headcount > 0 ? Math.round(draft.headcount) : null,
    benefits: Array.isArray(draft.benefits) ? draft.benefits : [],
    salary_range:
      contract === "Freelance"
        ? formatFreelancePay(draft.freelance_mode, draft.freelance_percent, draft.freelance_fixe, draft.freelance_tjm) || String(draft.salary_range ?? "").trim()
        : formatOfferPay(draft.salary_min, draft.salary_max, draft.salary_period === "year" ? "year" : "month") || String(draft.salary_range ?? "").trim(),
    recruitment_steps: Array.isArray(draft.recruitment_steps) ? draft.recruitment_steps : [],
    requested_documents: draft.requested_documents ?? { cv: "required", cover_letter: "optional", portfolio: "optional" },
    screening_questions: Array.isArray(draft.screening_questions) ? draft.screening_questions : [],
    application_deadline: draft.application_deadline ?? null,
    diffusion: draft.diffusion ?? { byound: true, linkedin: false },
  });
}

type OfferStatus = "draft" | "active" | "paused" | "closed";

type AnonymityNotice = { flags: AnonymityFlag[]; rewrite: AnonymityRewrite };

function readAnonymity(json: {
  anonymity?: AnonymityNotice | null;
  flags?: AnonymityFlag[];
  rewrite?: AnonymityRewrite;
}): AnonymityNotice | null {
  const flags = json.anonymity?.flags ?? json.flags ?? [];
  if (!flags.length) return null;
  return { flags, rewrite: json.anonymity?.rewrite ?? json.rewrite ?? {} };
}

function asStatus(value: string | null | undefined): OfferStatus {
  if (value === "active" || value === "paused" || value === "closed" || value === "draft") return value;
  return "draft";
}

export function OfferBuilder({ offerId }: { offerId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = Math.min(4, Math.max(1, Number(searchParams.get("step") ?? "1") || 1));
  const [step, setStep] = useState(initialStep);
  const [offer, setOffer] = useState<OfferPoste>({ title: "Sans titre", status: "draft" });
  const [ready, setReady] = useState(false);
  const [skills, setSkills] = useState<OfferSkillDraft[]>([]);
  const skillsBaseline = useRef("");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const baseline = useRef("");
  const [tick, setTick] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [anonymity, setAnonymity] = useState<AnonymityNotice | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [company, setCompany] = useState<{ name: string; logoUrl: string | null }>({ name: "", logoUrl: null });
  const [discrimination, setDiscrimination] = useState<{ status: "idle" | "checking" | "clean" | "review"; findings: DiscriminationFinding[] }>({ status: "idle", findings: [] });
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/dashboard/entreprise/overview", { credentials: "include" })
      .then((res) => res.json())
      .then((json: { organisation?: { name?: string; logo_url?: string | null } }) => {
        if (cancelled) return;
        setCompany({
          name: String(json.organisation?.name ?? ""),
          logoUrl: String(json.organisation?.logo_url ?? "").trim() || null,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!offerId) return;
    let cancelled = false;
    void (async () => {
      let loaded: OfferPoste | null = null;
      try {
        const res = await fetch(`/api/dashboard/entreprise/job-offers/${offerId}`, { credentials: "include" });
        const json = (await res.json().catch(() => null)) as { offer?: OfferPoste & { updated_at?: string } } | null;
        if (res.ok && json?.offer && !cancelled) {
          const poste = preparePosteDraft(json.offer);
          const conditions = prepareConditions(poste.draft);
          const prepared = prepareCandidature(conditions.draft);
          loaded = prepared.draft;
          setOffer(prepared.draft);
          baseline.current = poste.folded || conditions.folded || prepared.folded ? "" : serializePoste(prepared.draft);
          const updated = Date.parse(String(json.offer.updated_at ?? ""));
          setSavedAt(Number.isNaN(updated) ? Date.now() : updated);
        }
        const skillsRes = await fetch(`/api/dashboard/entreprise/job-offers/${offerId}/skills`, { credentials: "include" });
        const skillsJson = (await skillsRes.json().catch(() => null)) as { skills?: OfferSkillDraft[] } | null;
        if (!cancelled) {
          const next = skillsRes.ok ? skillsJson?.skills ?? [] : [];
          setSkills(next);
          skillsBaseline.current = JSON.stringify(next.map((skill) => ({ label: skill.label, kind: skill.kind, importance: skill.importance })));
        }
      } catch {
        loaded = null;
      } finally {
        if (!cancelled) {
          setReady(true);
          if (loaded) void scanDiscrimination(loaded);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [offerId]);

  useEffect(() => {
    if (offerId) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        const res = await fetch("/api/dashboard/entreprise/job-offers", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "draft", title: "Sans titre" }),
        });
        const json = (await res.json()) as { offer?: { id?: string }; error?: string };
        if (!res.ok || !json.offer?.id) {
          toast.error(json.error ?? "Brouillon impossible");
          return;
        }
        router.replace(`/dashboard/entreprise/offres/${json.offer.id}/edition?step=${stepRef.current}`);
      })();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [offerId, router]);

  useEffect(() => {
    if (!offerId || !ready) return;
    const payload = serializePoste(offer);
    if (payload === baseline.current) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/dashboard/entreprise/job-offers/${offerId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        const json = (await res.json()) as { error?: string; anonymity?: AnonymityNotice | null; flags?: AnonymityFlag[]; rewrite?: AnonymityRewrite };
        const notice = readAnonymity(json);
        setAnonymity(notice);
        if (!res.ok) {
          toast.error(json.error ?? "Enregistrement impossible");
          return;
        }
        baseline.current = payload;
        setSavedAt(Date.now());
        void scanDiscrimination(JSON.parse(payload) as OfferPoste);
      })();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [offer, offerId, ready]);

  useEffect(() => {
    if (!offerId || !ready) return;
    const payload = JSON.stringify(skills.map((skill) => ({ label: skill.label, kind: skill.kind, importance: skill.importance })));
    if (payload === skillsBaseline.current) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/dashboard/entreprise/job-offers/${offerId}/skills`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skills }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) {
          toast.error(json.error ?? "Compétences non enregistrées");
          return;
        }
        skillsBaseline.current = payload;
        setSavedAt(Date.now());
      })();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [skills, offerId, ready]);

  useEffect(() => {
    if (!focusId) return;
    const target = focusId === "description" ? "offer-description" : focusId === "place" ? "offer-city" : focusId === "skills" ? "offer-skill-search" : focusId === "benefits" ? "offer-benefits" : focusId === "salary" ? "offer-salary" : focusId === "steps" ? "offer-steps" : focusId === "channels" ? "offer-channels" : "offer-title";
    document.getElementById(target)?.focus();
    setFocusId(null);
  }, [focusId, step]);

  const checks = useMemo(
    () => offerChecklist({ ...offer, required_skills: skills.filter((skill) => skill.importance === "required").length }),
    [offer, skills],
  );
  const doneCount = checks.filter((item) => item.ok).length;
  const current = OFFER_STEPS[step - 1] ?? OFFER_STEPS[0];
  const title = String(offer.title ?? "").trim() || "Sans titre";
  const seconds = savedAt ? Math.max(0, Math.round((Date.now() - savedAt) / 1000)) : null;
  void tick;

  const scanDiscrimination = async (draft: OfferPoste) => {
    const payload = {
      title: String(draft.title ?? ""),
      description: String(draft.description ?? ""),
      questions: (draft.screening_questions ?? []).map((question) => ({ id: question.id, prompt: question.prompt })),
    };
    const local = scanOfferDiscrimination(payload);
    setDiscrimination(local.length ? { status: "review", findings: local } : { status: "checking", findings: [] });
    try {
      const res = await fetch("/api/dashboard/entreprise/job-offers/discrimination", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { findings?: DiscriminationFinding[] };
      if (!res.ok) {
        setDiscrimination(local.length ? { status: "review", findings: local } : { status: "clean", findings: [] });
        return;
      }
      const findings = Array.isArray(json.findings) ? json.findings : local;
      setDiscrimination(findings.length ? { status: "review", findings } : { status: "clean", findings: [] });
    } catch {
      setDiscrimination(local.length ? { status: "review", findings: local } : { status: "clean", findings: [] });
    }
  };

  const applyFinding = (finding: DiscriminationFinding) => {
    setOffer((prev) => {
      if (finding.field === "title") return { ...prev, title: finding.rewrite };
      if (finding.field === "description") return { ...prev, description: finding.rewrite };
      return {
        ...prev,
        screening_questions: (prev.screening_questions ?? []).map((question) => question.id === finding.questionId ? { ...question, prompt: finding.rewrite } : question),
      };
    });
  };

  const applyAnonymityRewrite = () => {
    const rewrite = anonymity?.rewrite;
    if (!rewrite) return;
    setOffer((prev) => ({
      ...prev,
      ...(rewrite.title ? { title: rewrite.title } : {}),
      ...(rewrite.description ? { description: rewrite.description } : {}),
      ...(rewrite.requirements ? { requirements: rewrite.requirements } : {}),
      ...(rewrite.diploma_prepared ? { diploma_prepared: rewrite.diploma_prepared } : {}),
      ...(rewrite.city ? { city: rewrite.city } : {}),
      screening_questions: rewrite.screening_questions?.length
        ? (prev.screening_questions ?? []).map((question) => {
            const next = rewrite.screening_questions?.find((item) => item.id === question.id);
            return next ? { ...question, prompt: next.prompt } : question;
          })
        : prev.screening_questions,
    }));
    setAnonymity(null);
  };

  const go = (next: number) => {
    const safe = Math.min(4, Math.max(1, next));
    setStep(safe);
    if (offerId) router.replace(`/dashboard/entreprise/offres/${offerId}/edition?step=${safe}`);
  };

  const publish = async () => {
    if (!offerId || doneCount < checks.length) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/dashboard/entreprise/job-offers/${offerId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "publish" }),
      });
      const json = (await res.json()) as { error?: string; publicStatus?: string | null; anonymity?: AnonymityNotice | null; flags?: AnonymityFlag[]; rewrite?: AnonymityRewrite };
      const notice = readAnonymity(json);
      setAnonymity(notice);
      if (!res.ok) throw new Error(json.error ?? ANONYMITY_MESSAGE);
      toast.success(json.publicStatus === "pending_review"
        ? "Offre enregistrée. La première offre publique est relue avant d'apparaître sur byound.fr."
        : "Offre publiée");
      setOffer((prev) => ({ ...prev, status: "active" }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publication impossible");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={`${manrope.className} px-4 py-6 text-[#07080B] sm:px-8`}>
      <BuilderTopBar
        backHref="/dashboard/entreprise/offres"
        title={title}
        status={asStatus(offer.status)}
        savedLabel={
          seconds == null
            ? "Enregistrement automatique au premier passage"
            : seconds < 5
              ? "Enregistré automatiquement à l'instant"
              : `Enregistré automatiquement il y a ${seconds} s`
        }
        preview={
          offerId ? (
            <a
              href={`/offres/apercu/${offerId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#07080B]"
            >
              Aperçu candidat
            </a>
          ) : (
            <span className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#6B6F7A]">
              Aperçu candidat
            </span>
          )
        }
        publishLabel={publishing ? "Publication…" : `Publier · ${doneCount} / ${checks.length}`}
        publishDisabled={publishing || doneCount < checks.length}
        onPublish={() => void publish()}
      />
      <div className="mt-6">
        <FicheStepper
          steps={OFFER_STEPS.map((item) => ({ id: item.id, title: item.title, caption: item.caption }))}
          current={step}
          done={OFFER_STEPS.filter((item) => item.id < step).map((item) => item.id)}
          onChange={go}
        />
      </div>
      <div className="mt-6 grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[28px] bg-white p-6 sm:p-8">
          {anonymity ? (
            <div className="mb-6 rounded-2xl border border-[#E7A92C] bg-[#FFF8E8] p-4">
              <p className="text-sm font-semibold text-[#2A1F06]">{ANONYMITY_MESSAGE}</p>
              <ul className="mt-3 space-y-1 text-sm text-[#2A1F06]">
                {anonymity.flags.map((flag) => (
                  <li key={`${flag.field}-${flag.excerpt}`}><mark className="rounded bg-[#E7A92C]/50 px-1">{flag.excerpt}</mark></li>
                ))}
              </ul>
              <button type="button" onClick={applyAnonymityRewrite} className="mt-3 h-10 rounded-full bg-[#12141A] px-4 text-sm font-semibold text-white">
                Reformuler avec Byound
              </button>
            </div>
          ) : null}
          <h2 className="text-[22px] font-extrabold tracking-[-0.03em]">{current.title}</h2>
          <p className="mt-1 text-sm text-[#6B6F7A]">{current.caption}</p>
          {step === 1 ? (
            <OfferStepPoste
              draft={offer}
              onChange={(patch) => setOffer((prev) => ({ ...prev, ...patch }))}
            />
          ) : null}
          {step === 2 ? (
            <OfferStepSkills
              title={title}
              description={String(offer.description ?? "")}
              skills={skills}
              onChange={setSkills}
            />
          ) : null}
          {step === 3 ? <OfferStepConditions key={ready ? "loaded" : "draft"} draft={offer} onChange={(patch) => setOffer((prev) => ({ ...prev, ...patch }))} /> : null}
          {step === 4 && offerId ? <OfferStepCandidature key={ready ? "loaded" : "draft"} offerId={offerId} draft={offer} onChange={(patch) => setOffer((prev) => ({ ...prev, ...patch }))} /> : null}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => go(step - 1)}
              disabled={step === 1}
              className="h-12 rounded-full border border-[#E3E0D8] px-5 text-sm font-semibold disabled:opacity-40"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => (step === 4 ? void publish() : go(step + 1))}
              className="h-12 rounded-full bg-[#07080B] px-5 text-sm font-semibold text-white"
            >
              {step === 4 ? "Vérifier et publier" : `Suivant : ${OFFER_STEPS[step]?.title ?? ""}`}
            </button>
          </div>
        </section>
        <aside className="min-[1100px]:sticky min-[1100px]:top-6">
          <details className="min-[1100px]:hidden">
            <summary className="cursor-pointer list-none rounded-[28px] bg-white px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              Aperçu de l&apos;annonce
            </summary>
            <div className="mt-3">
              <OfferPreviewCard draft={offer} companyName={company.name} logoUrl={company.logoUrl} />
            </div>
          </details>
          <div className="hidden min-[1100px]:block">
            <OfferPreviewCard draft={offer} companyName={company.name} logoUrl={company.logoUrl} />
          </div>
          <div className="mt-4">
            <PublishChecklist items={checks} onComplete={(item) => { go(item.step); setFocusId(item.id); }} />
            <OfferDiscriminationNote status={discrimination.status} findings={discrimination.findings} onApply={applyFinding} />
          </div>
        </aside>
      </div>
    </div>
  );
}
