"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileUp, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  QUALIOPI_CARD,
  QUALIOPI_CARD_INNER,
  QUALIOPI_KICKER,
  QUALIOPI_MUTED,
  QUALIOPI_PAGE_BG,
} from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { handicapSourceLabel } from "@/lib/handicap/labels";
import { cn } from "@/lib/utils";

type Doc = {
  id: string;
  kind: "rqth" | "autre";
  title: string;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
};

type Meeting = {
  id: string;
  sequence_n: number;
  status: "open" | "closed";
  notes: string | null;
  held_at: string | null;
  closed_at: string | null;
};

type Profile = {
  id: string;
  person_name: string;
  person_email: string | null;
  source_kind: string;
  organization_name: string | null;
  specific_needs: string | null;
  accompaniment_plan: string | null;
  needs_summary: string | null;
};

export function QualiopiHandicapGestion({ profileId }: { profileId: string }) {
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [specificNeeds, setSpecificNeeds] = useState("");
  const [plan, setPlan] = useState("");
  const [meetingNotes, setMeetingNotes] = useState<Record<string, string>>({});
  const [rqthTitle, setRqthTitle] = useState("Justificatif RQTH");
  const [autreTitle, setAutreTitle] = useState("");
  const [rqthFile, setRqthFile] = useState<File | null>(null);
  const [autreFile, setAutreFile] = useState<File | null>(null);

  const applyBundle = useCallback((json: {
    profile?: Profile;
    documents?: Doc[];
    meetings?: Meeting[];
  }) => {
    if (json.profile) {
      setProfile(json.profile);
      setSpecificNeeds(json.profile.specific_needs ?? "");
      setPlan(json.profile.accompaniment_plan ?? "");
    }
    setDocuments(json.documents ?? []);
    const ms = json.meetings ?? [];
    setMeetings(ms);
    const notes: Record<string, string> = {};
    for (const m of ms) notes[m.id] = m.notes ?? "";
    setMeetingNotes(notes);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/handicap/${profileId}/gestion`);
      const json = await res.json();
      if (res.status === 403) {
        setLocked(true);
        return;
      }
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      applyBundle(json);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [profileId, applyBundle]);

  useEffect(() => {
    void load();
  }, [load]);

  const rqthDocs = useMemo(() => documents.filter((d) => d.kind === "rqth"), [documents]);
  const otherDocs = useMemo(() => documents.filter((d) => d.kind === "autre"), [documents]);

  const canOpenMeeting = useCallback(
    (m: Meeting) => {
      if (m.sequence_n === 1) return true;
      const prev = meetings.find((x) => x.sequence_n === m.sequence_n - 1);
      return prev?.status === "closed";
    },
    [meetings],
  );

  async function patch(action: string, payload: Record<string, unknown> = {}) {
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/handicap/${profileId}/gestion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      applyBundle(json);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function upload(kind: "rqth" | "autre", title: string, file: File | null) {
    if (!file) {
      toast.error("Choisissez un fichier");
      return;
    }
    if (!title.trim()) {
      toast.error("Titre requis");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("kind", kind);
      fd.set("title", title.trim());
      fd.set("file", file);
      const res = await fetch(`/api/super-admin/crm/qualiopi/handicap/${profileId}/gestion`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload impossible");
      toast.success("Document ajouté");
      if (kind === "rqth") setRqthFile(null);
      else {
        setAutreFile(null);
        setAutreTitle("");
      }
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (locked) {
    return (
      <div className={cn(QUALIOPI_PAGE_BG, "px-6 py-10")}>
        <div className={cn(QUALIOPI_CARD, "mx-auto max-w-xl p-10 text-center")}>
          <Lock className="mx-auto h-10 w-10 text-white/40" />
          <h1 className="mt-4 text-2xl font-semibold">Accès restreint</h1>
        </div>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className={cn(QUALIOPI_PAGE_BG, "px-6 py-10")}>
        <p className={QUALIOPI_MUTED}>{loading ? "Chargement…" : "Profil introuvable"}</p>
      </div>
    );
  }

  return (
    <div className={cn(QUALIOPI_PAGE_BG, "px-6 py-8")}>
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          href={`/super/crm/qualiopi/handicap/${profileId}`}
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour fiche {profile.person_name}
        </Link>

        <header>
          <p className={QUALIOPI_KICKER}>Gestion handicap</p>
          <h1 className="mt-1 text-3xl font-semibold text-white">{profile.person_name}</h1>
          <p className={cn(QUALIOPI_MUTED, "text-sm")}>
            {handicapSourceLabel(profile.source_kind)}
            {profile.organization_name ? ` · ${profile.organization_name}` : ""}
          </p>
        </header>

        {/* RQTH */}
        <section className={cn(QUALIOPI_CARD, "space-y-3 p-5")}>
          <h2 className="text-lg font-semibold text-white">RQTH</h2>
          <p className={cn(QUALIOPI_MUTED, "text-sm")}>Upload du justificatif RQTH.</p>
          <ul className="space-y-2">
            {rqthDocs.length === 0 ? (
              <li className={cn(QUALIOPI_MUTED, "text-sm")}>Aucun document RQTH.</li>
            ) : (
              rqthDocs.map((d) => (
                <li
                  key={d.id}
                  className={cn(QUALIOPI_CARD_INNER, "flex items-center justify-between gap-3 px-3 py-2")}
                >
                  <a
                    href={d.file_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm text-[#6BE3C0] hover:underline"
                  >
                    {d.title}
                    {d.file_name ? ` · ${d.file_name}` : ""}
                  </a>
                  <button
                    type="button"
                    className="text-white/40 hover:text-red-300"
                    onClick={() => void patch("delete_document", { document_id: d.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="flex flex-wrap items-end gap-2">
            <Input
              value={rqthTitle}
              onChange={(e) => setRqthTitle(e.target.value)}
              className="max-w-xs border-white/10 bg-black/20 text-white"
            />
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setRqthFile(e.target.files?.[0] ?? null)}
              className="max-w-xs border-white/10 bg-black/20 text-white file:text-white"
            />
            <Button
              type="button"
              disabled={saving}
              className="bg-[#6C5CF5] text-white"
              onClick={() => void upload("rqth", rqthTitle, rqthFile)}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Déposer
            </Button>
          </div>
        </section>

        {/* Autres */}
        <section className={cn(QUALIOPI_CARD, "space-y-3 p-5")}>
          <h2 className="text-lg font-semibold text-white">Autres documents</h2>
          <ul className="space-y-2">
            {otherDocs.length === 0 ? (
              <li className={cn(QUALIOPI_MUTED, "text-sm")}>Aucun autre document.</li>
            ) : (
              otherDocs.map((d) => (
                <li
                  key={d.id}
                  className={cn(QUALIOPI_CARD_INNER, "flex items-center justify-between gap-3 px-3 py-2")}
                >
                  <a
                    href={d.file_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm text-[#6BE3C0] hover:underline"
                  >
                    {d.title}
                    {d.file_name ? ` · ${d.file_name}` : ""}
                  </a>
                  <button
                    type="button"
                    className="text-white/40 hover:text-red-300"
                    onClick={() => void patch("delete_document", { document_id: d.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="flex flex-wrap items-end gap-2">
            <Input
              value={autreTitle}
              onChange={(e) => setAutreTitle(e.target.value)}
              placeholder="Titre du document"
              className="max-w-xs border-white/10 bg-black/20 text-white"
            />
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setAutreFile(e.target.files?.[0] ?? null)}
              className="max-w-xs border-white/10 bg-black/20 text-white file:text-white"
            />
            <Button
              type="button"
              disabled={saving}
              className="bg-white/10 text-white"
              onClick={() => void upload("autre", autreTitle, autreFile)}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Déposer
            </Button>
          </div>
        </section>

        {/* Besoins */}
        <section className={cn(QUALIOPI_CARD, "space-y-3 p-5")}>
          <h2 className="text-lg font-semibold text-white">Besoins spécifiques</h2>
          <textarea
            value={specificNeeds}
            onChange={(e) => setSpecificNeeds(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            placeholder="Aménagements, contraintes, points de vigilance…"
          />
          <Button
            type="button"
            disabled={saving}
            className="bg-[#6C5CF5] text-white"
            onClick={async () => {
              const ok = await patch("save_fields", { specific_needs: specificNeeds });
              if (ok) toast.success("Besoins enregistrés");
            }}
          >
            Enregistrer les besoins
          </Button>
        </section>

        {/* Plan */}
        <section className={cn(QUALIOPI_CARD, "space-y-3 p-5")}>
          <h2 className="text-lg font-semibold text-white">Plan d&apos;accompagnement personnalisé</h2>
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            placeholder="Objectifs, moyens, partenaires mobilisés, échéances…"
          />
          <Button
            type="button"
            disabled={saving}
            className="bg-[#6C5CF5] text-white"
            onClick={async () => {
              const ok = await patch("save_fields", { accompaniment_plan: plan });
              if (ok) toast.success("Plan enregistré");
            }}
          >
            Enregistrer le plan
          </Button>
        </section>

        {/* RDV */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Rendez-vous</h2>
          {meetings.map((m) => {
            const openable = canOpenMeeting(m);
            const lockedRdv = !openable;
            return (
              <div
                key={m.id}
                className={cn(
                  QUALIOPI_CARD,
                  "space-y-3 p-5",
                  lockedRdv && "opacity-50",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-white">
                    Rendez-vous {m.sequence_n}
                    {m.status === "closed" ? (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-[#6BE3C0]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Clos
                      </span>
                    ) : lockedRdv ? (
                      <span className="ml-2 text-xs font-bold text-white/40">
                        Verrouillé — clôturez le RDV {m.sequence_n - 1}
                      </span>
                    ) : (
                      <span className="ml-2 text-xs font-bold text-amber-300">Ouvert</span>
                    )}
                  </h3>
                </div>
                {lockedRdv ? (
                  <p className={cn(QUALIOPI_MUTED, "text-sm")}>
                    Accessible uniquement après clôture du rendez-vous précédent.
                  </p>
                ) : (
                  <>
                    <textarea
                      value={meetingNotes[m.id] ?? ""}
                      onChange={(e) =>
                        setMeetingNotes((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      disabled={m.status === "closed"}
                      rows={4}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white disabled:opacity-70"
                      placeholder="Prise de notes du rendez-vous…"
                    />
                    {m.status === "open" ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={saving}
                          variant="outline"
                          className="border-white/15 bg-transparent text-white"
                          onClick={async () => {
                            const ok = await patch("save_meeting", {
                              meeting_id: m.id,
                              notes: meetingNotes[m.id] ?? "",
                              held_at: new Date().toISOString(),
                            });
                            if (ok) toast.success("Notes enregistrées");
                          }}
                        >
                          Enregistrer les notes
                        </Button>
                        <Button
                          type="button"
                          disabled={saving}
                          className="bg-[#6BE3C0] text-[#0b0e18] hover:bg-[#5ad4b0]"
                          onClick={async () => {
                            // persist notes then close
                            await patch("save_meeting", {
                              meeting_id: m.id,
                              notes: meetingNotes[m.id] ?? "",
                              held_at: new Date().toISOString(),
                            });
                            const ok = await patch("close_meeting", { meeting_id: m.id });
                            if (ok) toast.success(`RDV ${m.sequence_n} clos — RDV ${m.sequence_n + 1} ouvert`);
                          }}
                        >
                          Clôturer le rendez-vous {m.sequence_n}
                        </Button>
                      </div>
                    ) : m.closed_at ? (
                      <p className={cn(QUALIOPI_MUTED, "text-xs")}>
                        Clos le {new Date(m.closed_at).toLocaleString("fr-FR")}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
