import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  
  if (uerr || !user) {
    return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  }

  // Draft minimal
  const { data, error } = await supabase
    .from("formations")
    .insert({
      title: "Nouvelle formation",
      description: "",
      created_by: user.id
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating formation:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}



