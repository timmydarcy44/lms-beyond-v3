"use client";

import { useState, useEffect } from "react";
import { Plus, Store, BookOpen, Route, FileText, ClipboardList, Settings, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogItemsList } from "./catalog-items-list";
import { CatalogAccessManager } from "./catalog-access-manager";
import { UserTestAccessManager } from "./user-test-access-manager";
import { AddCatalogItemModal } from "./add-catalog-item-modal";

export function CatalogManagementView() {
  const [activeTab, setActiveTab] = useState("items");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<"module" | "parcours" | "ressource" | "test" | null>(null);

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-black bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Items</CardTitle>
            <Store className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <p className="text-xs text-gray-500">Items dans le catalogue</p>
          </CardContent>
        </Card>
        <Card className="border-black bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <p className="text-xs text-gray-500">Modules disponibles</p>
          </CardContent>
        </Card>
        <Card className="border-black bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Parcours</CardTitle>
            <Route className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <p className="text-xs text-gray-500">Parcours disponibles</p>
          </CardContent>
        </Card>
        <Card className="border-black bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Accès accordés</CardTitle>
            <Gift className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <p className="text-xs text-gray-500">Organisations avec accès</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card className="border-black bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                window.location.href = "/super/studio/modules/new";
              }}
              className="rounded-full border border-black bg-white text-gray-900 hover:bg-gray-50"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Créer un nouveau module
            </Button>
            <Button
              onClick={() => {
                setSelectedItemType("parcours");
                setShowAddModal(true);
              }}
              className="rounded-full border border-black bg-white text-gray-900 hover:bg-gray-50"
            >
              <Route className="mr-2 h-4 w-4" />
              Ajouter un parcours
            </Button>
            <Button
              onClick={() => {
                setSelectedItemType("ressource");
                setShowAddModal(true);
              }}
              className="rounded-full border border-black bg-white text-gray-900 hover:bg-gray-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Ajouter une ressource
            </Button>
            <Button
              onClick={() => {
                setSelectedItemType("test");
                setShowAddModal(true);
              }}
              className="rounded-full border border-black bg-white text-gray-900 hover:bg-gray-50"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Ajouter un test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border-black">
          <TabsTrigger value="items" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Items du catalogue
          </TabsTrigger>
          <TabsTrigger value="access" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Accès organisations
          </TabsTrigger>
          <TabsTrigger value="user-access" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
            Accès utilisateurs (Test Confiance)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <CatalogItemsList />
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <CatalogAccessManager />
        </TabsContent>

        <TabsContent value="user-access" className="space-y-4">
          <UserTestAccessManager />
        </TabsContent>
      </Tabs>

      {/* Modal d'ajout */}
      {showAddModal && selectedItemType && (
        <AddCatalogItemModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          itemType={selectedItemType}
        />
      )}
    </div>
  );
}

