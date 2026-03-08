"use client";

import { useMemo, useRef, useState } from "react";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NewsItem = {
  id: number;
  titre: string;
  date: string;
  statut: "Publié" | "Brouillon";
  image: string | null;
  extrait: string;
  contenu?: string;
};

const initialNews: NewsItem[] = [
  {
    id: 1,
    titre: "Victoire 3-0 contre FC Lisieux",
    date: "2 Mars 2026",
    statut: "Publié",
    image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&q=80",
    extrait: "Une belle victoire à domicile qui nous maintient dans le top 4...",
  },
  {
    id: 2,
    titre: "Soirée Partenaires — Save the Date",
    date: "28 Fév 2026",
    statut: "Publié",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    extrait: "Rendez-vous le 15 Avril pour notre soirée annuelle des partenaires...",
  },
  {
    id: 3,
    titre: "Nouveau partenaire : BNP Paribas",
    date: "15 Jan 2026",
    statut: "Publié",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    extrait: "Nous sommes fiers d'annoncer notre partenariat avec BNP Paribas...",
  },
  {
    id: 4,
    titre: "Présentation saison 2026-2027",
    date: "10 Jan 2026",
    statut: "Brouillon",
    image: null,
    extrait: "En cours de rédaction...",
  },
];

export default function ClubNewsPage() {
  const status = useClubGuard();
  const [news, setNews] = useState<NewsItem[]>(initialNews);
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

  const handleSave = () => {
    const content = editorRef.current?.innerHTML || form.contenu;
    if (editingNews) {
      setNews((prev) =>
        prev.map((item) =>
          item.id === editingNews.id
            ? {
                ...item,
                titre: form.titre,
                image: form.image || null,
                statut: form.statut,
                extrait: content.replace(/<[^>]+>/g, "").slice(0, 120),
                contenu: content,
              }
            : item
        )
      );
    } else {
      setNews((prev) => [
        {
          id: Date.now(),
          titre: form.titre || "Nouvelle news",
          date: "Aujourd'hui",
          statut: form.statut,
          image: form.image || null,
          extrait: content.replace(/<[^>]+>/g, "").slice(0, 120),
          contenu: content,
        },
        ...prev,
      ]);
    }
    setShowDialog(false);
    resetForm();
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
        <h1 className="text-2xl font-semibold text-white">Actualités du club</h1>
        <button
          className="rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--club-primary)" }}
          onClick={() => openDialog()}
        >
          + Publier une news
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {news.map((item) => (
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
                  onClick={() => setNews((prev) => prev.filter((newsItem) => newsItem.id !== item.id))}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
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
