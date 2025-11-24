import { NextRequest, NextResponse } from "next/server";
import { sendSignupConfirmationEmail } from "@/lib/emails/send";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, confirmationLink } = await request.json();

    if (!email || !confirmationLink) {
      return NextResponse.json(
        { error: "Email and confirmationLink are required" },
        { status: 400 }
      );
    }

    const result = await sendSignupConfirmationEmail(
      email,
      firstName || null,
      confirmationLink
    );

    if (!result.success) {
      console.error("[api/emails/send-signup-confirmation] Error:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error("[api/emails/send-signup-confirmation] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

