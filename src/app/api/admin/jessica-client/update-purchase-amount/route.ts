import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = (await request.json()) as {
      userId?: string;
      purchaseId?: string;
      amountEur?: number | string;
    };

    const userId = String(body.userId ?? "").trim();
    const purchaseId = String(body.purchaseId ?? "").trim();
    const amount = Number(body.amountEur);

    if (!userId || !purchaseId) {
      return NextResponse.json({ error: "userId et purchaseId requis" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const rounded = Math.round(amount * 100) / 100;

    if (purchaseId.startsWith("enrollment-")) {
      const enrollmentId = purchaseId.slice("enrollment-".length);
      const { data, error } = await supabase
        .from("course_enrollments")
        .update({ purchase_amount: rounded })
        .eq("id", enrollmentId)
        .eq("user_id", userId)
        .select("id, purchase_amount")
        .maybeSingle();

      if (error) {
        console.error("[jessica-client/revenue] enrollment update:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Inscription introuvable" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, purchaseAmount: data.purchase_amount });
    }

    const { data, error } = await supabase
      .from("catalog_access")
      .update({ purchase_amount: rounded })
      .eq("id", purchaseId)
      .eq("user_id", userId)
      .is("organization_id", null)
      .select("id, purchase_amount")
      .maybeSingle();

    if (error) {
      console.error("[jessica-client/revenue] catalog_access update:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Accès catalogue introuvable" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, purchaseAmount: data.purchase_amount });
  } catch (e) {
    console.error("[jessica-client/revenue]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: 500 },
    );
  }
}
