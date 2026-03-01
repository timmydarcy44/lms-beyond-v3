 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, FileCheck2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BnsPrivateHeader } from "@/components/beyond-no-school/bns-private-header";
import { proofPlanToPlaylist, type ProofPlanSnapshot } from "@/lib/bns/proof-plan";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type PlanResponse = {
  proof: { id: string; slug: string; title: string; description?: string | null };
  plan: { snapshot: ProofPlanSnapshot };
};

type Enrollment = {
  id: string;
  status: string;
  current_step_index: number;
  proof_id: string;
};

export default function BeyondNoSchoolPreuveWorkspacePage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";
  const [planData, setPlanData] = useState<PlanResponse | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [artifactUrl, setArtifactUrl] = useState("");
  const [artifactTitle, setArtifactTitle] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadPlan = async () => {
      const response = await fetch(`/api/bns/proofs/${id}`);
      const result = await response.json();
      if (result.ok) {
        setPlanData(result);
      }
    };
    if (id) {
      loadPlan();
    }
  }, [id]);

  useEffect(() => {
    const loadEnrollment = async () => {
      const response = await fetch("/api/bns/me/proofs");
      const result = await response.json();
      if (result.ok) {
        const match = (result.enrollments ?? []).find(
          (item: any) => item.bns_proofs?.slug === id || item.proof_id === id,
        );
        if (match) {
          setEnrollment({
            id: match.id,
            status: match.status,
            current_step_index: match.current_step_index,
            proof_id: match.proof_id,
          });
        }
      }
    };
    loadEnrollment();
  }, [id]);

  const handleEnroll = async () => {
    setStatus(null);
    const response = await fetch(`/api/bns/proofs/${id}/enroll`, { method: "POST" });
    const result = await response.json();
    if (result.ok) {
      setEnrollment(result.enrollment);
      setStatus("Tu es inscrit à cette preuve.");
    } else {
      setStatus("Impossible de démarrer la preuve.");
    }
  };

  const handleSubmitArtifact = async () => {
    if (!enrollment) return;
    setStatus(null);
    const response = await fetch(`/api/bns/me/proofs/${enrollment.id}/artifacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: artifactTitle,
        url: artifactUrl,
        artifact_type: "link",
      }),
    });
    const result = await response.json();
    if (result.ok) {
      setArtifactTitle("");
      setArtifactUrl("");
      setStatus("Livrable enregistré.");
    } else {
      setStatus("Impossible d’enregistrer le livrable.");
    }
  };

  if (!planData) {
    return (
      <main className="min-h-screen bg-[#0b0b10] text-white">
        <BnsPrivateHeader />
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-12 lg:px-24">
          <p className="text-sm text-white/70">Preuve introuvable ou non publiée.</p>
          <Link
            href="/beyond-no-school/preuves"
            className="mt-4 inline-flex text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
          >
            Retour aux preuves
          </Link>
        </div>
      </main>
    );
  }

  const playlist = proofPlanToPlaylist(planData.plan.snapshot);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,88,61,0.18),transparent_45%),radial-gradient(circle_at_82%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <BnsPrivateHeader />

      <section className="mx-auto max-w-5xl space-y-10 px-6 pb-16 pt-12 sm:px-12 lg:px-24">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Preuve en cours
          </p>
          <h1 className="text-pretty text-3xl font-semibold sm:text-4xl">
            {planData.proof.title}
          </h1>
          <p className="text-lg text-white/70">{planData.proof.description}</p>
          {planData.plan.snapshot.recognitionGoal ? (
            <p className="text-sm text-white/60">
              Objectif : {planData.plan.snapshot.recognitionGoal}
            </p>
          ) : null}
          {enrollment ? (
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Statut : {enrollment.status}
            </p>
          ) : (
            <Button
              className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
              onClick={handleEnroll}
            >
              Démarrer cette preuve
            </Button>
          )}
        </motion.div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
            <FileCheck2 className="h-4 w-4" />
            Étapes à suivre
          </div>
          <div className="mt-6 space-y-4">
            {planData.plan.snapshot.steps.map((step, index) => (
              <div key={step.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Étape {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-white/70">{step.description}</p>
                <div className="mt-4 space-y-2">
                  {step.contents.map((content) => (
                    <div key={content.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        {content.node_type === "action"
                          ? "Action"
                          : content.node_type === "resource"
                            ? "Ressource"
                            : "Contenu"}
                      </p>
                      <p className="mt-2 text-sm text-white/70">{content.title}</p>
                      <p className="mt-1 text-xs text-white/50">
                        {content.content_type ?? "module"} · {content.content_id ?? "à associer"}
                      </p>
                      {content.node_type === "resource" && content.resource_url ? (
                        <a
                          href={content.resource_url}
                          className="mt-2 inline-flex text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white"
                        >
                          Ouvrir la ressource
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Livrable attendu
          </p>
          <p className="mt-3 text-sm text-white/70">
            Dépose une preuve concrète. L’équipe de validation reviendra vers toi.
          </p>
          {planData.plan.snapshot.finalDeliverable ? (
            <p className="mt-2 text-sm text-white/60">
              {planData.plan.snapshot.finalDeliverable}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Titre du livrable"
              value={artifactTitle}
              onChange={(event) => setArtifactTitle(event.target.value)}
              className="border-white/20 bg-white/5 text-white"
            />
            <Input
              placeholder="Lien vers le livrable"
              value={artifactUrl}
              onChange={(event) => setArtifactUrl(event.target.value)}
              className="border-white/20 bg-white/5 text-white"
            />
          </div>
          <div className="mt-4">
            <Button
              onClick={handleSubmitArtifact}
              disabled={!enrollment || !artifactUrl}
              className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90 disabled:opacity-60"
            >
              Déposer le livrable
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-white/50">
            <ShieldCheck className="h-4 w-4 text-white/60" />
            Validation
          </div>
          <p className="mt-4 text-sm text-white/70">
            La validation humaine intervient après dépôt du livrable.
          </p>
          <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
            <ArrowRight className="h-4 w-4" />
            Open Badge délivré après validation.
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">
            Contenus associés
          </p>
          <p className="mt-3 text-sm text-white/70">
            Ces contenus soutiennent l’exécution de la preuve.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {playlist.map((item) => (
              <div key={`${item.stepId}-${item.title}`} className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Module</p>
                <p className="mt-2 text-sm text-white/70">{item.title}</p>
                <p className="mt-1 text-xs text-white/50">
                  {item.contentType ?? "module"} · {item.contentId ?? "à associer"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {status ? <p className="text-sm text-white/70">{status}</p> : null}
      </section>
    </main>
  );
}
