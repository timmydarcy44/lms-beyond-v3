"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  JessicaSuperCard,
  JessicaSuperPage,
} from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";

export type JessicaMailContact = {
  id: string;
  label: string;
  email: string;
};

type Props = {
  contacts: JessicaMailContact[];
};

export function JessicaMailsClient({ contacts }: Props) {
  const [segment, setSegment] = useState<"all" | "single">("single");
  const [contactId, setContactId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLink, setImageLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [contacts],
  );

  const selectedEmail = sortedContacts.find((c) => c.id === contactId)?.email ?? "";

  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/jessica-mail/upload", { method: "POST", body: form });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Upload impossible");
      setImageUrl(json.url);
      toast.success("Image ajoutée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Renseignez l'objet et le message");
      return;
    }
    if (segment === "single" && !selectedEmail) {
      toast.error("Choisissez un destinataire");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/jessica-mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          segment,
          email: segment === "single" ? selectedEmail : undefined,
          imageUrl,
          imageLink: imageLink.trim() || null,
        }),
      });
      const json = (await res.json()) as { sent?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      toast.success(`Email envoyé à ${json.sent ?? 0} destinataire(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSending(false);
    }
  };

  return (
    <JessicaSuperPage
      title="Mail"
      subtitle="Envoyer un email ou une newsletter via Resend (tous les contacts ou une personne)"
      narrow
    >
      <JessicaSuperCard>
        <div className="mb-5 flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <h2 className="text-base font-semibold text-black">Composer un message</h2>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Destinataires</Label>
            <select
              className={cn(jessicaSuper.input, "w-full")}
              value={segment}
              onChange={(e) => setSegment(e.target.value as "all" | "single")}
            >
              <option value="single">Une personne</option>
              <option value="all">Tous les contacts CRM</option>
            </select>
          </div>

          {segment === "single" ? (
            <div className="space-y-1.5">
              <Label>Personne</Label>
              <select
                className={cn(jessicaSuper.input, "w-full")}
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
              >
                <option value="">Sélectionner…</option>
                {sortedContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} — {c.email}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              Envoi à {sortedContacts.length} contact(s) disposant d&apos;un email.
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Objet</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={jessicaSuper.input}
              placeholder="Votre objet"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className={jessicaSuper.input}
              placeholder="Bonjour,&#10;&#10;Votre message…"
            />
          </div>

          <div className="space-y-3 rounded-xl border border-black/[0.06] bg-neutral-50/80 p-4">
            <Label>Image newsletter (upload)</Label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50">
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Upload…" : "Choisir une image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              {imageUrl ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl(null)}>
                  Retirer l&apos;image
                </Button>
              ) : null}
            </div>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Aperçu newsletter" className="max-h-48 rounded-xl object-cover" />
            ) : null}
            <div className="space-y-1.5">
              <Label>Lien cliquable sur l&apos;image (optionnel)</Label>
              <Input
                type="url"
                value={imageLink}
                onChange={(e) => setImageLink(e.target.value)}
                className={jessicaSuper.input}
                placeholder="https://…"
              />
            </div>
          </div>

          <Button
            type="button"
            className={jessicaSuper.cta}
            disabled={sending || uploading}
            onClick={() => void handleSend()}
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Envoyer via Resend
          </Button>
        </div>
      </JessicaSuperCard>
    </JessicaSuperPage>
  );
}
