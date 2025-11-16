import { NextResponse } from "next/server";
import { getSuperAdminBranding } from "@/lib/queries/super-admin-branding";

export async function GET() {
  try {
    const branding = await getSuperAdminBranding();
    return NextResponse.json(branding);
  } catch (error) {
    console.error("[api/super-admin/branding] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch branding" },
      { status: 500 }
    );
  }
}



