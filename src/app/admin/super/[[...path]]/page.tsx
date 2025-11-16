import { redirect } from "next/navigation";

/**
 * Redirection automatique de /admin/super/* vers /super/*
 * Cette page catch-all redirige toutes les routes /admin/super vers /super
 */
export default async function AdminSuperRedirect({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const newPath = path.length > 0 ? `/super/${path.join("/")}` : "/super";
  redirect(newPath);
}

