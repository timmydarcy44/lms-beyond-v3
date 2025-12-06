import { NextRequest, NextResponse } from "next/server";
import { sendPurchaseConfirmationEmail } from "@/lib/emails/send";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, resourceTitle, resourcePrice, resourceLink } = body;

    // Valeurs par défaut pour le test
    const testEmail = email || "timmdarcy44@gmail.com";
    const testFirstName = firstName || "Timmy";
    const testResourceTitle = resourceTitle || "Guide pratique : comprendre et résoudre les problématiques de sommeil des enfants de 3 à 11 ans";
    const testPrice = resourcePrice || 1.00;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
    const testResourceLink = resourceLink || `${baseUrl}/ressources/a8a82d15-044a-4d99-8918-29f4ac139071`;

    console.log("[test/send-purchase-email] Sending test purchase confirmation email:", {
      email: testEmail,
      firstName: testFirstName,
      resourceTitle: testResourceTitle,
      price: testPrice,
      resourceLink: testResourceLink,
    });

    const result = await sendPurchaseConfirmationEmail(
      testEmail,
      testFirstName,
      testResourceTitle,
      testPrice,
      new Date().toLocaleDateString("fr-FR"),
      testResourceLink
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email de confirmation d'achat envoyé avec succès",
        messageId: result.messageId,
        details: {
          email: testEmail,
          firstName: testFirstName,
          resourceTitle: testResourceTitle,
          price: testPrice,
          resourceLink: testResourceLink,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Erreur lors de l'envoi de l'email",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[test/send-purchase-email] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

