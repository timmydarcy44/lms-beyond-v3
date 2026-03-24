import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const getRequestIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }
  return request.headers.get("x-real-ip");
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path : "";
    if (!path) {
      return NextResponse.json({ error: "Path manquant" }, { status: 400 });
    }

    const ip = getRequestIp(request) || "unknown";
    const adminIp = process.env.MY_ADMIN_IP;
    if (adminIp && ip === adminIp) {
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const { error } = await supabase.from("page_views").insert({
      path,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[page-view] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[page-view] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
