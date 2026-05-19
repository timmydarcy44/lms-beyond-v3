import { notFound, redirect } from "next/navigation";

import { FormateurPathBuilderWorkspace } from "@/components/formateur/path-builder/formateur-path-builder-workspace";
import { getFormateurContentLibrary, getFormateurOrganizations } from "@/lib/queries/formateur";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ pathId: string }>;
};

export default async function FormateurPathEditPage({ params }: PageProps) {
  const { pathId } = await params;

  if (!pathId) {
    notFound();
  }

  // Vérifier que le parcours existe et appartient au formateur
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) {
    redirect("/login");
  }

  const service = getServiceRoleClient();
  const admin = service ?? (await getServiceRoleClientOrFallback());
  const db = admin ?? supabase;

  const selectAttempts = [
    // certains environnements n'ont pas `owner_id` sur `paths`
    "id, title, description, status, creator_id, owner_id, org_id, path_snapshot, cover_image",
    "id, title, description, status, creator_id, owner_id, org_id, path_snapshot",
    "id, title, description, status, creator_id, owner_id, path_snapshot",
    "id, title, description, creator_id, owner_id, org_id, path_snapshot",
    "id, title, creator_id, owner_id, org_id, path_snapshot",
    // fallbacks sans owner_id
    "id, title, description, status, creator_id, org_id, path_snapshot, cover_image",
    "id, title, description, status, creator_id, org_id, path_snapshot",
    "id, title, description, creator_id, org_id, path_snapshot",
    "id, title, creator_id, org_id, path_snapshot",
    "id, title, creator_id, path_snapshot",
  ];

  let path: any = null;
  let lastErr: any = null;
  let lastMeta: Record<string, unknown> | null = null;
  for (const sel of selectAttempts) {
    // `maybeSingle()` peut renvoyer `data: null` sans `error` si 0 ligne (ex: RLS) :
    // on utilise `limit(1)` pour distinguer "0 ligne" vs erreurs.
    const res = await db.from("paths").select(sel).eq("id", pathId).limit(1).maybeSingle();
    lastMeta = {
      select: sel,
      hasError: Boolean(res.error),
      hasData: Boolean(res.data),
      errorCode: (res.error as any)?.code ?? null,
      errorMessage: (res.error as any)?.message ?? null,
      usingServiceRole: Boolean(service),
    };
    if (res.error) {
      lastErr = res.error;
      const code = String((res.error as any)?.code ?? "");
      const msg = String((res.error as any)?.message ?? "");
      if (code && code !== "42703" && !/column .* does not exist/i.test(msg)) break;
      continue;
    }
    if (res.data) {
      path = res.data;
      break;
    }
  }

  if (!path) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[parcours/edit] Impossible de charger paths",
        JSON.stringify(
          {
            pathId,
            lastErr: lastErr
              ? { code: (lastErr as any)?.code, message: (lastErr as any)?.message, details: (lastErr as any)?.details }
              : null,
            lastMeta,
            hint:
              !service && process.env.NODE_ENV !== "production"
                ? "SUPABASE_SERVICE_ROLE_KEY manquant : la lecture `paths` peut être vide à cause du RLS (data=null sans error)."
                : null,
          },
          null,
          2,
        ),
      );
    }
    notFound();
  }

  // Vérifier l'accès:
  // - super-admin => OK
  // - sinon: créateur/propriétaire OU staff dans l'org du parcours.
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    const creatorId = String((path as any).creator_id ?? "").trim();
    const ownerId = String((path as any).owner_id ?? "").trim(); // peut être vide si colonne absente
    const orgId = String((path as any).org_id ?? "").trim();
    const isOwner = creatorId === authData.user.id || ownerId === authData.user.id;
    let isStaffInOrg = false;
    if (orgId) {
      const { data: m } = await db
        .from("org_memberships")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", authData.user.id)
        .maybeSingle();
      const role = String((m as any)?.role ?? "").toLowerCase().trim();
      isStaffInOrg = ["admin", "instructor", "formateur", "trainer", "owner", "staff"].includes(role);
    }
    // Fallback EDGE Lab: profil rattaché à l'org (sans membership explicite)
    let profileMatchesOrg = false;
    if (orgId) {
      const { data: prof } = await supabase.from("profiles").select("org_id, role").eq("id", authData.user.id).maybeSingle();
      const pOrg = String((prof as any)?.org_id ?? "").trim();
      profileMatchesOrg = Boolean(pOrg && pOrg === orgId);
    }
    if (!isOwner && !isStaffInOrg && !profileMatchesOrg) notFound();
  }

  // Données initiales dans `path_snapshot`.
  const snapshot = (path as any).path_snapshot ?? null;
  const steps = Array.isArray(snapshot?.steps) ? snapshot.steps : [];
  const selectedCourses = steps
    .filter((s: any) => s?.content_kind === "course" && s?.content_id)
    .map((s: any) => String(s.content_id));
  const selectedTests = steps
    .filter((s: any) => s?.content_kind === "test" && s?.content_id)
    .map((s: any) => String(s.content_id));
  const selectedResources = steps
    .filter((s: any) => s?.content_kind === "resource" && s?.content_id)
    .map((s: any) => String(s.content_id));

  const initialTitle = snapshot?.title || path.title || "";
  const initialSubtitle = snapshot?.subtitle || path.description || "";
  const initialObjective = snapshot?.objective || "";
  const initialPresentation = snapshot?.presentation || path.description || "";
  const initialCoverImage = snapshot?.cover_image || (path as any)?.cover_image || "";
  const initialTools = Array.isArray(snapshot?.tools) ? snapshot.tools : [];

  const [library, organizations] = await Promise.all([
    getFormateurContentLibrary(),
    getFormateurOrganizations(),
  ]);

  return (
    <FormateurPathBuilderWorkspace
      library={library}
      organizations={organizations}
      initialData={{
        pathId: path.id,
        title: initialTitle,
        subtitle: initialSubtitle,
        objective: initialObjective,
        selectedCourses,
        selectedTests,
        selectedResources,
        status: path.status as "draft" | "published",
        builderSnapshot: {
          ...(snapshot && typeof snapshot === "object" ? snapshot : {}),
          presentation: initialPresentation,
          cover_image: initialCoverImage,
          tools: initialTools,
        },
        orgId: (path as any).org_id ? String((path as any).org_id) : null,
      }}
    />
  );
}









