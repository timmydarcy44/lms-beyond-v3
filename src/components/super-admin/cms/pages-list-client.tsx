"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Edit, Eye, EyeOff, Trash2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type CMSPage = {
  id: string;
  slug: string;
  title: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

type PagesListClientProps = {
  initialPages: CMSPage[];
};

export function PagesListClient({ initialPages }: PagesListClientProps) {
  const [pages, setPages] = useState<CMSPage[]>(initialPages);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette page ?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/cms/pages/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      setPages(pages.filter((p) => p.id !== id));
      toast.success("Page supprimée avec succès");
    } catch (error) {
      console.error("[pages-list] Error deleting page:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/cms/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      setPages(
        pages.map((p) => (p.id === id ? { ...p, is_published: !currentStatus } : p))
      );
      toast.success(currentStatus ? "Page dépubliée" : "Page publiée");
    } catch (error) {
      console.error("[pages-list] Error toggling publish:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Globe className="h-6 w-6 text-gray-400" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Pages du site
            </h2>
            <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              {pages.length} page{pages.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/super/pages/new">
            <Plus className="mr-2 h-4 w-4" />
            Créer une page
          </Link>
        </Button>
      </div>

      {pages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Aucune page créée pour le moment
            </p>
            <Button asChild>
              <Link href="/super/pages/new">
                <Plus className="mr-2 h-4 w-4" />
                Créer votre première page
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pages.map((page) => (
            <Card key={page.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        {page.title}
                      </CardTitle>
                      {page.is_published ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <Eye className="mr-1 h-3 w-3" />
                          Publiée
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="mr-1 h-3 w-3" />
                          Brouillon
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 font-mono" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                      /{page.slug}
                    </p>
                    {page.meta_description && (
                      <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                        {page.meta_description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(page.id, page.is_published)}
                    >
                      {page.is_published ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/super/pages/${page.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(page.id)}
                      disabled={deletingId === page.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}




