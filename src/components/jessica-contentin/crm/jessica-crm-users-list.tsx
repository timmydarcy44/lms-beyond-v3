"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Mail, Phone, Calendar, Loader2, Clock, ClipboardCheck } from "lucide-react";
import type { JessicaCrmContact } from "@/lib/queries/jessica-crm-contacts";
import type { JessicaResource } from "@/lib/queries/jessica-resources";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type JessicaCrmUsersListProps = {
  initialUsers: JessicaCrmContact[];
  availableResources: JessicaResource[];
};

function formatTrackingDate(value: string | null): string {
  if (!value) return "Jamais connecté";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return format(d, "dd MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}

function formatCreatedAt(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return format(d, "dd MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
}

function getContactInitials(user: JessicaCrmContact): string {
  const first = user.firstName?.[0]?.toUpperCase();
  const last = user.lastName?.[0]?.toUpperCase();
  if (first || last) return `${first ?? ""}${last ?? ""}`;
  const emailChar = user.email?.[0]?.toUpperCase();
  return emailChar ?? "?";
}

export function JessicaCrmUsersList({ initialUsers, availableResources }: JessicaCrmUsersListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const full = formatClientName(user.firstName, user.lastName, "").toLowerCase();
    const email = (user.email ?? "").toLowerCase();
    return (
      email.includes(query) ||
      full.includes(query) ||
      (user.phone && user.phone.includes(query))
    );
  });

  const handleAssign = async (userId: string, catalogItemId: string) => {
    if (!catalogItemId) return;
    setAssigningUserId(userId);
    try {
      const res = await fetch("/api/admin/assign-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, catalogItemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'assignation");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                purchaseCount: u.purchaseCount + (u.assignedCatalogItemIds.includes(catalogItemId) ? 0 : 1),
                assignedCatalogItemIds: u.assignedCatalogItemIds.includes(catalogItemId)
                  ? u.assignedCatalogItemIds
                  : [...u.assignedCatalogItemIds, catalogItemId],
              }
            : u,
        ),
      );

      toast.success(
        data.emailSent
          ? "Formation assignée — visible dans Mon compte. Email envoyé."
          : "Formation assignée — visible dans Mon compte.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'assignation");
    } finally {
      setAssigningUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom, email ou téléphone…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={jessicaSuper.inputRounded}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className={cn(jessicaSuper.card, "py-12 text-center text-neutral-500")}>
          {searchQuery ? "Aucun client trouvé" : "Aucun client pour le moment — ajoutez-en un."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredUsers.map((user) => {
            const assigned = new Set(user.assignedCatalogItemIds);
            const toAssign = availableResources.filter((r) => !assigned.has(r.id));
            const displayName = formatClientName(user.firstName, user.lastName);

            return (
              <div key={user.id} className={cn(jessicaSuper.cardHover, "p-6")}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <Link href={`/super/jessica-crm/${user.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <div className={jessicaSuper.avatar}>
                      {getContactInitials(user)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-black">{displayName}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                        <span className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email || "Email non renseigné"}
                        </span>
                        {user.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {user.phone}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Inscrit le {formatCreatedAt(user.createdAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTrackingDate(user.lastSignInAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          {user.testCount} quiz / test{user.testCount > 1 ? "s" : ""}
                        </span>
                        {(user.cabinetRevenue > 0 || user.lmsRevenue > 0) && (
                          <span className="font-medium text-indigo-700">
                            CA {user.totalRevenue.toFixed(0)}€
                            {user.cabinetRevenue > 0 && user.lmsRevenue > 0
                              ? ` (cabinet ${user.cabinetRevenue.toFixed(0)}€ + LMS ${user.lmsRevenue.toFixed(0)}€)`
                              : user.cabinetRevenue > 0
                                ? ` (cabinet)`
                                : ` (LMS)`}
                          </span>
                        )}
                        {user.pastAppointmentsCount > 0 && (
                          <span className="text-neutral-400">{user.pastAppointmentsCount} RDV passés</span>
                        )}
                      </div>
                    </div>
                  </Link>

                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                      {user.contactKind !== "patient" && (
                        <>
                          <label className="text-xs font-medium text-neutral-500">Assigner une formation</label>
                          {assigningUserId === user.id ? (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600">
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                              Assignation…
                            </div>
                          ) : (
                            <select
                              className="min-w-[220px] rounded-full border border-black/[0.08] bg-neutral-50 px-4 py-2.5 text-sm text-black focus:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                              defaultValue=""
                              disabled={availableResources.length === 0 || toAssign.length === 0}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value) void handleAssign(user.id, value);
                                e.target.value = "";
                              }}
                            >
                              <option value="" disabled>
                                {availableResources.length === 0
                                  ? "Aucune formation disponible"
                                  : toAssign.length === 0
                                    ? "Toutes les formations assignées"
                                    : "Choisir une formation…"}
                              </option>
                              {toAssign.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.title}
                                </option>
                              ))}
                            </select>
                          )}
                          <p className="text-[11px] text-neutral-400 sm:max-w-[140px]">
                            {user.purchaseCount} formation{user.purchaseCount > 1 ? "s" : ""} · Mon compte
                          </p>
                        </>
                      )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
