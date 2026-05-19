"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { toast } from "sonner";

type EmployeeRow = { id: string; email: string | null };

export default function LaunchDiagnosticPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);

  const count = employees.length;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
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
        const cid = (profile as any)?.company_id as string | undefined;
        if (!cid) throw new Error("missing_company");
        if (!cancelled) setCompanyId(cid);

        const { data: employeesData, error: employeesError } = await supabase
          .from("employees")
          .select("id,email")
          .eq("company_id", cid)
          .order("created_at", { ascending: true });
        if (employeesError) throw employeesError;
        if (!cancelled) setEmployees((employeesData ?? []) as EmployeeRow[]);
      } catch {
        if (!cancelled) {
          setCompanyId(null);
          setEmployees([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const canLaunch = useMemo(() => !loading && !!companyId && count > 0 && !launching, [loading, companyId, count, launching]);

  const launch = async () => {
    if (!companyId) return;
    if (count === 0) {
      toast.error("Ajoutez d’abord des collaborateurs.");
      return;
    }
    setLaunching(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("not_authenticated");

      const payload1 = employees.map((e) => ({
        company_id: companyId,
        employee_id: e.id,
        status: "pending",
        launched_by: user.id,
      }));
      const tryInsert = async (rows: any[]) => {
        const { error } = await supabase.from("diagnostic_sessions").insert(rows);
        if (error) throw error;
      };

      try {
        await tryInsert(payload1);
      } catch {
        const payload2 = employees.map((e) => ({
          company_id: companyId,
          employee_id: e.id,
          status: "pending",
        }));
        try {
          await tryInsert(payload2);
        } catch {
          const payload3 = employees.map((e) => ({
            company_id: companyId,
            employee_email: e.email,
            status: "pending",
          }));
          await tryInsert(payload3);
        }
      }

      toast.success("Diagnostic initial lancé.");
      router.push("/dashboard/entreprise?first_launch=true");
    } catch {
      toast.error("Impossible de lancer le diagnostic initial.");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#020617] px-6 py-20 font-sans text-white">
      <div className="w-full max-w-3xl">
        <div className="mb-10 rounded-[36px] border border-white/10 bg-white/5 p-10 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3 text-indigo-300">
            <Sparkles size={18} aria-hidden />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em]">Onboarding</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Activation du diagnostic initial</h1>
          <p className="mt-3 text-sm text-gray-400">
            Beyond crée une session de diagnostic par collaborateur pour démarrer la collecte.
          </p>
        </div>

        <div className="rounded-[36px] border border-white/10 bg-white/5 p-10 backdrop-blur-sm">
          {loading ? (
            <div className="flex items-center gap-3 text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Chargement de vos collaborateurs…
            </div>
          ) : (
            <>
              <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-gray-500">Prêt à lancer</div>
              <div className="mt-2 text-2xl font-extrabold tracking-tight">
                Prêt à lancer Beyond pour <span className="text-indigo-300">{count}</span> collaborateurs ?
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={launch}
                  disabled={!canLaunch}
                  className={`inline-flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-extrabold transition-all ${
                    canLaunch
                      ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.12)] hover:bg-white/90"
                      : "cursor-not-allowed border border-white/10 bg-white/5 text-gray-600"
                  }`}
                >
                  {launching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Lancement…
                    </>
                  ) : (
                    "Lancer le diagnostic initial"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/onboarding/invite-collaborators")}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 text-xs font-semibold text-gray-300 hover:bg-white/5"
                >
                  Modifier la liste des collaborateurs
                </button>
              </div>

              {count === 0 ? (
                <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200">
                  Aucun collaborateur importé. Ajoutez des emails avant de lancer le diagnostic.
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

