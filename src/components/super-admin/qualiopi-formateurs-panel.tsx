"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_MUTED,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

type Expert = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
};

type PlanAction = {
  id: string;
  title: string;
  status: "todo" | "done";
  action_date: string | null;
};

type Plan = {
  id: string;
  expert_id: string;
  year: number;
  needs: string | null;
  crm_qualiopi_formateur_actions?: PlanAction[];
};

export function QualiopiFormateursPanel() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expertId, setExpertId] = useState("");
  const [needs, setNeeds] = useState("");
  const [actionTitle, setActionTitle] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/formateurs");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Formateurs");
      setExperts(json.experts ?? []);
      setPlans(json.plans ?? []);
      if (!selectedPlan && json.plans?.[0]?.id) setSelectedPlan(json.plans[0].id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [selectedPlan]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPlan = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/formateurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expert_id: expertId,
        needs,
        skills: { pedagogie: 3, technique: 3, digital: 3 },
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Création impossible");
      return;
    }
    toast.success("Plan créé");
    setSelectedPlan(json.plan.id);
    await load();
  };

  const addAction = async () => {
    if (!selectedPlan) {
      toast.error("Sélectionnez un plan");
      return;
    }
    const res = await fetch("/api/super-admin/crm/qualiopi/formateurs/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: selectedPlan,
        title: actionTitle,
        action_date: new Date().toISOString().slice(0, 10),
        status: "done",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Action impossible");
      return;
    }
    setActionTitle("");
    toast.success("Action formateur enregistrée");
    await load();
  };

  const toggleAction = async (id: string, status: "todo" | "done") => {
    const res = await fetch("/api/super-admin/crm/qualiopi/formateurs/actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error || "Mise à jour impossible");
      return;
    }
    await load();
  };

  const expertLabel = (id: string) => {
    const e = experts.find((x) => x.id === id);
    if (!e) return id.slice(0, 8);
    return `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim() || id.slice(0, 8);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Compétences formateurs</h1>
        <p className={cn("mt-1 max-w-2xl text-sm", QUALIOPI_MUTED)}>
          Indicateur 22 — un plan + une action réalisée débloque la preuve auto.
        </p>
      </div>

      {loading ? (
        <p className={cn("flex items-center gap-2 text-sm", QUALIOPI_MUTED)}>
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <h2 className="text-lg font-semibold text-white">Nouveau plan</h2>
            <div className="mt-3 space-y-2">
              <select
                value={expertId}
                onChange={(e) => setExpertId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white"
              >
                <option value="">Expert approuvé…</option>
                {experts.map((e) => (
                  <option key={e.id} value={e.id}>
                    {`${e.first_name ?? ""} ${e.last_name ?? ""}`.trim()} — {e.headline ?? ""}
                  </option>
                ))}
              </select>
              <textarea
                value={needs}
                onChange={(e) => setNeeds(e.target.value)}
                placeholder="Besoins de développement"
                className="min-h-20 w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
              />
              <Button type="button" onClick={() => void createPlan()} className="bg-[#3D7BFF] text-white">
                Créer le plan {new Date().getFullYear()}
              </Button>
            </div>
            {experts.length < 2 ? (
              <p className="mt-3 text-xs text-amber-200">
                Moins de 2 experts approuvés — complétez aussi l’indicateur 21 via /super/experts.
              </p>
            ) : null}
          </section>

          <section className={cn(QUALIOPI_CARD, "p-5")}>
            <h2 className="text-lg font-semibold text-white">Actions</h2>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white"
            >
              <option value="">Plan…</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {expertLabel(p.expert_id)} — {p.year}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2">
              <input
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="Ex. formation pédagogie IA"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]"
              />
              <Button type="button" onClick={() => void addAction()} className="bg-[#6E5BFF] text-white">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ul className="mt-4 space-y-2">
              {plans
                .filter((p) => !selectedPlan || p.id === selectedPlan)
                .flatMap((p) =>
                  (p.crm_qualiopi_formateur_actions ?? []).map((a) => (
                    <li key={a.id} className={cn(QUALIOPI_CARD_INNER, "flex items-center justify-between gap-2 p-3")}>
                      <div>
                        <p className="text-sm text-white">{a.title}</p>
                        <p className={cn("text-xs", QUALIOPI_MUTED)}>
                          {expertLabel(p.expert_id)} {a.action_date ? `· ${a.action_date}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void toggleAction(a.id, a.status === "done" ? "todo" : "done")}
                        className={cn(
                          "rounded-full px-3 py-1 text-[11px]",
                          a.status === "done" ? "bg-emerald-500/20 text-emerald-200" : "bg-white/5 text-white/50",
                        )}
                      >
                        {a.status === "done" ? "Fait" : "À faire"}
                      </button>
                    </li>
                  )),
                )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
