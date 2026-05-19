"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type DiagnosticSessionRow = {
  id: string;
  status: string | null;
  employee_id?: string | null;
  company_id?: string | null;
  score_snapshot?: any;
};

function clampScore(v: number) {
  return Math.max(1, Math.min(10, Math.round(v)));
}

export default function DiagnosticSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = useSupabase();
  const sessionId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<DiagnosticSessionRow | null>(null);

  const [focus, setFocus] = useState(6);
  const [stress, setStress] = useState(6);
  const [engagement, setEngagement] = useState(6);
  const [cohesion, setCohesion] = useState(6);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("diagnostic_sessions")
          .select("id,status,employee_id,company_id,score_snapshot")
          .eq("id", sessionId)
          .maybeSingle();
        if (error) throw error;
        const r = (data as any as DiagnosticSessionRow | null) ?? null;
        if (!r) throw new Error("not_found");

        const status = String(r.status ?? "").toLowerCase();
        if (status === "completed") {
          router.replace("/dashboard/salarie");
          return;
        }

        const snap = r.score_snapshot ?? {};
        if (!cancelled) {
          setRow(r);
          setFocus(clampScore(Number(snap.focus ?? 6)));
          setStress(clampScore(Number(snap.stress ?? 6)));
          setEngagement(clampScore(Number(snap.engagement ?? 6)));
          setCohesion(clampScore(Number(snap.cohesion ?? 6)));
        }
      } catch {
        if (!cancelled) setRow(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router, sessionId, supabase]);

  const snapshot = useMemo(
    () => ({
      focus: clampScore(focus),
      stress: clampScore(stress),
      engagement: clampScore(engagement),
      cohesion: clampScore(cohesion),
    }),
    [cohesion, engagement, focus, stress],
  );

  const finish = async () => {
    if (!row) return;
    setSaving(true);
    try {
      // 1) complete session
      const { error: sessionError } = await supabase
        .from("diagnostic_sessions")
        .update({
          status: "completed",
          score_snapshot: snapshot,
        })
        .eq("id", row.id);
      if (sessionError) throw sessionError;

      // 2) update employee profile scores (best-effort across schemas)
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("not_authenticated");

      const attempts: Record<string, unknown>[] = [
        {
          focus_score: snapshot.focus,
          stress_score: snapshot.stress,
          engagement_score: snapshot.engagement,
          cohesion_score: snapshot.cohesion,
        },
        {
          metrics: snapshot,
        },
        {
          score_snapshot: snapshot,
        },
        {
          metadata: { diagnostic: snapshot },
        },
      ];
      let ok = false;
      for (const p of attempts) {
        const { error } = await supabase.from("profiles").update(p).eq("id", user.id);
        if (!error) {
          ok = true;
          break;
        }
      }
      if (!ok) {
        // non-blocking: session completed is the primary requirement
        toast.message("Diagnostic enregistré. (Profil non mis à jour sur cet environnement)");
      } else {
        toast.success("Diagnostic terminé. Merci.");
      }

      router.replace("/dashboard/salarie");
    } catch {
      toast.error("Impossible d’enregistrer votre diagnostic.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="flex items-center gap-3 text-sm text-white/70">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Chargement…
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="text-sm font-bold">Session introuvable</div>
          <div className="mt-2 text-xs text-white/60">Vérifiez votre lien ou contactez votre RH.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] px-6 py-16 font-sans text-white">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-10 backdrop-blur-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-400">Diagnostic</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Votre état du moment</h1>
          <p className="mt-3 text-sm text-white/65">Répondez rapidement. 30 secondes suffisent.</p>

          <div className="mt-10 space-y-7">
            <Metric label="Focus" value={focus} onChange={setFocus} />
            <Metric label="Stress" value={stress} onChange={setStress} />
            <Metric label="Engagement" value={engagement} onChange={setEngagement} />
            <Metric label="Cohésion" value={cohesion} onChange={setCohesion} />
          </div>

          <button
            type="button"
            onClick={finish}
            disabled={saving}
            className={`mt-10 inline-flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-sm font-extrabold transition-all ${
              saving
                ? "cursor-not-allowed border border-white/10 bg-white/5 text-white/50"
                : "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.10)] hover:bg-white/90"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Enregistrement…
              </>
            ) : (
              "Terminer mon diagnostic"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const v = clampScore(value);
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-bold">{label}</div>
        <div className="text-sm font-black text-indigo-200">{v}/10</div>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={v}
        onChange={(e) => onChange(clampScore(Number(e.target.value)))}
        className="mt-4 w-full"
        aria-label={label}
      />
      <div className="mt-2 flex justify-between text-[10px] font-semibold text-white/35">
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  );
}

