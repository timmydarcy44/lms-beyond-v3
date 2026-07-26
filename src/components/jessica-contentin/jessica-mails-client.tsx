"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
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

function paragraphsFromMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return null;
  return trimmed.split(/\n\n+/).map((block) => block.trim()).filter(Boolean);
}

export function JessicaMailsClient({ contacts }: Props) {
  const [segment, setSegment] = useState<"all" | "single">("single");
  const [contactId, setContactId] = useState("");
  const [manualEmail, setManualEmail] = useState("");
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
  const effectiveEmail = (manualEmail.trim() || selectedEmail).trim();
  const previewParagraphs = paragraphsFromMessage(message);

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
    if (segment === "single" && !effectiveEmail.includes("@")) {
      toast.error("Choisissez un destinataire ou saisissez une adresse");
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
          email: segment === "single" ? effectiveEmail : undefined,
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

  const imagePreview = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt=""
      className="mb-6 w-full max-w-[560px] rounded-xl object-cover"
    />
  ) : null;

  return (
    <JessicaSuperPage
      title="Mail"
      subtitle="Composition à gauche, aperçu newsletter à droite"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* Composition */}
        <section className={cn(jessicaSuper.card, "p-6")}>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Destinataires</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSegment("single")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    segment === "single"
                      ? "bg-[#8B6F47] text-white"
                      : "border border-black/10 bg-white text-neutral-700 hover:bg-neutral-50",
                  )}
                >
                  Un client
                </button>
                <button
                  type="button"
                  onClick={() => setSegment("all")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    segment === "all"
                      ? "bg-[#8B6F47] text-white"
                      : "border border-black/10 bg-white text-neutral-700 hover:bg-neutral-50",
                  )}
                >
                  Tout le monde ({sortedContacts.length})
                </button>
              </div>
            </div>

            {segment === "single" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Client</Label>
                  <select
                    className={cn(jessicaSuper.input, "w-full")}
                    value={contactId}
                    onChange={(e) => {
                      setContactId(e.target.value);
                      setManualEmail("");
                    }}
                  >
                    <option value="">Choisir un client…</option>
                    {sortedContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} — {c.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Ou saisir une adresse…</Label>
                  <Input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className={jessicaSuper.input}
                    placeholder="email@exemple.fr"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                Envoi à {sortedContacts.length} contact(s) disposant d&apos;un email.
              </p>
            )}

            <div className="space-y-1.5">
              <Label>Sujet</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={jessicaSuper.input}
                placeholder="Objet du message"
              />
            </div>

            <div className="space-y-3 rounded-xl border border-black/[0.06] bg-neutral-50/80 p-4">
              <Label>Image newsletter (optionnel)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50">
                  <ImagePlus className="h-4 w-4" />
                  {uploading ? "Upload…" : "Uploader une image"}
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
                    Retirer
                  </Button>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label className="text-neutral-500">Ou coller une URL https://…</Label>
                <Input
                  type="url"
                  value={imageUrl ?? ""}
                  onChange={(e) => setImageUrl(e.target.value.trim() || null)}
                  className={jessicaSuper.input}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Lien sur l&apos;image (optionnel)</Label>
                <Input
                  type="url"
                  value={imageLink}
                  onChange={(e) => setImageLink(e.target.value)}
                  className={jessicaSuper.input}
                  placeholder="https://…"
                />
                <p className="text-xs text-neutral-500">
                  Un clic sur l&apos;image dans l&apos;email ouvrira ce lien.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                className={jessicaSuper.input}
                placeholder="Écris ton message…"
              />
            </div>

            <Button
              type="button"
              className={jessicaSuper.cta}
              disabled={sending || uploading}
              onClick={() => void handleSend()}
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Envoyer
            </Button>
          </div>
        </section>

        {/* Preview */}
        <section className={cn(jessicaSuper.card, "overflow-hidden p-0")}>
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3">
            <p className="text-sm font-semibold text-black">Aperçu</p>
            <p className="truncate text-sm text-neutral-500">
              {subject.trim() || "(Sans objet)"}
            </p>
          </div>
          <div className="bg-gradient-to-b from-[#F7F3EC] to-[#EFE8DC] px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-[560px] rounded-2xl bg-white px-6 py-10 shadow-sm sm:px-10">
              <p
                className="mb-8 text-center text-2xl font-semibold tracking-tight text-[#2F2A25]"
                style={{ fontFamily: jessicaSuper.font }}
              >
                Jessica Contentin
              </p>
              <h2 className="mb-4 text-center text-xl font-semibold text-[#2F2A25]">
                {subject.trim() || "Aperçu du mail"}
              </h2>

              {imageUrl ? (
                imageLink.trim() ? (
                  <a href={imageLink.trim()} target="_blank" rel="noopener noreferrer">
                    {imagePreview}
                  </a>
                ) : (
                  imagePreview
                )
              ) : null}

              {previewParagraphs ? (
                <div className="space-y-4 text-[15px] leading-relaxed text-[#2F2A25]">
                  {previewParagraphs.map((block, i) => (
                    <p key={i} className="whitespace-pre-wrap">
                      {block}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-center italic text-neutral-400">Ton message apparaîtra ici…</p>
              )}

              <p className="mt-10 text-sm text-[#8B6F47]">L&apos;équipe Jessica Contentin</p>
              <div className="mt-8 flex justify-center">
                <span className="inline-flex rounded-full bg-[#8B6F47] px-6 py-2.5 text-sm font-medium text-white">
                  Ouvrir le site
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </JessicaSuperPage>
  );
}
