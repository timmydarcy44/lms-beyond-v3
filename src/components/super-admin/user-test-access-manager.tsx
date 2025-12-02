"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Gift, Search, User, Mail, Calendar } from "lucide-react";
import { toast } from "sonner";
import { GrantUserAccessModal } from "./grant-user-access-modal";

type UserAccess = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  catalog_item_id: string;
  catalog_item_title: string;
  access_status: "purchased" | "manually_granted" | "free";
  granted_by: string | null;
  granted_at: string | null;
  grant_reason: string | null;
};

export function UserTestAccessManager() {
  const [accesses, setAccesses] = useState<UserAccess[]>([]);
  const [filteredAccesses, setFilteredAccesses] = useState<UserAccess[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccesses();
  }, []);

  const loadAccesses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/super-admin/catalogue/user-access");
      const data = await response.json();
      if (data.accesses) {
        setAccesses(data.accesses);
        setFilteredAccesses(data.accesses);
      }
    } catch (error) {
      console.error("[user-test-access] Error:", error);
      toast.error("Erreur lors du chargement des accès");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAccesses(accesses);
      return;
    }

    const filtered = accesses.filter(
      (access) =>
        access.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (access.user_name && access.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        access.catalog_item_title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAccesses(filtered);
  }, [searchTerm, accesses]);

  const statusLabels = {
    purchased: "Acheté",
    manually_granted: "Accès manuel",
    free: "Gratuit",
  };

  const statusColors = {
    purchased: "bg-blue-100 text-blue-700",
    manually_granted: "bg-green-100 text-green-700",
    free: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <Card className="border-black bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Accès utilisateurs au Test de Confiance en soi
            </CardTitle>
            <Button
              onClick={() => setShowGrantModal(true)}
              className="rounded-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white"
            >
              <Gift className="mr-2 h-4 w-4" />
              Accorder un accès gratuit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par email, nom ou contenu..."
              className="pl-10 bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des accès */}
      {loading ? (
        <div className="text-center py-8 text-gray-600">Chargement...</div>
      ) : filteredAccesses.length === 0 ? (
        <Card className="border-black bg-white">
          <CardContent className="py-12 text-center text-gray-600">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Aucun accès trouvé.</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm ? "Essayez une autre recherche." : "Accordez des accès gratuits aux utilisateurs ci-dessus."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAccesses.map((access) => (
            <Card key={access.id} className="border-black bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {access.user_name || "Utilisateur"}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {access.user_email}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Test:</span> {access.catalog_item_title}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={`${statusColors[access.access_status]} border-black`}>
                        {statusLabels[access.access_status]}
                      </Badge>
                      {access.granted_at && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Accordé le {new Date(access.granted_at).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {access.grant_reason && (
                        <span className="text-xs text-gray-500">
                          • {access.grant_reason}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal pour accorder un accès */}
      {showGrantModal && (
        <GrantUserAccessModal
          open={showGrantModal}
          onOpenChange={setShowGrantModal}
          onGranted={() => {
            loadAccesses();
            toast.success("Accès accordé avec succès");
          }}
        />
      )}
    </div>
  );
}

