import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, FileText, Video, Edit, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminCatalogueJessicaPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const supabase = await getServiceRoleClientOrFallback();
  
  if (!supabase) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Erreur de connexion à la base de données</p>
          </div>
        </main>
      </div>
    );
  }

  // Récupérer l'ID de Jessica Contentin
  const { data: jessicaProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  if (profileError || !jessicaProfile) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Profil Jessica Contentin non trouvé</p>
          </div>
        </main>
      </div>
    );
  }

  // Récupérer tous les catalog_items de Jessica (actifs et inactifs)
  const { data: catalogItems, error: itemsError } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("creator_id", jessicaProfile.id)
    .order("created_at", { ascending: false });

  if (itemsError) {
    console.error("[super-admin/catalogue-jessica] Error fetching catalog items:", itemsError);
  }

  const items = catalogItems || [];
  const activeCount = items.filter((item: any) => item.is_active).length;
  const inactiveCount = items.filter((item: any) => !item.is_active).length;

  // Fonction pour obtenir l'URL d'édition selon le type
  const getEditUrl = (item: any) => {
    if (item.item_type === "module") {
      // Pour les modules, utiliser l'ID du catalog_item pour trouver le course_id
      // ou utiliser directement content_id si c'est l'ID du course
      return `/super/studio/modules/${item.content_id}/structure`;
    } else if (item.item_type === "ressource") {
      return `/super/studio/ressources/${item.content_id}/edit`;
    } else if (item.item_type === "test") {
      return `/super/studio/tests/${item.content_id}/edit`;
    }
    return "#";
  };

  // Fonction pour obtenir l'icône selon le type
  const getIcon = (itemType: string) => {
    switch (itemType) {
      case "module":
        return BookOpen;
      case "ressource":
        return FileText;
      case "test":
        return Video;
      default:
        return FileText;
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 
            className="text-5xl font-semibold bg-gradient-to-r from-[#C6A664] to-[#B88A44] bg-clip-text text-transparent mb-3"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            Catalogue
          </h1>
          <p 
            className="text-gray-600 text-lg"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            Gérez toutes vos ressources
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/super/studio/modules/new"
            className="flex items-center gap-2 px-6 py-3 bg-[#C6A664] text-white rounded-lg hover:bg-[#B88A44] transition-all shadow-lg hover:shadow-xl"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Nouveau module</span>
          </Link>
          <Link
            href="/super/studio/ressources/new"
            className="flex items-center gap-2 px-6 py-3 bg-[#C6A664] text-white rounded-lg hover:bg-[#B88A44] transition-all shadow-lg hover:shadow-xl"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Nouvelle ressource</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-[#E6D9C6] bg-gradient-to-br from-[#F8F5F0] to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#2F2A25] font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Total ressources
              </span>
              <FileText className="h-6 w-6 text-[#C6A664]" />
            </div>
            <div className="text-4xl font-bold text-[#2F2A25]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              {items.length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E6D9C6] bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-600 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Publiées
              </span>
              <BookOpen className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-4xl font-bold text-emerald-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              {activeCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E6D9C6] bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Brouillons
              </span>
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
            <div className="text-4xl font-bold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              {inactiveCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des ressources */}
      {items.length === 0 ? (
        <Card className="border-[#E6D9C6] bg-[#F8F5F0]">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Aucune ressource</p>
            <p className="text-gray-500 text-sm">Créez votre première ressource pour commencer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item: any) => {
            const Icon = getIcon(item.item_type);
            const editUrl = getEditUrl(item);
            
            return (
              <Link
                key={item.id}
                href={editUrl}
                className="block"
              >
                <Card className="border-[#E6D9C6] bg-white hover:shadow-xl transition-all cursor-pointer group h-full">
                  <CardContent className="p-0">
                    {/* Image */}
                    {(item.hero_image_url || item.thumbnail_url) && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={item.hero_image_url || item.thumbnail_url || ""}
                          alt={item.title || "Ressource"}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            item.is_active 
                              ? "bg-emerald-500 text-white" 
                              : "bg-gray-500 text-white"
                          }`}>
                            {item.is_active ? "Publié" : "Brouillon"}
                          </span>
                        </div>
                        {item.category && (
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#C6A664] text-white">
                              {item.category}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Contenu */}
                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-[#E6D9C6]/30 rounded-lg">
                          <Icon className="h-5 w-5 text-[#C6A664]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#2F2A25] mb-1 line-clamp-2 group-hover:text-[#C6A664] transition-colors" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                            {item.title || "Sans titre"}
                          </h3>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            {item.item_type === "module" ? "Module" : item.item_type === "ressource" ? "Ressource" : "Test"}
                          </p>
                        </div>
                      </div>
                      
                      {(item.short_description || item.description) && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                          {item.short_description || item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-[#E6D9C6]">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Edit className="h-4 w-4" />
                          <span>Modifier</span>
                        </div>
                        {item.is_free ? (
                          <span className="text-sm font-semibold text-emerald-600">Gratuit</span>
                        ) : (
                          <span className="text-sm font-semibold text-[#C6A664]">{item.price} €</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

