import { redirect } from "next/navigation";

/**
 * Layout pour /admin/super - Redirige automatiquement vers /super
 * Cette route est maintenue pour la compatibilité mais redirige vers /super
 * La redirection réelle est gérée par la page catch-all [[...path]]/page.tsx
 */
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cette page ne devrait jamais être rendue car la page catch-all redirige avant
  // Mais on redirige quand même par sécurité
  redirect("/super");
}


