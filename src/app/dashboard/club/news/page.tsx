"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getMyClub, getClubNews } from "@/lib/supabase/club-queries";

type NewsItem = {
  id: string | number;
  titre: string;
  date: string;
  statut: "Publié" | "Brouillon";
  image: string | null;
  extrait: string;
  contenu?: string;
};

export default function ClubNewsPage() {
  const status = useClubGuard();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [ctaStyle, setCtaStyle] = useState<"club" | "navy" | "outline">("club");
  const [form, setForm] = useState({
    titre: "",
    image: "",
    statut: "Publié" as "Publié" | "Brouillon",
    contenu: "",
  });
  const editorRef = useRef<HTMLDivElement | null>(null);

  const statusStyles: Record<string, string> = {
    "Publié": "bg-green-500/20 text-green-300",
    "Brouillon": "bg-gray-500/20 text-gray-400",
  };

  const resetForm = () => {
    setForm({ titre: "", image: "", statut: "Publié", contenu: "" });
    setCtaEnabled(false);
    setCtaText("");
    setCtaUrl("");
    setCtaStyle("club");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  const openDialog = (item?: NewsItem) => {
    if (item) {
      setEditingNews(item);
      setForm({
        titre: item.titre,
        image: item.image || "",
        statut: item.statut,
        contenu: item.contenu || item.extrait,
      });
      setCtaEnabled(false);
      setCtaText("");
      setCtaUrl("");
      setCtaStyle("club");
      if (editorRef.current) {
        editorRef.current.innerHTML = item.contenu || item.extrait;
      }
    } else {
      setEditingNews(null);
      resetForm();
    }
    setShowDialog(true);
  };

  useEffect(() => {
    const load = async () => {
      const clubData = await getMyClub();
      if (!clubData) {
        setLoading(false);
        return;
      }
      setClubId(clubData.id);
      const list = await getClubNews(clubData.id);
      const mapped = list.map((item) => ({
        id: item.id,
        titre: item.titre,
        date: item.published_at
          ? new Date(item.published_at).toLocaleDateString("fr-FR")
          : "—",
        statut: item.statut === "published" ? "Publié" : "Brouillon",
        image: item.image || null,
        extrait: item.extrait || "",
        contenu: item.contenu || "",
      }));
      setNews(mapped);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = () => {
    const content = editorRef.current?.innerHTML || form.contenu;
    const payload = {
      titre: form.titre || "Nouvelle news",
      image: form.image || null,
      statut: form.statut === "Publié" ? "published" : "draft",
      extrait: content.replace(/<[^>]+>/g, "").slice(0, 120),
      contenu: content,
      published_at: form.statut === "Publié" ? new Date().toISOString() : null,
    };
    const run = async () => {
      if (!clubId) return;
      const supabase = createSupabaseBrowserClient();
      if (editingNews) {
        const { data } = await supabase
          .from("club_news")
          .update(payload)
          .eq("id", editingNews.id)
          .select()
          .single();
        if (data) {
          setNews((prev) =>
            prev.map((item) =>
              item.id === editingNews.id
                ? {
                    id: data.id,
                    titre: data.titre,
                    date: data.published_at
                      ? new Date(data.published_at).toLocaleDateString("fr-FR")
                      : "—",
                    statut: data.statut === "published" ? "Publié" : "Brouillon",
                    image: data.image || null,
                    extrait: data.extrait || "",
                    contenu: data.contenu || "",
                  }
                : item
            )
          );
        }
      } else {
        const { data } = await supabase
          .from("club_news")
          .insert({ ...payload, club_id: clubId })
          .select()
          .single();
        if (data) {
          setNews((prev) => [
            {
              id: data.id,
              titre: data.titre,
              date: data.published_at
                ? new Date(data.published_at).toLocaleDateString("fr-FR")
                : "—",
              statut: data.statut === "published" ? "Publié" : "Brouillon",
              image: data.image || null,
              extrait: data.extrait || "",
              contenu: data.contenu || "",
            },
            ...prev,
          ]);
        }
      }
      setShowDialog(false);
      resetForm();
      toast.success("News enregistrée ✓");
    };
    run();
  };

  const toolbarActions = useMemo(
    () => [
      { label: "B", cmd: "bold" },
      { label: "I", cmd: "italic" },
      { label: "U", cmd: "underline" },
      { label: "H2", cmd: "formatBlock", value: "h2" },
      { label: "H3", cmd: "formatBlock", value: "h3" },
      { label: "• Liste", cmd: "insertUnorderedList" },
      { label: "Lien", cmd: "createLink", value: "https://" },
      { label: "Citation", cmd: "formatBlock", value: "blockquote" },
    ],
    []
  );

  if (status !== "allowed") {
    return null;
  }

  return (
    <ClubLayout activeItem="News Club">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-white lg:text-2xl">Actualités du club</h1>
        <button
          className="rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--club-primary)" }}
          onClick={() => openDialog()}
        >
          + Publier une news
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="text-white/50">Chargement...</div>
        ) : (
          news.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
              {item.image ? (
                <img src={item.image} alt={item.titre} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 w-full bg-white/5" />
              )}
              <div className="p-4">
                <div className="text-lg font-semibold text-white">{item.titre}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                  <span>{item.date}</span>
                  <span className={cn("rounded-full px-2 py-0.5", statusStyles[item.statut])}>
                    {item.statut}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-white/60">{item.extrait}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white"
                    onClick={() => openDialog(item)}
                  >
                    Modifier
                  </button>
                  <button
                    className="rounded-full bg-white/10 px-4 py-1.5 text-xs text-white"
                    onClick={async () => {
                      const supabase = createSupabaseBrowserClient();
                      await supabase.from("club_news").delete().eq("id", item.id);
                      setNews((prev) => prev.filter((newsItem) => newsItem.id !== item.id));
                      toast.success("News supprimée ✓");
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>{editingNews ? "Modifier une news" : "Créer une news"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <Input
              placeholder="Titre"
              value={form.titre}
              onChange={(event) => setForm({ ...form, titre: event.target.value })}
              className="border-white/10 bg-white/5 text-white"
            />
            <Input
              placeholder="URL Photo"
              value={form.image}
              onChange={(event) => setForm({ ...form, image: event.target.value })}
              className="border-white/10 bg-white/5 text-white"
            />
            <div className="flex flex-wrap gap-2">
              {toolbarActions.map((action) => (
                <button
                  key={action.label}
                  className="rounded-md bg-white/10 px-3 py-1 text-xs text-white"
                  onClick={() => {
                    if (!editorRef.current) return;
                    if (action.cmd === "createLink") {
                      document.execCommand(action.cmd, false, action.value);
                    } else if (action.cmd === "formatBlock") {
                      document.execCommand(action.cmd, false, action.value);
                    } else {
                      document.execCommand(action.cmd);
                    }
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[200px] rounded-xl border border-white/10 bg-white/5 p-4 text-white"
              onInput={(event) => setForm({ ...form, contenu: (event.target as HTMLDivElement).innerHTML })}
            />
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-xs text-white/60">Call to Action (optionnel)</div>
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={ctaEnabled}
                  onChange={(event) => setCtaEnabled(event.target.checked)}
                />
                Ajouter un bouton CTA
              </label>
              {ctaEnabled && (
                <div className="mt-4 space-y-3">
                  <Input
                    placeholder="Texte du bouton"
                    value={ctaText}
                    onChange={(event) => setCtaText(event.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                  <Input
                    placeholder="URL de destination"
                    value={ctaUrl}
                    onChange={(event) => setCtaUrl(event.target.value)}
                    className="border-white/10 bg-white/5 text-white"
                  />
                  <div className="space-y-2 text-sm text-white/80">
                    <div>Style du bouton</div>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={ctaStyle === "club"}
                        onChange={() => setCtaStyle("club")}
                      />
                      Rouge club
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={ctaStyle === "navy"}
                        onChange={() => setCtaStyle("navy")}
                      />
                      Bleu marine
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={ctaStyle === "outline"}
                        onChange={() => setCtaStyle("outline")}
                      />
                      Contour blanc
                    </label>
                  </div>
                  <div>
                    <button
                      className={`rounded-full px-4 py-2 text-sm ${
                        ctaStyle === "club"
                          ? "bg-[#C8102E] text-white"
                          : ctaStyle === "navy"
                            ? "bg-[#1B2A4A] text-white"
                            : "border border-white text-white"
                      }`}
                    >
                      {ctaText || "Voir le match"}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-4 text-sm text-white/70">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.statut === "Publié"}
                  onChange={() => setForm({ ...form, statut: "Publié" })}
                />
                Publier maintenant
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={form.statut === "Brouillon"}
                  onChange={() => setForm({ ...form, statut: "Brouillon" })}
                />
                Brouillon
              </label>
            </div>
          </div>
          <DialogFooter className="sticky bottom-0 mt-4 border-t border-white/10 bg-[#111] py-3">
            <button className="rounded-full bg-white/10 px-4 py-2 text-sm" onClick={() => setShowDialog(false)}>
              Annuler
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm text-white"
              style={{ backgroundColor: "var(--club-primary)" }}
              onClick={handleSave}
            >
              Sauvegarder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClubLayout>
  );
}
