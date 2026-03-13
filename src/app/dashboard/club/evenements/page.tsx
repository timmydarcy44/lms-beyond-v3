"use client";

import { useEffect, useMemo, useState } from "react";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ClubEvent = {
  id: string;
  titre: string;
  objectifs: string;
  lieu?: string | null;
  date_event?: string | null;
  description?: string | null;
};

export default function ClubEventsPage() {
  const status = useClubGuard();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [formEvent, setFormEvent] = useState({
    titre: "",
    objectifs: "",
    lieu: "",
    date_event: "",
    description: "",
  });

  useEffect(() => {
    const load = async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data: userResult } = await supabase.auth.getUser();
      const user = userResult?.user;
      if (!user) return;
      const { data: club } = await supabase.from("clubs").select("id").eq("user_id", user.id).single();
      if (!club) return;
      setClubId(club.id);
      const { data: clubEvents } = await supabase
        .from("club_events")
        .select("*")
        .eq("club_id", club.id)
        .order("date_event", { ascending: true });
      setEvents((clubEvents as ClubEvent[]) || []);
    };
    load();
  }, []);

  const handleCreateEvent = async () => {
    if (!clubId || !formEvent.titre.trim() || !formEvent.objectifs.trim()) return;
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("club_events").insert({
      club_id: clubId,
      titre: formEvent.titre,
      objectifs: formEvent.objectifs,
      lieu: formEvent.lieu || null,
      date_event: formEvent.date_event || null,
      description: formEvent.description || null,
    });
    const { data: clubEvents } = await supabase
      .from("club_events")
      .select("*")
      .eq("club_id", clubId)
      .order("date_event", { ascending: true });
    setEvents((clubEvents as ClubEvent[]) || []);
    setShowAddEvent(false);
    setFormEvent({ titre: "", objectifs: "", lieu: "", date_event: "", description: "" });
  };

  const getStatus = (dateValue?: string | null) => {
    if (!dateValue) return "À venir";
    const date = new Date(dateValue);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "En cours";
    return date > now ? "À venir" : "Passé";
  };

  const formattedEvents = useMemo(() => {
    return events.map((event) => ({
      ...event,
      status: getStatus(event.date_event),
      dateLabel: event.date_event ? new Date(event.date_event).toLocaleString("fr-FR") : "Date à confirmer",
    }));
  }, [events]);

  if (status !== "allowed") {
    return null;
  }

  return (
    <ClubLayout activeItem="Événements">
      <div className="p-4 lg:p-8 pt-6 lg:pt-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white lg:text-3xl">Événements</h1>
            <p className="mt-1 text-sm text-white/40">Pilotez les événements partenaires et club.</p>
          </div>
          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-2 rounded-xl bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#a50d26]"
          >
            + Ajouter un événement
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {formattedEvents.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#111] p-6 text-sm text-white/60">
              Aucun événement enregistré pour le moment.
            </div>
          ) : (
            formattedEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-[#111] p-5">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs ${
                    event.status === "À venir"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : event.status === "En cours"
                        ? "bg-blue-500/20 text-blue-200"
                        : "bg-white/10 text-white/50"
                  }`}
                >
                  {event.status}
                </span>
                <div className="mt-3 text-lg font-semibold text-white">{event.titre}</div>
                <div className="mt-1 text-xs text-white/50">{event.lieu || "Lieu à confirmer"}</div>
                <div className="mt-1 text-xs text-white/50">{event.dateLabel}</div>
                <p className="mt-3 line-clamp-2 text-sm text-white/70">{event.description || event.objectifs}</p>
                <button className="mt-4 rounded-full bg-white/10 px-4 py-2 text-xs text-white">
                  Voir / Modifier
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="max-w-xl bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>Créer un événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Ex: Soirée partenaires 2026"
              value={formEvent.titre}
              onChange={(event) => setFormEvent((prev) => ({ ...prev, titre: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
            <Textarea
              placeholder="Ex: Fidéliser les partenaires, présenter le bilan de saison, signer de nouveaux contrats"
              rows={3}
              value={formEvent.objectifs}
              onChange={(event) => setFormEvent((prev) => ({ ...prev, objectifs: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
            <Input
              placeholder="Ex: Restaurant Le Normandie, Cabourg"
              value={formEvent.lieu}
              onChange={(event) => setFormEvent((prev) => ({ ...prev, lieu: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
            <Input
              type="datetime-local"
              value={formEvent.date_event}
              onChange={(event) => setFormEvent((prev) => ({ ...prev, date_event: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
            <Textarea
              placeholder="Décrivez le déroulé de l'événement..."
              rows={4}
              value={formEvent.description}
              onChange={(event) => setFormEvent((prev) => ({ ...prev, description: event.target.value }))}
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
          <DialogFooter>
            <button
              className="rounded-full bg-white/10 px-4 py-2 text-sm"
              onClick={() => setShowAddEvent(false)}
            >
              Annuler
            </button>
            <button
              className="rounded-full px-4 py-2 text-sm text-white"
              style={{ backgroundColor: "var(--club-primary)" }}
              onClick={handleCreateEvent}
            >
              Créer l'événement
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClubLayout>
  );
}
