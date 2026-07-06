import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { generateAccompagnementSlots } from "@/lib/particulier/accompagnement-booking";
import { getTakenAccompagnementSlots } from "@/lib/particulier/accompagnement-slot-lock";

export async function GET() {
  try {
    const service = getServiceRoleClient();
    const slots = generateAccompagnementSlots();
    if (!service) {
      return NextResponse.json({ slots: slots.map((s) => ({ ...s, available: true })) });
    }

    const taken = await getTakenAccompagnementSlots(service);
    return NextResponse.json({
      slots: slots.map((s) => ({
        ...s,
        available: !taken.has(s.id),
      })),
    });
  } catch (error) {
    console.error("[edge/accompagnement/slots]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
