"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills";
import { EDGE_COLORS, EDGE_GRADIENTS } from "@/lib/edge/edge-brand";

export default function SoftSkillsIntroPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("Apprenant");
  const [phase, setPhase] = useState<"welcome" | "ready">("welcome");

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const meta = data.user?.user_metadata as { first_name?: string; firstName?: string } | undefined;
      const fromMeta = meta?.first_name ?? meta?.firstName;
      if (fromMeta?.trim()) {
        setFirstName(fromMeta.trim());
        return;
      }
      if (data.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile?.first_name?.trim()) setFirstName(profile.first_name.trim());
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("ready"), 2200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[200] flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center text-white"
      style={{ backgroundColor: EDGE_COLORS.bgDeep }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: EDGE_GRADIENTS.introHalo }}
      />
      <motion.div
        className="absolute inset-0 bg-[length:220%_220%] opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.14) 50%, transparent 58%)",
        }}
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
      />

      <motion.div
        className="relative z-10 mx-auto flex max-w-lg flex-col items-center gap-6"
        initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.p
          className="text-sm font-medium tracking-wide text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "ready" ? 1 : 0.6 }}
        >
          Bienvenue {firstName}
        </motion.p>

        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: phase === "ready" ? 1 : 0, y: phase === "ready" ? 0 : 12 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">Soft skills</h1>
          <p className="text-sm text-white/45">Intelligence relationnelle &amp; compétences clés</p>
        </motion.div>

        <motion.p
          className="max-w-md text-sm leading-relaxed text-white/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "ready" ? 1 : 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
        >
          Une lecture précise de vos compétences relationnelles. Résultats clairs, actionnables et
          certifiants.
        </motion.p>

        <motion.p
          className="text-lg font-medium"
          style={{ color: EDGE_COLORS.blueAccent }}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "ready" ? 1 : 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          {SOFT_SKILLS_QUESTIONS.length} questions · ~15 min
        </motion.p>

        <motion.div
          className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] text-white/45"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "ready" ? 1 : 0 }}
          transition={{ delay: 0.42, duration: 0.45 }}
        >
          <span>Certification Beyond</span>
          <span aria-hidden>·</span>
          <span>Analyse EDGE</span>
          <span aria-hidden>·</span>
          <span>Top 5 compétences</span>
        </motion.div>

        <motion.div
          className="mt-4 flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: phase === "ready" ? 1 : 0, scale: phase === "ready" ? 1 : 0.95 }}
          transition={{ delay: 0.55, duration: 0.45 }}
        >
          <button
            type="button"
            onClick={() => router.push("/soft-skills/test")}
            className="rounded-full px-10 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_40px_rgba(61,123,255,0.35)] transition hover:opacity-90"
            style={{ backgroundColor: EDGE_COLORS.blueAccent }}
          >
            Commencer le test
          </button>
          <Link
            href="/dashboard/apprenant"
            className="text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white/70"
          >
            Retour au dashboard
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
