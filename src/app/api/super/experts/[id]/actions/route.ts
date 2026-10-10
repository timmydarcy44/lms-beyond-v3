import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import { isContributorRole, withContributorProfile, type ContributorRole } from "@/lib/expert/contributor-profile";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAdmin = await isSuperAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const action = body.action as string;

    const { data: expert, error: fetchError } = await supabase
      .from("experts")
      .select("id,is_active,references,specialties,certification_status,is_certified_beyond,is_care_expert")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !expert) {
      return NextResponse.json({ error: "Expert introuvable" }, { status: 404 });
    }

    let patch: Record<string, unknown> = {};
    let references = Array.isArray(expert.references) ? [...expert.references] : [];

    if (action === "toggle_active") {
      patch.is_active = !expert.is_active;
    } else if (action === "set_certified") {
      patch.certification_status = "certified";
      patch.is_certified_beyond = true;
    } else if (action === "toggle_care") {
      patch.is_care_expert = !Boolean(expert.is_care_expert);
    } else if (action === "set_assignments") {
      const known = new Map(CFA_SPECIALIZATIONS.map((item) => [item.value, item.label]));
      const knownLabels = new Set(known.values());
      const selected = Array.isArray(body.cursus)
        ? body.cursus.map((value: unknown) => String(value)).filter((value: string) => known.has(value))
        : [];
      const kept = Array.isArray(expert.specialties)
        ? expert.specialties.filter((item: unknown) => !knownLabels.has(String(item)))
        : [];
      patch.specialties = [...kept, ...selected.map((value: string) => known.get(value))];
      const badges = Array.isArray(body.openBadges) ? body.openBadges : [];
      patch.open_badges = badges
        .map((badge: { id?: unknown; name?: unknown }) => ({
          id: String(badge?.id ?? ""),
          name: String(badge?.name ?? ""),
        }))
        .filter((badge: { id: string; name: string }) => badge.id && badge.name);
      const roles = Array.isArray(body.roles)
        ? body.roles.map((value: unknown) => String(value)).filter(isContributorRole)
        : [];
      const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
      patch.headline = jobTitle || null;
      patch.references = withContributorProfile(references, { roles: roles as ContributorRole[], jobTitle });
    } else if (action === "add_note") {
      const note = typeof body.note === "string" ? body.note.trim() : "";
      if (!note) {
        return NextResponse.json({ error: "Note vide" }, { status: 400 });
      }
      references = [
        ...references,
        { _type: "edge_review_note", action: "internal_note", message: note, at: new Date().toISOString() },
      ];
      patch.references = references;
    } else {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const { error: updateError } = await supabase.from("experts").update(patch).eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    revalidatePath("/super/experts");
    revalidatePath(`/super/experts/${id}`);
    revalidatePath("/admin/experts");
    revalidatePath(`/admin/experts/${id}`);
    if (action === "set_assignments") {
      revalidatePath("/ecole/ntc/ai-business");
      revalidatePath("/ecole/ntc/business-sport");
      revalidatePath("/edge-lab/ecole/ntc/ai-business");
      revalidatePath("/edge-lab/ecole/ntc/business-sport");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/super/experts/actions] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
