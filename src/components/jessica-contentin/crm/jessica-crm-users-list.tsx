"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Mail, Phone, Calendar, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { JessicaUserListItem } from "@/lib/queries/jessica-users";
import type { JessicaResource } from "@/lib/queries/jessica-resources";
import { formatClientName } from "@/lib/jessica-contentin/parse-client-name";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

type JessicaCrmUsersListProps = {
  initialUsers: JessicaUserListItem[];
  availableResources: JessicaResource[];
};

export function JessicaCrmUsersList({ initialUsers, availableResources }: JessicaCrmUsersListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const full = formatClientName(user.firstName, user.lastName, "").toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
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
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
          style={{ color: "#2F2A25", opacity: 0.5 }}
        />
        <Input
          type="text"
          placeholder="Rechercher par nom, prénom, email ou téléphone…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 py-6 text-base rounded-full border-2"
          style={{
            borderColor: "#E6D9C6",
            backgroundColor: "#FFFFFF",
            color: "#2F2A25",
          }}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div
          className="text-center py-12 rounded-2xl border-2"
          style={{ borderColor: "#E6D9C6", backgroundColor: "#FFFFFF" }}
        >
          <p style={{ color: "#2F2A25", opacity: 0.7 }}>
            {searchQuery ? "Aucun client trouvé" : "Aucun client pour le moment — ajoutez-en un."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((user) => {
            const assigned = new Set(user.assignedCatalogItemIds);
            const toAssign = availableResources.filter((r) => !assigned.has(r.id));
            const displayName = formatClientName(user.firstName, user.lastName);

            return (
              <Card
                key={user.id}
                className="rounded-2xl border-2"
                style={{ borderColor: "#E6D9C6", backgroundColor: "#FFFFFF" }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <Link href={`/super/jessica-crm/${user.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
                        style={{ backgroundColor: "#C6A66420", color: "#C6A664" }}
                      >
                        {(user.firstName?.[0] ?? user.email[0]).toUpperCase()}
                        {user.lastName?.[0]?.toUpperCase() ?? ""}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold truncate" style={{ color: "#2F2A25" }}>
                          {displayName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm mt-1">
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3.5 w-3.5 opacity-50" />
                            {user.email}
                          </span>
                          {user.phone ? (
                            <span className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 opacity-50" />
                              {user.phone}
                            </span>
                          ) : null}
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 opacity-50" />
                            {format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                      <label className="text-xs font-medium" style={{ color: "#2F2A25", opacity: 0.7 }}>
                        Assigner une formation
                      </label>
                      <div className="relative">
                        {assigningUserId === user.id ? (
                          <div className="flex items-center gap-2 px-3 py-2 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#C6A664" }} />
                            Assignation…
                          </div>
                        ) : (
                          <select
                            className="rounded-full border-2 px-4 py-2.5 text-sm min-w-[220px]"
                            style={{ borderColor: "#E6D9C6", backgroundColor: "#F8F5F0", color: "#2F2A25" }}
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
                      </div>
                      <p className="text-[11px] sm:max-w-[140px]" style={{ color: "#2F2A25", opacity: 0.55 }}>
                        {user.purchaseCount} formation{user.purchaseCount > 1 ? "s" : ""} · visible sur Mon compte
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
