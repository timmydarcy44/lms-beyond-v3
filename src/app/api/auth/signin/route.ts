import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Utiliser le client Supabase côté serveur existant
    const supabase = await getServerClient();
    
    if (!supabase) {
      console.error("[api/auth/signin] Failed to get Supabase client");
      return NextResponse.json(
        { error: "Configuration Supabase manquante" },
        { status: 500 }
      );
    }

    console.log("[api/auth/signin] Attempting sign in for:", email);

    const startTime = Date.now();
    
    // Essayer la connexion avec un timeout plus long (30 secondes) car Supabase peut être lent
    let data, error;
    try {
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout: La connexion a pris plus de 30 secondes. Vérifiez votre connexion internet et l'état de Supabase.")), 30000);
      });
      
      const result = await Promise.race([signInPromise, timeoutPromise]);
      data = result.data;
      error = result.error;
    } catch (timeoutError) {
      console.error("[api/auth/signin] Timeout or error:", timeoutError);
      
      // Si c'est un timeout, suggérer de vérifier Supabase
      if (timeoutError instanceof Error && timeoutError.message.includes("Timeout")) {
        return NextResponse.json(
          { 
            error: "La connexion à Supabase prend trop de temps. Cela peut indiquer un problème réseau ou un problème avec votre projet Supabase. Vérifiez que votre projet est actif dans le dashboard Supabase.",
            code: "TIMEOUT"
          },
          { status: 408 }
        );
      }
      
      // Autre erreur
      return NextResponse.json(
        { error: timeoutError instanceof Error ? timeoutError.message : "Erreur de connexion" },
        { status: 500 }
      );
    }
    
    const duration = Date.now() - startTime;
    console.log("[api/auth/signin] signInWithPassword completed in", duration, "ms");

    if (error) {
      console.error("[api/auth/signin] Auth error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data?.session) {
      console.error("[api/auth/signin] No session returned");
      return NextResponse.json(
        { error: "Aucune session créée" },
        { status: 401 }
      );
    }

    console.log("[api/auth/signin] ✅ Sign in successful for:", data.user.email);
    console.log("[api/auth/signin] Session token length:", data.session.access_token?.length);

    // Retourner la session pour que le client puisse la stocker
    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error("[api/auth/signin] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur inattendue" },
      { status: 500 }
    );
  }
}

