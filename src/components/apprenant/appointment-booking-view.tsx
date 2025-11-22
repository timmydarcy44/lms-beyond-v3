"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/components/providers/supabase-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isPast, addWeeks, subWeeks, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  slotId?: string;
}

export function AppointmentBookingView({ superAdminId }: { superAdminId: string }) {
  // Utiliser useSupabase si disponible (dans un contexte avec provider), sinon créer un client anonyme
  let contextSupabase: any = null;
  try {
    contextSupabase = useSupabase();
  } catch (e) {
    // Pas de provider, on créera un client anonyme
  }
  
  const [supabase, setSupabase] = useState<any>(contextSupabase);
  const router = useRouter();
  
  // Si pas de provider, créer un client anonyme
  useEffect(() => {
    if (!supabase && typeof window !== 'undefined') {
      const client = createSupabaseBrowserClient();
      if (client) {
        setSupabase(client);
      }
    }
  }, []);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [existingSlots, setExistingSlots] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Formulaire de réservation
  const [bookingForm, setBookingForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    classe: "",
    notes: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!supabase) return;
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", authUser.id)
          .single();
        setUser(profile);
        // Pré-remplir le formulaire si l'utilisateur est connecté
        if (profile?.full_name) {
          const nameParts = profile.full_name.split(" ");
          setBookingForm({
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            email: profile?.email || "",
            classe: "",
            notes: "",
          });
        }
      }
    };
    fetchUser();
  }, [supabase]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [selectedDate, supabase]);

  const fetchAvailableSlots = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Récupérer les dates de début et fin de la semaine (lundi à vendredi)
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      
      const startOfWeekDate = new Date(weekStart);
      startOfWeekDate.setHours(0, 0, 0, 0);
      
      const endOfWeekDate = new Date(weekEnd);
      endOfWeekDate.setHours(23, 59, 59, 999);

      // Récupérer les plages horaires disponibles
      const { data: slotsData } = await supabase
        .from("appointment_slots")
        .select("*")
        .eq("super_admin_id", superAdminId)
        .eq("is_available", true)
        .gte("start_time", startOfWeekDate.toISOString())
        .lte("start_time", endOfWeekDate.toISOString())
        .order("start_time", { ascending: true });

      // Récupérer les rendez-vous déjà pris (y compris ceux sans learner_id pour les réservations anonymes)
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("slot_id, start_time, status, learner_id")
        .eq("super_admin_id", superAdminId)
        .in("status", ["pending", "confirmed"])
        .gte("start_time", startOfWeekDate.toISOString())
        .lte("start_time", endOfWeekDate.toISOString());

      console.log("[booking] Fetched slots:", slotsData?.length || 0, "slots");
      console.log("[booking] Fetched appointments:", appointmentsData?.length || 0, "appointments");
      console.log("[booking] Appointments details:", appointmentsData?.map((apt: any) => ({
        id: apt.id,
        slot_id: apt.slot_id,
        start_time: apt.start_time,
        status: apt.status,
        learner_id: apt.learner_id
      })));
      setExistingSlots(slotsData || []);
      setExistingAppointments(appointmentsData || []);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      toast.error("Erreur lors du chargement des créneaux disponibles");
    } finally {
      setLoading(false);
    }
  };

  // Générer les jours de la semaine (lundi à vendredi uniquement)
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
    });
    // Filtrer pour ne garder que lundi à vendredi (0 = dimanche, 6 = samedi)
    return allDays.filter((day) => {
      const dayOfWeek = getDay(day);
      return dayOfWeek >= 1 && dayOfWeek <= 5; // 1 = lundi, 5 = vendredi
    });
  }, [selectedDate]);

  // Vérifier si des plages horaires existent pour un jour donné
  const hasSlotsForDay = (day: Date): boolean => {
    return existingSlots.some((slot) => {
      const slotDate = new Date(slot.start_time);
      return isSameDay(slotDate, day);
    });
  };

  // Obtenir les créneaux disponibles pour un jour donné
  const getTimeSlotsForDay = (day: Date): TimeSlot[] => {
    // Si aucune plage horaire n'a été ouverte pour ce jour, retourner un tableau vide
    if (!hasSlotsForDay(day)) {
      console.log("[booking] No slots for day:", format(day, "yyyy-MM-dd"));
      return [];
    }

    // Récupérer les slots existants pour ce jour
    const daySlots = existingSlots.filter((slot) => {
      const slotDate = new Date(slot.start_time);
      return isSameDay(slotDate, day);
    });

    console.log("[booking] Day slots for", format(day, "yyyy-MM-dd"), ":", daySlots.length);

    const now = new Date();
    
    // Créer des sets pour les créneaux réservés (par slot_id ET par start_time pour plus de précision)
    const takenSlotIds = new Set(
      existingAppointments
        .filter((apt) => {
          const aptDate = new Date(apt.start_time);
          return isSameDay(aptDate, day) && (apt.status === "pending" || apt.status === "confirmed");
        })
        .map((apt) => apt.slot_id)
        .filter((id): id is string => id !== null)
    );
    
    const takenTimes = new Set(
      existingAppointments
        .filter((apt) => {
          const aptDate = new Date(apt.start_time);
          return isSameDay(aptDate, day) && (apt.status === "pending" || apt.status === "confirmed");
        })
        .map((apt) => {
          const aptTime = new Date(apt.start_time);
          aptTime.setSeconds(0, 0);
          return aptTime.toISOString();
        })
    );

    // Convertir les slots existants en TimeSlot
    const timeSlots = daySlots.map((slot) => {
      const slotStart = new Date(slot.start_time);
      const slotStartNormalized = new Date(slotStart);
      slotStartNormalized.setSeconds(0, 0);
      
      // Vérifier si le créneau est passé
      const isPast = slotStart < now;
      
      // Vérifier si le créneau est réservé (par slot_id OU par start_time)
      const isTakenBySlotId = takenSlotIds.has(slot.id);
      const isTakenByTime = takenTimes.has(slotStartNormalized.toISOString());
      const isTaken = isTakenBySlotId || isTakenByTime;
      
      return {
        start: slotStart,
        end: new Date(slot.end_time),
        available: !isPast && !isTaken,
        slotId: slot.id,
      };
    }).sort((a, b) => a.start.getTime() - b.start.getTime());

    // Filtrer pour ne retourner que les créneaux disponibles
    const availableSlots = timeSlots.filter(s => s.available);
    console.log("[booking] Time slots for", format(day, "yyyy-MM-dd"), ":", timeSlots.length, "total,", availableSlots.length, "available");
    return availableSlots;
  };

  const handleSlotSelect = (slot: TimeSlot, day: Date) => {
    if (!slot.available) return;
    
    // Permettre la réservation sans authentification
    setSelectedSlot(slot);
    setSelectedDay(day);
    setShowBookingDialog(true);
  };

  const handleBooking = async () => {
    if (!supabase || !selectedSlot || !selectedDay) return;

    if (!bookingForm.firstName || !bookingForm.lastName || !bookingForm.email || !bookingForm.classe) {
      toast.error("Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email, Classe)");
      return;
    }

    setIsBooking(true);

    try {
      // Utiliser le slotId du slot sélectionné (qui doit exister car on vérifie hasSlotsForDay)
      const slotId = selectedSlot.slotId;
      
      if (!slotId) {
        throw new Error("Aucun créneau disponible pour cette date");
      }

      // Créer le rendez-vous via l'API route pour bypass RLS
      // (nécessaire pour les réservations anonymes)
      const createResponse = await fetch("/api/appointments/create-anonymous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          super_admin_id: superAdminId,
          slot_id: slotId,
          start_time: selectedSlot.start.toISOString(),
          end_time: selectedSlot.end.toISOString(),
          subject: `${bookingForm.firstName} ${bookingForm.lastName} - ${bookingForm.classe}`,
          learner_notes: bookingForm.notes 
            ? `${bookingForm.notes}\n\nClasse: ${bookingForm.classe}\nEmail: ${bookingForm.email}`
            : `Classe: ${bookingForm.classe}\nEmail: ${bookingForm.email}`,
          notes: `Email: ${bookingForm.email}\nClasse: ${bookingForm.classe}\n\n${bookingForm.notes || ""}`,
          email: bookingForm.email,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error("[booking] Error creating appointment:", errorData);
        throw new Error(errorData.error || "Erreur lors de la création du rendez-vous");
      }

      const { appointment } = await createResponse.json();

      console.log("[booking] ✅ Appointment created successfully:", {
        id: appointment.id,
        slot_id: appointment.slot_id,
        super_admin_id: appointment.super_admin_id,
        learner_id: appointment.learner_id,
        start_time: appointment.start_time,
        status: appointment.status
      });

      // Envoyer une notification par email à contentin.cabinet@gmail.com
      const notifyResponse = await fetch("/api/agenda/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          learnerName: `${bookingForm.firstName} ${bookingForm.lastName}`,
          learnerEmail: bookingForm.email || user?.email || null, // Utiliser l'email du formulaire ou celui de l'utilisateur connecté
          appointmentTime: selectedSlot.start.toISOString(),
          subject: `${bookingForm.firstName} ${bookingForm.lastName} - ${bookingForm.classe}`,
          notes: `Classe: ${bookingForm.classe}`,
        }),
      });

      if (!notifyResponse.ok) {
        console.error("Error sending notification to admin");
      }

      // Rafraîchir la liste des créneaux disponibles après la réservation
      await fetchAvailableSlots();

      // Rediriger vers la page de remerciement
      const firstName = bookingForm.firstName;
      const appointmentDate = format(selectedSlot.start, "d MMMM yyyy", { locale: fr });
      const appointmentTime = formatTime(selectedSlot.start);
      
      router.push(
        `/reservation/merci?firstName=${encodeURIComponent(firstName)}&date=${encodeURIComponent(appointmentDate)}&time=${encodeURIComponent(appointmentTime)}`
      );
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast.error(error.message || "Erreur lors de la réservation");
    } finally {
      setIsBooking(false);
    }
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm", { locale: fr });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-700" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation de la semaine */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}
          className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Semaine précédente
        </Button>
        <h2 className="text-xl font-semibold text-amber-900">
          {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "d MMM", { locale: fr })} -{" "}
          {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "d MMM yyyy", { locale: fr })}
        </h2>
        <Button
          variant="outline"
          onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}
          className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
        >
          Semaine suivante
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Grille du calendrier (lundi à vendredi) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        {weekDays.map((day) => {
          const daySlots = getTimeSlotsForDay(day);
          const isDayPast = isPast(day) && !isToday(day);
          const isDayToday = isToday(day);

          return (
            <Card
              key={day.toISOString()}
              className={cn(
                "border-2",
                isDayToday 
                  ? "border-amber-500 bg-amber-50/50 shadow-lg" 
                  : "border-amber-200 bg-amber-50/30",
                isDayPast && "opacity-60"
              )}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-amber-900">
                  {format(day, "EEEE d MMMM", { locale: fr })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isDayPast ? (
                  <p className="text-sm text-amber-700/60 text-center py-4">Date passée</p>
                ) : !hasSlotsForDay(day) ? (
                  <p className="text-sm text-amber-700/60 text-center py-4">Aucune plage horaire ouverte</p>
                ) : daySlots.length === 0 ? (
                  <p className="text-sm text-amber-700/60 text-center py-4">Aucun créneau disponible</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {daySlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant={slot.available ? "outline" : "ghost"}
                        className={cn(
                          "w-full justify-start text-left h-auto py-2.5 px-3 text-sm",
                          slot.available
                            ? "border-amber-300 bg-white text-amber-900 hover:bg-amber-100 hover:border-amber-400"
                            : "text-amber-600/50 cursor-not-allowed bg-amber-50/50"
                        )}
                        onClick={() => handleSlotSelect(slot, day)}
                        disabled={!slot.available}
                      >
                        <Clock className={cn(
                          "h-3.5 w-3.5 mr-2 shrink-0",
                          slot.available ? "text-amber-700" : "text-amber-400"
                        )} />
                        <span className="font-medium">
                          {formatTime(slot.start)}
                        </span>
                        {!slot.available && (
                          <span className="ml-auto text-xs text-amber-600/70">Indisponible</span>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de réservation */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="bg-amber-50 border-amber-200">
          <DialogHeader>
            <DialogTitle className="text-amber-900">Confirmer votre réservation</DialogTitle>
            <DialogDescription className="text-amber-800">
              Remplissez les informations pour finaliser votre rendez-vous
            </DialogDescription>
          </DialogHeader>
          {selectedSlot && selectedDay && (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-300 bg-amber-100/50 p-4">
                <div className="flex items-center gap-2 text-sm text-amber-900 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatTime(selectedSlot.start)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-amber-900">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={bookingForm.firstName}
                    onChange={(e) => setBookingForm({ ...bookingForm, firstName: e.target.value })}
                    placeholder="Votre prénom"
                    className="mt-1 border-amber-300 bg-white text-amber-900 placeholder:text-amber-400"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-amber-900">Nom *</Label>
                  <Input
                    id="lastName"
                    value={bookingForm.lastName}
                    onChange={(e) => setBookingForm({ ...bookingForm, lastName: e.target.value })}
                    placeholder="Votre nom"
                    className="mt-1 border-amber-300 bg-white text-amber-900 placeholder:text-amber-400"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-amber-900">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={bookingForm.email}
                  onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                  placeholder="votre.email@exemple.com"
                  className="mt-1 border-amber-300 bg-white text-amber-900 placeholder:text-amber-400"
                />
              </div>

              <div>
                <Label htmlFor="classe" className="text-amber-900">Classe *</Label>
                <Select
                  value={bookingForm.classe}
                  onValueChange={(value) => setBookingForm({ ...bookingForm, classe: value })}
                >
                  <SelectTrigger className="mt-1 border-amber-300 bg-white text-amber-900">
                    <SelectValue placeholder="Sélectionnez votre classe" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-amber-200">
                    <SelectItem value="BTS MCO">BTS MCO</SelectItem>
                    <SelectItem value="BTS NDRC">BTS NDRC</SelectItem>
                    <SelectItem value="BTS GPME">BTS GPME</SelectItem>
                    <SelectItem value="BTS Communication">BTS Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="text-amber-900">
                  Voulez-vous me faire part de quelque chose avant notre rendez-vous ?
                </Label>
                <Textarea
                  id="notes"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Vos commentaires ou questions..."
                  rows={4}
                  className="mt-1 border-amber-300 bg-white text-amber-900 placeholder:text-amber-400"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBookingDialog(false);
                setSelectedSlot(null);
                setSelectedDay(null);
                setBookingForm({ ...bookingForm, email: "", classe: "", notes: "" });
              }}
              disabled={isBooking}
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBooking}
              disabled={isBooking}
              className="bg-amber-700 hover:bg-amber-800 text-white"
            >
              {isBooking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réservation en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmer la réservation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
