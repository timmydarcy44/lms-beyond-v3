"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { usePraticien } from "@/components/praticien/praticien-context";
import { Card, PageWrap } from "@/components/praticien/praticien-ui";
import { BCT_DUREES, BCT_SPECIALITES } from "@/lib/marketplace/praticien-constants";
import { createClient } from "@/lib/supabase/client";
import { formatEurosFromCents } from "@/lib/marketplace/commission";

export function PraticienProfilPage() {
  const { praticien, refresh } = usePraticien();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState({
    photo_url: "",
    titre: "",
    biographie: "",
    specialites: [] as string[],
    tarif_euros: 80,
    duree_session: 60,
  });

  useEffect(() => {
    if (!praticien) return;
    setForm({
      photo_url: praticien.photo_url ?? "",
      titre: praticien.titre ?? "",
      biographie: praticien.biographie ?? "",
      specialites: praticien.specialites ?? [],
      tarif_euros: (praticien.tarif_session ?? 8000) / 100,
      duree_session: praticien.duree_session ?? 60,
    });
  }, [praticien]);

  const uploadPhoto = async (file: File) => {
    if (!praticien) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `praticiens/${praticien.id}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setForm((p) => ({ ...p, photo_url: data.publicUrl }));
      toast.success("Photo téléversée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/marketplace/praticien/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_url: form.photo_url || null,
          titre: form.titre,
          biographie: form.biographie,
          specialites: form.specialites,
          tarif_session: Math.round(form.tarif_euros * 100),
          duree_session: form.duree_session,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Sauvegarde impossible");
      toast.success("Profil mis à jour");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const toggleSpec = (s: string) => {
    setForm((p) => ({
      ...p,
      specialites: p.specialites.includes(s) ? p.specialites.filter((x) => x !== s) : [...p.specialites, s],
    }));
  };

  if (!praticien) return null;

  return (
    <PageWrap title="Mon profil" subtitle="Visible par les collaborateurs sur le marketplace">
      <Card className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {form.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photo_url} alt="" className="h-24 w-24 rounded-xl object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-violet-600/30 text-2xl font-bold">
              {praticien.prenom.charAt(0)}
              {praticien.nom.charAt(0)}
            </div>
          )}
          <div>
            <Label>Photo de profil</Label>
            <Input
              type="file"
              accept="image/*"
              className="mt-1 max-w-xs border-white/15 bg-slate-900"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadPhoto(f);
              }}
            />
            {uploading && <p className="mt-1 text-xs text-slate-400">Téléversement…</p>}
          </div>
        </div>

        <p className="text-sm text-slate-400">
          {praticien.prenom} {praticien.nom} — modifiable via votre compte Beyond si besoin.
        </p>

        <div>
          <Label>Titre professionnel</Label>
          <Input
            value={form.titre}
            onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
            className="mt-1 border-white/15 bg-slate-900"
          />
        </div>

        <div>
          <Label>Biographie</Label>
          <Textarea
            rows={5}
            value={form.biographie}
            onChange={(e) => setForm((p) => ({ ...p, biographie: e.target.value }))}
            className="mt-1 border-white/15 bg-slate-900"
            placeholder="Présentez votre approche et votre expérience…"
          />
        </div>

        <div>
          <Label>Spécialités</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {BCT_SPECIALITES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpec(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  form.specialites.includes(s) ? "bg-violet-600 text-white" : "bg-white/10 text-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Tarif session — {formatEurosFromCents(Math.round(form.tarif_euros * 100))}</Label>
          <Slider
            className="mt-4"
            min={60}
            max={120}
            step={5}
            value={[form.tarif_euros]}
            onValueChange={([v]) => setForm((p) => ({ ...p, tarif_euros: v }))}
          />
        </div>

        <div>
          <Label>Durée de session</Label>
          <div className="mt-2 flex gap-2">
            {BCT_DUREES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm((p) => ({ ...p, duree_session: d }))}
                className={`rounded-lg px-4 py-2 text-sm ${form.duree_session === d ? "bg-violet-600" : "bg-white/10"}`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" variant="outline" className="border-white/20" onClick={() => setPreviewOpen(true)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Aperçu profil public
          </Button>
          <Button type="button" className="bg-violet-600" disabled={saving} onClick={() => void save()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Sauvegarder
          </Button>
        </div>
      </Card>

      {previewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewOpen(false)}>
          <Card className="max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">
              {praticien.prenom} {praticien.nom}
            </h3>
            <p className="text-sm text-violet-300">{form.titre || "Psychopédagogue BCT"}</p>
            {form.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photo_url} alt="" className="mt-4 h-32 w-full rounded-xl object-cover" />
            )}
            <p className="mt-4 text-sm text-slate-300 whitespace-pre-wrap">{form.biographie || "—"}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {form.specialites.map((s) => (
                <span key={s} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-4 font-semibold">{formatEurosFromCents(Math.round(form.tarif_euros * 100))} · {form.duree_session} min</p>
            <Button type="button" className="mt-4 w-full" variant="outline" asChild>
              <Link href={`/dashboard/entreprise/marketplace/${praticien.id}`} target="_blank">
                Ouvrir la fiche marketplace
              </Link>
            </Button>
            <Button type="button" className="mt-2 w-full" variant="ghost" onClick={() => setPreviewOpen(false)}>
              Fermer
            </Button>
          </Card>
        </div>
      )}
    </PageWrap>
  );
}
