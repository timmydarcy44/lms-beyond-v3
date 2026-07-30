"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { pipelineOwnerLabel } from "@/lib/crm/pipeline-btob-owners";
import {
  PRESCRIPTEUR_ACTION_TYPES,
  type PrescripteurActionType,
  prescripteurActionIcon,
  prescripteurActionLabel,
} from "@/lib/crm/pipeline-prescripteur-action-types";
import { normalizeLinkedInUrl } from "@/lib/crm/pipeline-deal-intelligence";

export type PrescripteurAction = {
  id: string;
  action_type: string;
  title?: string | null;
  notes?: string | null;
  created_at: string;
  created_by_email?: string | null;
};

function formatActionWhen(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy · HH:mm", { locale: fr });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export function PipelinePrescripteurActionsSection({
  prescripteurId,
  phone,
  email,
  linkedInUrl,
  currentUserEmail,
}: {
  prescripteurId?: string | null;
  phone?: string | null;
  email?: string | null;
  linkedInUrl?: string | null;
  currentUserEmail: string | null;
}) {
  const [actions, setActions] = useState<PrescripteurAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draftType, setDraftType] = useState<PrescripteurActionType>("phone");
  const [draftNotes, setDraftNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const linkedInHref = linkedInUrl?.trim() ? normalizeLinkedInUrl(linkedInUrl.trim()) : null;

  const load = useCallback(async () => {
    if (!prescripteurId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/crm/prescripteurs/${prescripteurId}/actions`);
      const json = await parseFetchJson<{ error?: string; actions?: PrescripteurAction[] }>(res);
      if (!res.ok) throw new Error(json.error);
      setActions(json.actions ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement historique impossible");
    } finally {
      setLoading(false);
    }
  }, [prescripteurId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createAction = async (opts: { actionType: PrescripteurActionType; notes?: string }) => {
    if (!prescripteurId) {
      toast.error("Enregistrez la fiche avant d'ajouter une action.");
      return false;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/crm/prescripteurs/${prescripteurId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: opts.actionType,
          notes: opts.notes?.trim() || null,
          created_by_email: currentUserEmail,
        }),
      });
      const json = await parseFetchJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      await load();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const openQuickAdd = (type: PrescripteurActionType) => {
    setDraftType(type);
    setDraftNotes("");
    setAddOpen(true);
  };

  const quickLog = async (type: PrescripteurActionType) => {
    if (type === "phone" && phone?.trim()) {
      window.location.href = `tel:${phone.replace(/\s/g, "")}`;
      await createAction({
        actionType: "phone",
        notes: `Appel vers ${phone.trim()}`,
      });
      return;
    }
    if (type === "email" && email?.trim()) {
      window.location.href = `mailto:${email.trim()}`;
      await createAction({
        actionType: "email",
        notes: `Email à ${email.trim()}`,
      });
      return;
    }
    if (type === "linkedin_contact" && linkedInHref) {
      window.open(linkedInHref, "_blank", "noopener,noreferrer");
      await createAction({
        actionType: "linkedin_contact",
        notes: `Contact LinkedIn · ${linkedInHref}`,
      });
      return;
    }
    openQuickAdd(type);
  };

  const submitDraft = async () => {
    const ok = await createAction({ actionType: draftType, notes: draftNotes });
    if (!ok) return;
    setAddOpen(false);
    setDraftNotes("");
    toast.success("Action enregistrée");
  };

  if (!prescripteurId) {
    return (
      <section className="rounded-xl border border-dashed border-amber-400/30 bg-amber-950/20 p-4 text-sm text-amber-100">
        Enregistrez la fiche pour journaliser les actions et consulter l&apos;historique.
      </section>
    );
  }

  return (
    <>
      <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">Actions & historique</p>
            <p className="mt-0.5 text-xs text-slate-400">Touches relationnelles style Revolut</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => openQuickAdd("note")}
          >
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3">
          {PRESCRIPTEUR_ACTION_TYPES.filter((t) =>
            ["linkedin_contact", "phone", "email", "informal_meeting", "coffee", "restaurant_invite"].includes(
              t.value,
            ),
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              disabled={submitting}
              onClick={() => void quickLog(t.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-3 text-center transition",
                "hover:border-white/25 hover:bg-white/[0.12] active:scale-[0.98]",
                "disabled:opacity-50",
              )}
            >
              <span className="text-[1.65rem] leading-none" aria-hidden>
                {t.icon}
              </span>
              <span className="text-[11px] font-medium leading-tight text-white/90">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Historique
          </p>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </p>
          ) : actions.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune action enregistrée pour l&apos;instant.</p>
          ) : (
            <ul className="relative space-y-0 border-l border-white/15 pl-4">
              {actions.map((a) => (
                <li key={a.id} className="relative pb-4 last:pb-0">
                  <span className="absolute -left-[1.35rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-sm ring-2 ring-white/15">
                    {prescripteurActionIcon(a.action_type)}
                  </span>
                  <div className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                    <p className="text-sm font-semibold text-white">
                      {prescripteurActionLabel(a.action_type)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatActionWhen(a.created_at)}
                      {a.created_by_email ? ` · ${pipelineOwnerLabel(a.created_by_email)}` : null}
                    </p>
                    {a.notes ? <p className="mt-2 text-sm text-slate-300">{a.notes}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="gap-4 border-slate-800 bg-slate-950 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Nouvelle action</DialogTitle>
            <DialogDescription className="text-slate-400">
              Choisissez le type — date, heure et auteur sont enregistrés automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2">
            {PRESCRIPTEUR_ACTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition",
                  draftType === t.value
                    ? "border-indigo-400/60 bg-indigo-500/20"
                    : "border-white/10 bg-white/[0.04] hover:border-white/25",
                )}
                onClick={() => setDraftType(t.value)}
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {t.icon}
                </span>
                <span className="text-[10px] font-medium leading-tight text-white/90">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300">Notes (optionnel)</Label>
            <Textarea
              className="border-white/15 bg-white/5 text-white placeholder:text-slate-500"
              rows={3}
              placeholder="Compte-rendu court…"
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-transparent text-white"
              onClick={() => setAddOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-500"
              disabled={submitting}
              onClick={() => void submitDraft()}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
