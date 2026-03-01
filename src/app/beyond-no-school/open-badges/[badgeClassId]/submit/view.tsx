"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuthContext = {
  userId: string;
  orgId: string;
  role: string;
} | null;

type EvidenceItem = {
  type: "URL" | "TEXT";
  url?: string | null;
  title?: string | null;
  description?: string | null;
  createdAt: string;
};

type CurrentAssessment = {
  assessmentId: string;
  status: "NEEDS_INFO" | "SUBMITTED" | "APPROVED" | "REJECTED" | "DRAFT";
  note?: string | null;
  evidences: EvidenceItem[];
};

export default function OpenBadgeSubmitView({
  auth,
  badgeClassId,
}: {
  auth: AuthContext;
  badgeClassId: string;
}) {
  const [current, setCurrent] = useState<CurrentAssessment | null>(null);
  const [type, setType] = useState<"URL" | "TEXT">("URL");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!auth) return;
      const res = await fetch(`/api/earner/badges/${badgeClassId}/current`, {
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
          "x-user-role": auth.role,
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      setCurrent(json.item ?? null);
    };
    load();
  }, [auth, badgeClassId]);

  const submitEvidence = async () => {
    if (!auth) return;
    if (type === "URL" && url.trim().length === 0) {
      toast.error("Lien requis.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/earner/badges/${badgeClassId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": auth.userId,
        "x-org-id": auth.orgId,
        "x-user-role": auth.role,
      },
      body: JSON.stringify({
        evidence: [
          {
            type,
            url: type === "URL" ? url : null,
            title: title.length > 0 ? title : null,
            description: description.length > 0 ? description : null,
          },
        ],
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      toast.error(json?.error ?? "Erreur lors de l’envoi.");
      return;
    }
    toast.success("Preuve ajoutée.");
    window.location.href = "/beyond-no-school/open-badges/my";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Open Badges</p>
        <h1 className="text-pretty text-3xl font-semibold sm:text-4xl">Soumettre une preuve</h1>
        <p className="text-sm text-white/70">
          Ajoutez un lien ou un texte pour compléter votre demande.
        </p>
      </div>

      {!auth ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/60">
          Connexion requise.
        </div>
      ) : null}

      {auth && current?.status === "NEEDS_INFO" ? (
        <div className="rounded-3xl border border-amber-200/30 bg-amber-500/10 p-6 text-sm text-amber-100">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-400/20 text-amber-100">Informations demandées</Badge>
          </div>
          <p className="mt-3 text-sm text-amber-100/90">{current.note ?? "Merci de compléter votre preuve."}</p>
        </div>
      ) : null}

      {auth && current?.status === "NEEDS_INFO" && current?.evidences?.length ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-sm text-white/80">Vos preuves déjà envoyées</p>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            {current.evidences.map((evidence, index) => (
              <div
                key={`${evidence.type}-${index}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{evidence.type}</span>
                  <span>{new Date(evidence.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 text-sm font-medium text-white">
                  {evidence.title ?? "Preuve"}
                </div>
                {evidence.description ? (
                  <div className="text-xs text-white/60">{evidence.description}</div>
                ) : null}
                {evidence.url ? (
                  <a
                    href={evidence.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs text-blue-200 underline"
                  >
                    {evidence.url}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {auth ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-sm text-white/80">Ajouter une preuve complémentaire</p>
          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-xs text-white/60">Type</p>
              <Select value={type} onValueChange={(value) => setType(value as "URL" | "TEXT")}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URL">Lien</SelectItem>
                  <SelectItem value="TEXT">Texte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-white/60">Titre</p>
              <Input
                className="mt-2"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex: Étude de cas"
              />
            </div>
            {type === "URL" ? (
              <div>
                <p className="text-xs text-white/60">Lien</p>
                <Input
                  className="mt-2"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://"
                />
              </div>
            ) : null}
            <div>
              <p className="text-xs text-white/60">Description</p>
              <Textarea
                className="mt-2"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Contexte, objectifs, livrable attendu..."
              />
            </div>
          </div>
          <div className="mt-6">
            <Button
              className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90"
              onClick={submitEvidence}
              disabled={loading}
            >
              Envoyer
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
