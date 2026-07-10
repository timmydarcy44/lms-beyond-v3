import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { getGoogleCalendarAuthUrl } from "@/lib/jessica-contentin/google-calendar";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";

export async function GET() {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Non configuré" }, { status: 500 });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email || user.email.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const url = getGoogleCalendarAuthUrl(user.id);
    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Configuration Google manquante" },
      { status: 500 },
    );
  }
}
