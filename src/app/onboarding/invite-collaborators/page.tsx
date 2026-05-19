"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Mail, Save } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { toast } from "sonner";

export default function InviteCollaborators() {
  const router = useRouter();
  const supabase = useSupabase();
  const [emails, setEmails] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    const emailList = emails
      .split(/[\n,]+/)
      .map((e) => e.trim())
      .filter((e) => e !== "" && e.includes("@"));
    setCount(emailList.length);
  }, [emails]);

  const handleNext = async () => {
    if (count === 0) return;
    try {
      const emailList = emails
        .split(/[\n,]+/)
        .map((e) => e.trim())
        .filter((e) => e !== "" && e.includes("@"));

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userData.user;
      if (!user) throw new Error("not_authenticated");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id, role")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      const companyId = (profile as any)?.company_id as string | undefined;
      if (!companyId) throw new Error("missing_company");

      const rows = emailList.map((email) => ({
        company_id: companyId,
        email,
      }));

      const { error: insertError } = await supabase.from("employees").insert(rows);
      if (insertError) throw insertError;

      toast.success("Collaborateurs importés.");
      router.push("/onboarding/launch-diagnostic");
    } catch {
      toast.error("Impossible d'importer les collaborateurs.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#020617] px-6 py-20 font-sans text-white">
      <div className="mb-8 flex items-center gap-4">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step <= 2 ? "bg-indigo-500" : "bg-white/10"}`}
          />
        ))}
      </div>

      <div className="mb-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">Invitez vos collaborateurs</h1>
        <p className="mx-auto max-w-md text-gray-400">
          Plus vite ils reçoivent leur accès, plus vite vous obtenez vos premiers signaux faibles.
        </p>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-300">
              <div className="rounded-lg bg-indigo-500/20 p-2 text-indigo-400">
                <Mail size={20} />
              </div>
              <span className="font-semibold">Liste des emails</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Format: un par ligne</span>
          </div>

          <textarea
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={"jean.dupont@entreprise.com\nmarie.curie@entreprise.com"}
            className="h-80 w-full rounded-2xl border border-white/5 bg-[#0f172a]/50 p-6 font-mono text-sm leading-relaxed outline-none transition-all placeholder:text-gray-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
          />

          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/5 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold italic text-indigo-400">
              i
            </div>
            <p className="text-xs italic text-gray-400">
              Vos collaborateurs recevront un lien personnalisé pour réaliser leur test DISC et accéder à leur espace Beyond.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-gray-500">Récapitulatif</h3>

            <div className="mb-8 rounded-2xl border border-white/5 bg-[#0f172a] p-8 text-center">
              <div className="mb-2 text-6xl font-black text-white">{count}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Collaborateurs à inviter</div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleNext}
                disabled={count === 0}
                className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-bold transition-all duration-300 ${
                  count > 0
                    ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500"
                    : "cursor-not-allowed border border-white/5 bg-white/5 text-gray-600 grayscale"
                }`}
              >
                Valider les invitations {count > 0 && `(${count})`} <ArrowRight size={18} aria-hidden />
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-xs font-medium text-gray-400 transition-all hover:bg-white/5"
              >
                <Save size={14} aria-hidden /> Enregistrer en brouillon
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-6">
            <div className="mb-2 flex items-center gap-3 text-emerald-400">
              <CheckCircle2 size={18} aria-hidden />
              <span className="text-sm font-bold">Espace entreprise créé</span>
            </div>
            <p className="text-[11px] text-gray-500">Votre workspace est prêt à recevoir vos premiers utilisateurs.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
