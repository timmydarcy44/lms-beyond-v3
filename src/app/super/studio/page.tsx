import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Route, FileText, ClipboardList } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminStudioPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const studioItems = [
    {
      title: "Modules",
      description: "Gérer tous les modules (formations) de toutes les organisations",
      icon: BookOpen,
      href: "/super/studio/modules",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Parcours",
      description: "Gérer tous les parcours de toutes les organisations",
      icon: Route,
      href: "/super/studio/parcours",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Ressources",
      description: "Gérer toutes les ressources de toutes les organisations",
      icon: FileText,
      href: "/super/studio/ressources",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Tests",
      description: "Gérer tous les tests de toutes les organisations",
      icon: ClipboardList,
      href: "/super/studio/tests",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
            Studio de création
          </h1>
          <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
            Gérez tous les contenus de formation de toutes les organisations
          </p>
        </div>

        {/* Studio Items Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {studioItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.href} className="border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardHeader className={`bg-gradient-to-br ${item.color} text-white pb-4`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-white flex items-center gap-3">
                      <Icon className="h-6 w-6" />
                      {item.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-600 text-sm mb-6">{item.description}</p>
                  <Button asChild className="w-full">
                    <Link href={item.href}>
                      Accéder
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
    </main>
  );
}

