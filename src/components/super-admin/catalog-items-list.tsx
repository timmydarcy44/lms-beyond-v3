"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Star } from "lucide-react";
import { getCatalogItemsForSuperAdmin } from "@/lib/queries/super-admin-catalogue";

type CatalogItem = {
  id: string;
  item_type: "module" | "parcours" | "ressource" | "test";
  title: string;
  price: number;
  is_free: boolean;
  is_active: boolean;
  is_featured: boolean;
  category: string | null;
  target_audience: "pro" | "apprenant" | "all";
  created_at: string;
};

export function CatalogItemsList() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      try {
        const response = await fetch("/api/super-admin/catalogue/items");
        const data = await response.json();
        if (data.items) {
          setItems(data.items);
        }
      } catch (error) {
        console.error("[catalog-items] Error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadItems();
  }, []);

  const itemTypeLabels = {
    module: "Module",
    parcours: "Parcours",
    ressource: "Ressource",
    test: "Test",
  };

  const itemTypeColors = {
    module: "bg-blue-100 text-blue-700",
    parcours: "bg-purple-100 text-purple-700",
    ressource: "bg-green-100 text-green-700",
    test: "bg-orange-100 text-orange-700",
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <Card className="border-black bg-white">
          <CardContent className="py-12 text-center text-gray-600">
            <p>Aucun item dans le catalogue pour le moment.</p>
            <p className="text-sm text-gray-500 mt-2">Ajoutez votre premier contenu ci-dessus.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="border-black bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${itemTypeColors[item.item_type]} border-black`}>
                        {itemTypeLabels[item.item_type]}
                      </Badge>
                      {item.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.category && (
                        <p className="text-sm text-gray-600">{item.category}</p>
                      )}
                      <Badge className="bg-blue-100 text-blue-700 border-black text-xs">
                        {item.target_audience === "pro" 
                          ? "Professionnels" 
                          : item.target_audience === "apprenant"
                          ? "Apprenants"
                          : "Tous publics"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`font-semibold ${item.is_free ? "text-green-600" : "text-gray-900"}`}>
                        Accès abonnement
                    </span>
                    <Badge
                      className={item.is_active ? "bg-green-100 text-green-700 border-black" : "bg-gray-100 text-gray-700 border-black"}
                    >
                      {item.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 border border-black text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border border-black text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

