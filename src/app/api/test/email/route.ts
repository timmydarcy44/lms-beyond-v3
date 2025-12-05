import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/emails/brevo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, htmlContent } = body;

    if (!to || !subject || !htmlContent) {
      return NextResponse.json(
        { error: "to, subject, et htmlContent sont requis" },
        { status: 400 }
      );
    }

    console.log("[test/email] Testing email send to:", to);
    
    const result = await sendEmail({
      to,
      subject,
      htmlContent,
      textContent: htmlContent.replace(/<[^>]*>/g, ""),
      tags: ["test"],
    });

    console.log("[test/email] Email send result:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[test/email] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

