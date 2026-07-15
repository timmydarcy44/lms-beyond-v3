"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildCatalogueEmailPreview,
  DEFAULT_CATALOGUE_EMAIL_BODY,
  DEFAULT_CATALOGUE_EMAIL_SUBJECT,
} from "@/lib/crm/pipeline-catalogue-email-shared";
import { resolveCatalogueFromForCurrentUser } from "@/lib/crm/pipeline-btob-owners";

export type CatalogueEmailDeal = {
  id: string;
  company_name: string;
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  contact_civility?: string | null;
  email?: string | null;
};

export function PipelineCatalogueEmailOverlay({
  open,
  onOpenChange,
  deal,
  currentUserEmail,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: CatalogueEmailDeal | null;
  currentUserEmail: string | null;
  onSent: () => void | Promise<void>;
}) {
  const [toEmail, setToEmail] = useState("");
  const [bodyText, setBodyText] = useState(DEFAULT_CATALOGUE_EMAIL_BODY);
  const [sending, setSending] = useState(false);

  const from = useMemo(
    () => resolveCatalogueFromForCurrentUser(currentUserEmail),
    [currentUserEmail],
  );

  const preview = useMemo(() => {
    if (!deal) return "";
    return buildCatalogueEmailPreview(bodyText, deal);
  }, [bodyText, deal]);

  useEffect(() => {
    if (!open || !deal) return;
    setToEmail(deal.email?.trim() ?? "");
    setBodyText(DEFAULT_CATALOGUE_EMAIL_BODY);
  }, [open, deal]);

  const sendCatalogue = async () => {
    if (!deal?.id) return;
    const recipient = toEmail.trim();
    if (!recipient) {
      toast.error("Adresse email du destinataire requise");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/super-admin/crm/pipeline/deals/${deal.id}/send-catalogue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_email: from.email,
          to_email: recipient,
          body_text: bodyText,
          contact_civility: deal.contact_civility ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      toast.success("Catalogue envoyé par email");
      onOpenChange(false);
      await onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-slate-700 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5 text-indigo-300" />
            Envoyer le catalogue EDGE
          </DialogTitle>
        </DialogHeader>

        {deal ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Prospect : <span className="font-semibold text-white">{deal.company_name}</span>
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-400">De</Label>
              <Input
                readOnly
                value={`${from.name} <${from.email}>`}
                className="border-white/15 bg-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-400">À</Label>
              <Input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="contact@entreprise.fr"
                className="border-white/15 bg-white/10 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-400">Objet</Label>
              <Input
                readOnly
                value={DEFAULT_CATALOGUE_EMAIL_SUBJECT}
                className="border-white/15 bg-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-slate-400">Message</Label>
              <Textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={7}
                className="border-white/15 bg-white/10 font-mono text-sm text-white placeholder:text-slate-500"
              />
              <p className="text-[11px] text-slate-400">
                La salutation (Bonjour Monsieur/Madame…) est ajoutée automatiquement selon la civilité.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200/80">
                Aperçu
              </p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-200">{preview}</pre>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Paperclip className="h-4 w-4 shrink-0" />
              Pièce jointe : Catalogue_EDGE_2027.pdf
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-500"
            onClick={() => void sendCatalogue()}
            disabled={sending || !deal}
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Valider et envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
