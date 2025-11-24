"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, Mail, Phone, Euro, ShoppingBag, FileText, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { JessicaUserListItem } from "@/lib/queries/jessica-users";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type UsersListClientProps = {
  initialUsers: JessicaUserListItem[];
};

export function UsersListClient({ initialUsers }: UsersListClientProps) {
  const [users] = useState<JessicaUserListItem[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.fullName && user.fullName.toLowerCase().includes(query)) ||
      (user.phone && user.phone.includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="relative">
        <Search 
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
          style={{ color: "#2F2A25", opacity: 0.5 }}
        />
        <Input
          type="text"
          placeholder="Rechercher par nom, email ou téléphone..."
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

      {/* Liste */}
      {filteredUsers.length === 0 ? (
        <div 
          className="text-center py-12 rounded-2xl border-2"
          style={{ 
            borderColor: "#E6D9C6",
            backgroundColor: "#FFFFFF",
          }}
        >
          <p style={{ color: "#2F2A25", opacity: 0.7 }}>
            {searchQuery ? "Aucun utilisateur trouvé" : "Aucun utilisateur pour le moment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredUsers.map((user) => (
            <Link
              key={user.id}
              href={`/super/gestion-client/${user.id}`}
              className="block"
            >
              <Card
                className="rounded-2xl border-2 hover:shadow-xl transition-all cursor-pointer"
                style={{
                  borderColor: "#E6D9C6",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                        style={{
                          backgroundColor: "#C6A66420",
                          color: "#C6A664",
                        }}
                      >
                        {user.fullName
                          ? user.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .substring(0, 2)
                          : user.email[0].toUpperCase()}
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-semibold mb-1 truncate"
                          style={{ color: "#2F2A25" }}
                        >
                          {user.fullName || "Utilisateur sans nom"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" style={{ color: "#2F2A25", opacity: 0.5 }} />
                            <span style={{ color: "#2F2A25", opacity: 0.7 }} className="truncate">
                              {user.email}
                            </span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" style={{ color: "#2F2A25", opacity: 0.5 }} />
                              <span style={{ color: "#2F2A25", opacity: 0.7 }}>
                                {user.phone}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" style={{ color: "#2F2A25", opacity: 0.5 }} />
                            <span style={{ color: "#2F2A25", opacity: 0.7 }}>
                              {format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <Euro className="h-4 w-4" style={{ color: "#C6A664" }} />
                          <span
                            className="text-xl font-bold"
                            style={{ color: "#C6A664" }}
                          >
                            {user.totalRevenue.toFixed(2)}€
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "#2F2A25", opacity: 0.6 }}>
                          CA généré
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <ShoppingBag className="h-4 w-4" style={{ color: "#2F2A25", opacity: 0.7 }} />
                          <span
                            className="text-xl font-bold"
                            style={{ color: "#2F2A25" }}
                          >
                            {user.purchaseCount}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "#2F2A25", opacity: 0.6 }}>
                          Achats
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 mb-1">
                          <FileText className="h-4 w-4" style={{ color: "#2F2A25", opacity: 0.7 }} />
                          <span
                            className="text-xl font-bold"
                            style={{ color: "#2F2A25" }}
                          >
                            {user.testCount}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: "#2F2A25", opacity: 0.6 }}>
                          Tests
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

