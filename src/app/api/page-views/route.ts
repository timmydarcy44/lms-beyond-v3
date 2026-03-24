import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceRoleClient } from "@/lib/supabase/server";

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "";
  }
  return request.headers.get("x-real-ip") || "";
};

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const ip = getClientIp(request);
    const adminIp = process.env.MY_ADMIN_IP || "";
    if (adminIp && ip && ip === adminIp) {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 });
    }

    const { path, referrer } = (await request.json().catch(() => ({}))) as {
      path?: string;
      referrer?: string;
    };

    const userAgent = request.headers.get("user-agent") || "";
    const visitorId = crypto
      .createHash("sha256")
      .update(`${ip}|${userAgent}`)
      .digest("hex");

    const { error } = await supabase.from("page_views").insert({
      path: path || "/",
      referrer: referrer || null,
      visitor_id: visitorId,
      user_agent: userAgent,
      ip_address: ip || null,
    });

    if (error && error.code !== "42P01") {
      console.error("[page_views] insert error:", error);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[page_views] error:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
